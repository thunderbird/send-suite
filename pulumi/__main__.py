#!/bin/env python3

import pulumi
import pulumi_aws as aws
import pulumi_cloudflare as cloudflare
import tb_pulumi
import tb_pulumi.ci
import tb_pulumi.cloudfront
import tb_pulumi.cloudwatch
import tb_pulumi.fargate
import tb_pulumi.network
import tb_pulumi.rds
import tb_pulumi.secrets


CLOUDFRONT_REWRITE_CODE_FILE = 'cloudfront-rewrite.js'
EXCLUDE_ROUTE53_STACKS = ['prod', 'stage']  # Do not build R53 records for these environments
INCLUDE_CLOUDFLARE_STACKS = ['prod', 'stage']  # Do build CloudFlare records for these environments

project = tb_pulumi.ThunderbirdPulumiProject()
resources = project.config.get('resources')
cloudflare_zone_id = (
    project.pulumi_config.require_secret('cloudflare_zone_id') if project.stack in INCLUDE_CLOUDFLARE_STACKS else None
)
route53_zone_id = (
    project.pulumi_config.require_secret('route53_zone_id') if project.stack not in EXCLUDE_ROUTE53_STACKS else None
)

# Copy select secrets from Pulumi into AWS Secrets Manager
pulumi_sm_opts = resources['tb:secrets:PulumiSecretsManager']['pulumi']
pulumi_sm = tb_pulumi.secrets.PulumiSecretsManager(
    name=f'{project.name_prefix}-secrets', project=project, **pulumi_sm_opts
)

# Build the networking landscape
vpc_opts = resources['tb:network:MultiCidrVpc']['vpc']
vpc = tb_pulumi.network.MultiCidrVpc(name=f'{project.name_prefix}-vpc', project=project, **vpc_opts)

# Build a securiyt group allowing access to the load balancer
sg_lb_opts = resources['tb:network:SecurityGroupWithRules']['backend-lb']
sg_lb = tb_pulumi.network.SecurityGroupWithRules(
    name=f'{project.name_prefix}-backend-lb-sg',
    project=project,
    vpc_id=vpc.resources['vpc'].id,
    opts=pulumi.ResourceOptions(depends_on=[vpc]),
    **sg_lb_opts,
)

# Build a security group allowing access from the load balancer to the container when we know its ID
sg_cont_opts = resources['tb:network:SecurityGroupWithRules']['backend-container']
sg_cont_opts['rules']['ingress'][0]['source_security_group_id'] = sg_lb.resources['sg'].id
sg_container = tb_pulumi.network.SecurityGroupWithRules(
    name=f'{project.name_prefix}-container-sg',
    project=project,
    vpc_id=vpc.resources['vpc'].id,
    opts=pulumi.ResourceOptions(depends_on=[sg_lb, vpc]),
    **sg_cont_opts,
)


# Only build an RDS database cluster with a jumphost in the CI environment, so we can verify this part of our codebase
if project.stack == 'ci':
    db_opts = resources['tb:rds:RdsDatabaseGroup']['citest']
    db = tb_pulumi.rds.RdsDatabaseGroup(
        name=f'{project.name_prefix}-rds',
        project=project,
        db_name='dbtest',
        subnets=vpc.resources['subnets'],
        vpc_cidr=vpc.resources['vpc'].cidr_block,
        vpc_id=vpc.resources['vpc'].id,
        opts=pulumi.ResourceOptions(depends_on=[vpc]),
        **db_opts,
    )

# Create a Fargate cluster
backend_fargate_opts = resources['tb:fargate:FargateClusterWithLogging']['backend']
backend_subnets = [subnet for subnet in vpc.resources['subnets']]
backend_fargate = tb_pulumi.fargate.FargateClusterWithLogging(
    name=f'{project.name_prefix}-fargate',
    project=project,
    subnets=backend_subnets,
    container_security_groups=[sg_container.resources['sg'].id],
    load_balancer_security_groups=[sg_lb.resources['sg'].id],
    opts=pulumi.ResourceOptions(
        depends_on=[
            *vpc.resources['subnets'],
            sg_container,
            sg_lb,
            pulumi_sm,
        ]
    ),
    **backend_fargate_opts,
)

