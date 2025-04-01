import { logger } from '@/utils/logger';
import { afterEach } from 'node:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Logger module', () => {
  const timestamp = `[2024-01-15T00:00:00.000Z]`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getFormattedMessage(args: any[]): string {
    return `${timestamp} ${args.join(' ')}`;
  }
  beforeEach(() => {
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should log debug messages successfully', async () => {
    const message = 'debug message';
    const consoleDebugSpy = vi.spyOn(console, 'debug');

    logger.debug(message);

    expect(consoleDebugSpy).toBeCalledWith(getFormattedMessage([message]));
    consoleDebugSpy.mockRestore();
  });

  it('should handle multiple arguments in warn message', async () => {
    const arg1 = 'first';
    const arg2 = { value: 'second' };
    const arg3 = 123;
    const consoleSpy = vi.spyOn(console, 'warn');

    logger.warn(arg1, arg2, arg3);

    expect(consoleSpy).toBeCalledWith(getFormattedMessage([arg1, arg2, arg3]));
    consoleSpy.mockRestore();
  });

  it('should handle multiple arguments in error message', async () => {
    const arg1 = 'first';
    const arg2 = { value: 'second' };
    const arg3 = 123;
    const consoleSpy = vi.spyOn(console, 'error');

    logger.error(arg1, arg2, arg3);

    expect(consoleSpy).toBeCalledWith(getFormattedMessage([arg1, arg2, arg3]));
    consoleSpy.mockRestore();
  });

  it('should handle multiple arguments in info message', async () => {
    const arg1 = 'first';
    const arg2 = { value: 'second' };
    const arg3 = 123;
    const consoleSpy = vi.spyOn(console, 'info');

    logger.info(arg1, arg2, arg3);

    expect(consoleSpy).toBeCalledWith(getFormattedMessage([arg1, arg2, arg3]));
    consoleSpy.mockRestore();
  });

  it('should not log or info and ebug when in production environment', async () => {
    // Mock production environment
    vi.stubEnv('NODE_ENV', 'production');
    expect(process.env.NODE_ENV).toBe('production');

    const logSpy = vi.spyOn(console, 'log');
    const infoSpy = vi.spyOn(console, 'info');
    const debugSpy = vi.spyOn(console, 'debug');

    logger.info('test message');
    logger.debug('test message');
    logger.log('test message');

    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();

    // Restore environment and spy
    vi.restoreAllMocks();
  });

  it('should log messages successfully', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const message = 'log message';
    const consoleSpy = vi.spyOn(console, 'log');

    logger.log(message);

    expect(consoleSpy).toBeCalledWith(getFormattedMessage([message]));
    consoleSpy.mockRestore();
  });

  it('should always log warnings in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleSpy = vi.spyOn(console, 'warn');

    logger.warn('warning message');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should always log errors in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleSpy = vi.spyOn(console, 'error');

    logger.error('error message');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should format complex objects in messages', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const obj = { nested: { value: 42 } };
    const arr = [1, 2, 3];
    const consoleSpy = vi.spyOn(console, 'warn');

    logger.warn('complex', obj, arr);

    expect(consoleSpy).toBeCalledWith(
      getFormattedMessage(['complex', obj, arr])
    );
    consoleSpy.mockRestore();
  });
});
