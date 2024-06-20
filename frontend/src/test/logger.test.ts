const mockApiCall = vi.fn();

vi.mock('../lib/api', () => ({
  ApiConnection: vi.fn(() => ({
    call: mockApiCall,
  })),
}));

import logger from '@/logger';
import { describe, expect, it, vi } from 'vitest';

describe('Logger module', () => {
  afterEach(() => {
    mockApiCall.mockClear();
  });

  it('should log info successfully', async () => {
    mockApiCall.mockResolvedValue({ message: 'success' });
    const message = { content: 'test message' };
    const consoleSpy = vi.spyOn(console, 'log');

    await logger.info(message);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('LOGGER INFO')
    );

    consoleSpy.mockRestore();
  });

  it('should handle failure to log info', async () => {
    mockApiCall.mockRejectedValue({ message: 'bad error' });
    const message = { content: 'test message' };
    const consoleErrorSpy = vi.spyOn(console, 'error');

    await logger.info(message);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
