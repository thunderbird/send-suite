import { PostHog } from 'posthog-node';

// These types are copied from the posthog-node package, we should be careful to update it whenever the package is updated
interface IdentifyMessage {
  distinctId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: Record<string | number, any>;
  disableGeoip?: boolean;
}
interface EventMessage extends IdentifyMessage {
  event: string;
  groups?: Record<string, string | number>;
  sendFeatureFlags?: boolean;
  timestamp?: Date;
  uuid?: string;
}

export class extended_client extends PostHog {
  capture({
    distinctId,
    event,
    properties,
    groups,
    sendFeatureFlags,
    timestamp,
    disableGeoip,
    uuid,
  }: EventMessage): void {
    super.capture({
      distinctId,
      event,
      properties: { ...properties, service: 'send' },
      groups,
      sendFeatureFlags,
      timestamp,
      disableGeoip,
      uuid,
    });
  }
}