# Sometimes create a DNS record pointing to the backend service
route53_backend_record = (
    aws.route53.Record(
        f'{project.name_prefix}-dns-backend',
        zone_id=route53_zone_id,
        name=resources['domains']['backend'],
        type=aws.route53.RecordType.CNAME,
        ttl=60,  # ttl units are *seconds*
        records=[backend_fargate.resources['fargate_service_alb'].resources['albs']['send-suite'].dns_name],
        opts=pulumi.ResourceOptions(depends_on=[backend_fargate]),
    )
    if project.stack not in EXCLUDE_ROUTE53_STACKS
    else None
)

# Special case where prod DNS is hosted at CloudFlare
cloudflare_backend_record = (
    cloudflare.Record(
        f'{project.name_prefix}-dns-backend',
        zone_id=cloudflare_zone_id,
        name=resources['domains']['backend'],
        type='CNAME',
        content=backend_fargate.resources['fargate_service_alb'].resources['albs']['send-suite'].dns_name,
        proxied=False,
        ttl=1,  # ttl units are *minutes*
    )
    if project.stack in INCLUDE_CLOUDFLARE_STACKS
    else None
)

# Manage the CloudFront rewrite function; the code is managed in cloudfront-rewrite.js
rewrite_code = None
try:
    with open(CLOUDFRONT_REWRITE_CODE_FILE, 'r') as fh:
        rewrite_code = fh.read()
except IOError:
    pulumi.error(f'Could not read file {CLOUDFRONT_REWRITE_CODE_FILE}')

cf_func = aws.cloudfront.Function(
    f'{project.name_prefix}-func-rewrite',
    code=rewrite_code,
    comment='Rewrites inbound requests to direct them to the send-suite backend API',
    name=f'{project.name_prefix}-rewrite',
    publish=True,
    runtime='cloudfront-js-2.0',
)
project.resources['cf_rewrite_function'] = cf_func

# Deliver frontend content via CloudFront
frontend_opts = resources['tb:cloudfront:CloudFrontS3Service']['frontend']
frontend = tb_pulumi.cloudfront.CloudFrontS3Service(
    name=f'{project.name_prefix}-frontend',
    project=project,
    default_function_associations=[{'event_type': 'viewer-request', 'function_arn': cf_func.arn}],
    **frontend_opts,
    opts=pulumi.ResourceOptions(depends_on=[cf_func]),
)

# Sometimes create a DNS record pointing to the frontend service
route53_frontend_record = (
    aws.route53.Record(
        f'{project.name_prefix}-dns-frontend',
        zone_id=route53_zone_id,
        name=resources['domains']['frontend'],
        type=aws.route53.RecordType.CNAME,
        ttl=60,  # ttl units are *seconds*
        records=[frontend.resources['cloudfront_distribution'].domain_name],
        opts=pulumi.ResourceOptions(depends_on=[frontend.resources['cloudfront_distribution']]),
    )
    if project.stack not in EXCLUDE_ROUTE53_STACKS
    else None
)

# Special case where prod DNS is hosted at CloudFlare
cloudflare_frontend_record = (
    cloudflare.Record(
        f'{project.name_prefix}-dns-frontend',
        zone_id=cloudflare_zone_id,
        name=resources['domains']['frontend'],
        type='CNAME',
        content=frontend.resources['cloudfront_distribution'].domain_name,
        proxied=False,
        ttl=1,  # ttl units are *minutes*
    )
    if project.stack in INCLUDE_CLOUDFLARE_STACKS
    else None
)


# This is only managed by a single stack, so a configuration may not exist for it
if 'tb:ci:AwsAutomationUser' in resources and 'ci' in resources['tb:ci:AwsAutomationUser']:
    ci_opts = resources['tb:ci:AwsAutomationUser']['ci']
    ci_iam = tb_pulumi.ci.AwsAutomationUser(name=f'{project.project}-ci', project=project, **ci_opts)

monitoring_opts = resources['tb:cloudwatch:CloudWatchMonitoringGroup']
monitoring = tb_pulumi.cloudwatch.CloudWatchMonitoringGroup(
    name=f'{project.name_prefix}-monitoring',
    project=project,
    notify_emails=monitoring_opts['notify_emails'],
    config=monitoring_opts,
)
