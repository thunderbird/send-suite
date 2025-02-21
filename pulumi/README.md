# Pulumi for Send Suite

Herein lies the Pulumi program which manages the infrastructure for Send Suite.


## Setup

- Install Python 3, pip, and virtualenv
- [Install Pulumi](https://www.pulumi.com/docs/install/)
- [Configure AWS clients](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- Clone this repo
- `cd` to this directory and set up Pulumi in your shell:

```
export AWS_DEFAULT_REGION=us-east-1
pulumi login s3://tb-send-suite-pulumi
pulumi stack select $ENV
```

## Usage

- `pulumi preview`: Do a dry run and describe the proposed changes; add `--diff` to see the details.
- `pulumi up`: Apply the changes

If you are running against a protected environment, you will have to set `TBPULUMI_DISABLE_PROTECTION=True`
explicitly, or you will not be able to make any changes to the live resources.


## Adding new dependencies

Update `requirements.txt` to include the new dependency, then run the installation within the
virtual environment Pulumi has built to operate itself in.

```
./venv/bin/pip install -U -r requirements.txt
```


## Building a new environment

Before building a new environment, make sure you've gone through the setup steps above, then gather your materials:

- Select domain names for frontend and backend services (but don't create any records for them).
- Request certificates from AWS Certificate Manager for each of those domains. Prove to AWS that you own those domains
    to get them issued. Take note of the ARNs.
- Generate a secret passphrase to encrypt secrets in this stack with. Store this secret securely. Export it into your
    shell:
        - `export PULUMI_CONFIG_PASSPHRASE='that_password_here'`
- Initialize a new Pulumi stack
    - `pulumi stack init $stackname`
- Generate all of the special values this software needs to run. These are referenced in the `config.$env.yaml` files
    as part of the `tb:secrets:PulumiManager` configuration. Some of these values can be copied from other environments,
    while others will have to be created fresh. Be sure to store anything newly made in a secure location outside of
    this repo. For example, you will need to create a BackBlaze bucket, then create an application key with access to
    it.
- For each one of those special values, create a Pulumi secret. One such command might look like this:
    - `pulumi config set --secret b2-application-key-id 'somethingsomethingblahblahblah'`
- Copy the configuration file for the environment that most closely resembles the one you wish to build. f/ex:
    - `cp config.{stage,prod}.yaml`
- Adjust the values of the new config file appropriately. Double-check everything.
- Build the infrastructure.
    - `pulumi up`