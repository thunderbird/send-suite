#!/bin/bash

if [ "$YES_ACTUALLY_DELETE_CI_SECRETS" == "Yes, actually." ]; then
    secrets=(
        b2-application-key-id
        b2-application-key
        database-url
        fxa-allow-list
        fxa-client-id
        fxa-client-secret
        jwt-access-token-secret
        jwt-refresh-token-secret
        posthog-api-key
        sentry-auth-token
    )

    for secret in ${secrets[@]}; do
        aws secretsmanager delete-secret --secret-id "send-suite/ci/$secret" --force-delete-without-recovery
    done
else
    echo "Only run this command if you need to hard-reset secrets for the ci environment."
    echo "And if you really mean it, you'll export YES_ACTUALLY_DELETE_CI_SECRETS='Yes, actually.'"
fi