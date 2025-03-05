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
    debug: () => void;
    on: () => void;

    constructor(apiKey, options) {
      this.apiKey = apiKey;
      this.options = options;

      this.capture = captureMock;
      this.debug = vi.fn();
      this.on = vi.fn();
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
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('POSTHOG_API_KEY', '');
    vi.stubEnv('POSTHOG_HOST', '');

    expect(() => useMetrics()).not.toThrow('POSTHOG keys not set');
    expect(warnMock).toBeCalledWith('POSTHOG keys not set');
  });
});
