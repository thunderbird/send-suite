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
    opts=pulumi.ResourceOptions(depends_on=vpc),
)

# Copy select secrets from Pulumi into AWS Secrets Manager
pulumi_sm_opts = resources['tb:secrets:PulumiSecretsManager']['pulumi']
pulumi_sm = tb_pulumi.secrets.PulumiSecretsManager(
    f'{project.name_prefix}-secrets', project, **pulumi_sm_opts, opts=pulumi.ResourceOptions(depends_on=vpc)
)

# NOTE: AWS Secrets Manager doesn't delete secrets right away, in case you accidentally delete
#     something and need to recover it. If you delete a secret (leaving it pending deletion for a few
#     days) and then try to create another by the same name, that creates a conflict. Because of
#     this, secret ARNs get a randomized suffix added to them. This is done by AWS, and there is
#     nothing we can do about it. Later, we use these ARNs as part of the task definition for the
#     following Fargate cluster. You will probably have to run a `pulumi up` to create the secrets,
#     then update the config file with the proper ARNs.

# Create a Fargate cluster
backend_fargate_opts = resources['tb:fargate:FargateClusterWithLogging']['backend']
backend_fargate = tb_pulumi.fargate.FargateClusterWithLogging(
    f'{project.name_prefix}-fargate',
    project,
    [subnet for subnet in vpc.resources['subnets']],
    security_groups=[backend_sg.resources['sg']],
    opts=pulumi.ResourceOptions(depends_on=[vpc, pulumi_sm]),
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

# Deliver frontend content via CloudFront; Ref:
# https://www.pulumi.com/registry/packages/aws/api-docs/cloudfront/distribution/#distributionorigincustomoriginconfig
api_origin = {
    'origin_id': f'{project.name_prefix}-api',
    'domain_name': backend_fargate.resources['fargate_service_alb'].resources['albs']['send-suite'].dns_name,
    'custom_origin_config': {
        'http_port': 80,
        'https_port': 443,
        'origin_protocol_policy': 'https-only',
        'origin_ssl_protocols': ['TLSv1.2'],
    },
}

behaviors = [
    {
        'allowed_methods': ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
        'cache_policy_id': tb_pulumi.cloudfront.CACHE_POLICY_ID_DISABLED,
        'cached_methods': ['GET', 'HEAD', 'OPTIONS'],
        'function_associations': [{'event_type': 'viewer-request', 'function_arn': cf_func.arn}],
        'origin_request_policy_id': tb_pulumi.cloudfront.ORIGIN_REQUEST_POLICY_ID_ALLVIEWER,
        'path_pattern': '/api/*',
        'target_origin_id': f'{project.name_prefix}-api',
        'viewer_protocol_policy': 'redirect-to-https',
    }
]

frontend_opts = resources['tb:cloudfront:CloudFrontS3Service']['frontend']
frontend = tb_pulumi.cloudfront.CloudFrontS3Service(
    behaviors=behaviors,
    name=f'{project.name_prefix}-frontend',
    project=project,
    origins=[api_origin],
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
)

# These settings transcend the stack/environment, so we are not loading them from a config file
ci_iam = tb_pulumi.ci.AwsAutomationUser(
    name=f'{project.project}-ci',
    project=project,
    active_stack='staging',
    additional_policies=[frontend.resources['invalidation_policy'].arn],
    enable_ecr_image_push=True,
    ecr_repositories=['send'],
    enable_fargate_deployments=True,
    fargate_clusters=['send-suite-staging-fargate'],
    fargate_task_role_arns=['arn:aws:iam::768512802988:role/send-suite-staging-fargate'],
    enable_full_s3_access=True,
    s3_full_access_buckets=['tb-send-suite-pulumi'],
    enable_s3_bucket_upload=True,
    s3_upload_buckets=['tb-send-suite-staging-frontend'],
    opts=pulumi.ResourceOptions(depends_on=[frontend]),
)

monitoring_opts = resources['tb:cloudwatch:CloudWatchMonitoringGroup']
monitoring = tb_pulumi.cloudwatch.CloudWatchMonitoringGroup(
    name=f'{project.name_prefix}-monitoring', project=project, config=monitoring_opts
)
