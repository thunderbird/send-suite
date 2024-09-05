import pulumi
import pulumi_aws as aws
import tb_pulumi
import tb_pulumi.fargate
import tb_pulumi.network
import tb_pulumi.rds
import tb_pulumi.secrets
import urllib.parse


def url_secret(project, secret_name, password, address, port):
    '''We have to define this resource inside a function so Pulumi will recognize it.
    '''

    password = urllib.parse.quote_plus(password)
    tb_pulumi.secrets.SecretsManagerSecret(f'{project.name_prefix}-secret-rdsurl',
        project,
        secret_name,
        f'postgresql://root:{password}@{address}:{port}/send_suite')

project = tb_pulumi.ThunderbirdPulumiProject()
resources = project.config.get('resources')

# Build the networking landscape
vpc_opts = resources['tb:network:MultiCidrVpc']['vpc']
vpc = tb_pulumi.network.MultiCidrVpc(f'{project.name_prefix}-vpc',
    project,
    **vpc_opts)

# Build firewall rules
backend_sg_opts = resources['tb:network:SecurityGroupWithRules']['backend']
backend_sg = tb_pulumi.network.SecurityGroupWithRules(f'{project.name_prefix}-backend-sg',
    project,
    vpc_id=vpc.resources['vpc'].id,
    **backend_sg_opts,
    opts=pulumi.ResourceOptions(depends_on=vpc))

# Copy select secrets from Pulumi into AWS Secrets Manager
pulumi_sm_opts = resources['tb:secrets:PulumiSecretsManager']['pulumi']
pulumi_sm = tb_pulumi.secrets.PulumiSecretsManager(f'{project.name_prefix}-secrets',
    project,
    **pulumi_sm_opts,
    opts=pulumi.ResourceOptions(depends_on=vpc))

# Build an RDS cluster
rds_opts = resources['tb:rds:RdsDatabaseGroup']['backend']
rds_cluster = tb_pulumi.rds.RdsDatabaseGroup(f'{project.name_prefix}-rds',
    project,
    'send_suite',
    vpc.resources['subnets'],
    vpc.resources['vpc'].cidr_block,
    vpc.resources['vpc'].id,
    **rds_opts)

pulumi.Output.all(
    rds_cluster.resources['password'].result,
    rds_cluster.resources['instances'][0].address,
    rds_cluster.resources['instances'][0].port).apply(lambda outputs:
        url_secret(
            project,
            f'{project.project}/{project.stack}/database_url',
            *outputs))

# NOTE: AWS Secrets Manager doesn't delete secrets right away, in case you accidentally delete
#     something and need to recover it. If you delete a secret (leaving it pending deletion for a few
#     days) and then try to create another by the same name, that creates a conflict. Because of
#     this, secret ARNs get a randomized suffix added to them. This is done by AWS, and there is
#     nothing we can do about it. Later, we use these ARNs as part of the task definition for the
#     following Fargate cluster. You will probably have to run a `pulumi up` to create the secrets,
#     then update the config file with the proper ARNs.

# Create a Fargate cluster
backend_fargate_opts = resources['tb:fargate:FargateClusterWithLogging']['backend']
backend_fargate = tb_pulumi.fargate.FargateClusterWithLogging(f'{project.name_prefix}-fargate',
    project,
    [subnet for subnet in vpc.resources['subnets']],
    security_groups=[backend_sg.resources['sg']],
    opts=pulumi.ResourceOptions(depends_on=[
        vpc,
        pulumi_sm,
        rds_cluster]),
    **backend_fargate_opts)

# Create a DNS record pointing to the service
dns = aws.route53.Record(f'{project.name_prefix}-dns',
    zone_id='Z03528753AZVULC8BFCA',  # thunderbird.dev
    name='send.thunderbird.dev',
    type=aws.route53.RecordType.CNAME,
    ttl=60,
    records=[backend_fargate.resources['fargate_service_alb']['albs']['send-suite'].dns_name])