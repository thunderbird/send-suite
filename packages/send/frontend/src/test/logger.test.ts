import logger, { loggerPrefix } from '@/logger';
import { describe, expect, it, vi } from 'vitest';

describe('Logger module', () => {
  it('should log info successfully', async () => {
    const message = { content: 'test message' };
    const consoleSpy = vi.spyOn(console, 'log');

    logger.info(message);

    expect(consoleSpy).toBeCalledWith(`${loggerPrefix.info} ${message}`);
    consoleSpy.mockRestore();
  });

  it('should log log error messages', async () => {
    const message = 'A bad error occurred';
    const consoleErrorSpy = vi.spyOn(console, 'error');

    logger.error(message);

    expect(consoleErrorSpy).toBeCalledWith(`${loggerPrefix.error} ${message}`);
  });

  it('should handle failure to log info', async () => {
    const message = { content: 'test message' };
    const consoleErrorSpy = vi.spyOn(console, 'error');

    logger.error(message);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle failure to log info', async () => {
    const message = { content: 'test message' };
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    logger.warn(message);

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});
