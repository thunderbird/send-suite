# Pulumi for Send Suite

Herein lies the Pulumi program which manages the infrastructure for Send Suite.


## Setup

- Install Python 3, pip, and virtualenv
- [Install Pulumi](https://www.pulumi.com/docs/install/)
- [Configure AWS clients](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- Clone this repo and initialize submodules with: `git submodule update --init --remote --recursive`
- `cd` to this directory and set up Pulumi in your shell:

```
export AWS_DEFAULT_REGION=us-east-1
pulumi login s3://tb-send-suite-pulumi
pulumi stack select $ENV
```

## Usage

- `pulumi preview`: Do a dry run and describe the proposed changes; add `--diff` to see the details.
- `pulumi up`: Apply the changes

If you are running against a protected environment, you will have to set `TBPULUMI_PROTECT_RESOURCES=False` explicitly, or you will not be able to make any changes to the live resources.


## Adding new dependencies

Update `requirements.txt` to include the new dependency, then run the installation within the
virtual environment Pulumi has built to operate itself in.

```
./venv/bin/pip install -U -r requirements.txt
```