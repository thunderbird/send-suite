const { mockApiCall } = vi.hoisted(() => ({ mockApiCall: vi.fn() }));

vi.mock('../lib/api', () => ({
  ApiConnection: vi.fn(() => ({
    call: mockApiCall,
  })),
}));

import logger, { loggerPrefix } from '@/logger';
import { describe, expect, it, vi } from 'vitest';

describe('Logger module', () => {
  afterEach(() => {
    mockApiCall.mockClear();
  });

  it('should log info successfully', async () => {
    mockApiCall.mockResolvedValue({ message: 'success' });
    const message = { content: 'test message' };
    const consoleSpy = vi.spyOn(console, 'log');
    const timeStamp = new Date();

    await logger.info(message);
    expect(mockApiCall).toHaveBeenCalledWith(
      'logger',
      expect.objectContaining({
        message: JSON.stringify(message),
        type: 'info',
        timeStamp,
      }),
      'POST'
    );

    expect(consoleSpy).toBeCalledWith(`${loggerPrefix.info} ${message}`);
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

  it('should log log error messages', async () => {
    const message = 'A bad error occurred';
    mockApiCall.mockResolvedValue({ message: 'success' });
    const timeStamp = new Date();
    const consoleErrorSpy = vi.spyOn(console, 'error');

    await logger.error(message);

    expect(mockApiCall).toHaveBeenCalledWith(
      'logger',
      expect.objectContaining({
        message: JSON.stringify(message),
        type: 'error',
        timeStamp,
      }),
      'POST'
    );
    expect(consoleErrorSpy).toBeCalledWith(`${loggerPrefix.error} ${message}`);
  });

  it('should handle failure to log info', async () => {
    mockApiCall.mockRejectedValue({ message: 'bad error' });
    const message = { content: 'test message' };
    const consoleErrorSpy = vi.spyOn(console, 'error');

    await logger.error(message);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should log log warn messages', async () => {
    const message = 'A warning was issued';
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    mockApiCall.mockResolvedValue({ message: 'success' });
    const timeStamp = new Date();

    await logger.warn(message);

    expect(mockApiCall).toHaveBeenCalledWith(
      'logger',
      expect.objectContaining({
        message: JSON.stringify(message),
        type: 'warn',
        timeStamp,
      }),
      'POST'
    );
    expect(consoleWarnSpy).toBeCalledWith(`${loggerPrefix.warn} ${message}`);
  });

  it('should handle failure to log info', async () => {
    mockApiCall.mockRejectedValue({ message: 'bad warn' });
    const message = { content: 'test message' };
    const consoleErrorSpy = vi.spyOn(console, 'error');

    await logger.warn(message);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
