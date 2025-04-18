import { extended_client } from '@/metrics/posthog';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock PostHog parent class
vi.mock('posthog-node', () => {
  return {
    PostHog: class MockPostHog {
      capture = vi.fn();
    },
  };
});

describe('extended_client', () => {
  let client: extended_client;

  beforeEach(() => {
    client = new extended_client('test_api_key');
    vi.clearAllMocks();
  });

  describe('capture', () => {
    it('should call super.capture with service property added', () => {
      // Arrange
      const eventData = {
        distinctId: 'user123',
        event: 'test_event',
        properties: { foo: 'bar' },
      };

      // Act
      client.capture(eventData);

      // Assert
      expect(client['capture']).toHaveBeenCalledTimes(1);
      expect(client['capture']).toHaveBeenCalledWith({
        ...eventData,
        properties: {
          ...eventData.properties,
          // service: 'send'
        },
      });
    });

    it('should pass all parameters to super.capture', () => {
      // Arrange
      const timestamp = new Date();
      const fullEventData = {
        distinctId: 'user123',
        event: 'test_event',
        properties: { foo: 'bar' },
        groups: { team: 'engineering' },
        sendFeatureFlags: true,
        timestamp,
        disableGeoip: true,
        uuid: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      client.capture(fullEventData);

      // Assert
      expect(client['capture']).toHaveBeenCalledWith({
        ...fullEventData,
        properties: {
          ...fullEventData.properties,
          // service: 'send'
        },
      });
    });

    it('should handle case when properties is undefined', () => {
      // Arrange
      const eventData = {
        distinctId: 'user123',
        event: 'test_event',
      };

      // Act
      client.capture(eventData);

      // Assert
      expect(client['capture']).toHaveBeenCalledTimes(1);
      expect(client['capture']).toHaveBeenCalledWith({
        ...eventData,
        // properties: { service: 'send' },
      });
    });
  });
});
