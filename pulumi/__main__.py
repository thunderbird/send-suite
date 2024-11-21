#!/bin/env python3

import pulumi
import pulumi_aws as aws
import tb_pulumi
import tb_pulumi.ci
import tb_pulumi.cloudfront
import tb_pulumi.cloudwatch
import tb_pulumi.fargate
import tb_pulumi.network
import tb_pulumi.rds
import tb_pulumi.secrets


CLOUDFRONT_REWRITE_CODE_FILE = 'cloudfront-rewrite.js'


project = tb_pulumi.ThunderbirdPulumiProject()
resources = project.config.get('resources')

# Copy select secrets from Pulumi into AWS Secrets Manager
pulumi_sm_opts = resources['tb:secrets:PulumiSecretsManager']['pulumi']
pulumi_sm = tb_pulumi.secrets.PulumiSecretsManager(f'{project.name_prefix}-secrets', project, **pulumi_sm_opts)

# Build the networking landscape
vpc_opts = resources['tb:network:MultiCidrVpc']['vpc']
vpc = tb_pulumi.network.MultiCidrVpc(f'{project.name_prefix}-vpc', project, **vpc_opts)

# Build firewall rules
backend_sg_opts = resources['tb:network:SecurityGroupWithRules']['backend']
backend_sg = tb_pulumi.network.SecurityGroupWithRules(
    f'{project.name_prefix}-backend-sg',
    project,
    vpc_id=vpc.resources['vpc'].id,
    **backend_sg_opts,
    opts=pulumi.ResourceOptions(depends_on=[vpc]),
)

# Create a Fargate cluster
backend_fargate_opts = resources['tb:fargate:FargateClusterWithLogging']['backend']
backend_subnets = [subnet for subnet in vpc.resources['subnets']]
backend_fargate = tb_pulumi.fargate.FargateClusterWithLogging(
    f'{project.name_prefix}-fargate',
    project,
    backend_subnets,
    security_groups=[backend_sg.resources['sg']],
    opts=pulumi.ResourceOptions(
        depends_on=[*vpc.resources['subnets'], backend_sg.resources['sg'], *backend_subnets, pulumi_sm]
    ),
    **backend_fargate_opts,
)

# Create a DNS record pointing to the backend service
backend_dns = aws.route53.Record(
    f'{project.name_prefix}-dns-backend',
    zone_id='Z03528753AZVULC8BFCA',  # thunderbird.dev
    name=resources['domains']['backend'],
    # Delete this record once this issue is resolved, deferring to the CloudFront rewrite instead
    # https://bugzilla.mozilla.org/show_bug.cgi?id=1866867
    type=aws.route53.RecordType.CNAME,
    ttl=60,
    records=[backend_fargate.resources['fargate_service_alb'].resources['albs']['send-suite'].dns_name],
    opts=pulumi.ResourceOptions(depends_on=[backend_fargate]),
)

frontend_opts = resources['tb:cloudfront:CloudFrontS3Service']['frontend']
frontend = tb_pulumi.cloudfront.CloudFrontS3Service(
    # behaviors=behaviors,
    name=f'{project.name_prefix}-frontend',
    project=project,
    # origins=[api_origin],
    **frontend_opts,
)

# Create a DNS record pointing to the frontend service
frontend_dns = aws.route53.Record(
    f'{project.name_prefix}-dns-frontend',
    zone_id='Z03528753AZVULC8BFCA',  # thunderbird.dev
    name=resources['domains']['frontend'],
    type=aws.route53.RecordType.CNAME,
    ttl=60,
    records=[frontend.resources['cloudfront_distribution'].domain_name],
    opts=pulumi.ResourceOptions(depends_on=[frontend.resources['cloudfront_distribution']]),
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
