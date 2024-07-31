// mock logger module
import { describe, expect, it, vi } from 'vitest';
import { useMetrics } from '../../metrics';

const { captureMock } = vi.hoisted(() => ({
  captureMock: vi.fn(),
}));

vi.mock('posthog-node', () => {
  class PostHog {
    apiKey: string;
    options: string;
    capture: typeof captureMock;

    constructor(apiKey, options) {
      this.apiKey = apiKey;
      this.options = options;

      this.capture = captureMock;
    }
  }
  return {
    PostHog,
  };
});

describe('Metrics', () => {
  it('should call posthog', async () => {
    const Metrics = useMetrics();
    const mockedPayload = {
      distinctId: 'test',
      event: 'test',
      properties: { test: 'test' },
    };

    Metrics.capture(mockedPayload);

    expect(captureMock).toBeCalledWith(mockedPayload);
  });

  it('should throw an error when no envs for posthog', async () => {
    vi.stubEnv('POSTHOG_API_KEY', '');
    vi.stubEnv('POSTHOG_HOST', '');

    expect(() => useMetrics()).toThrowError('POSTHOG keys not set');
  });
});
