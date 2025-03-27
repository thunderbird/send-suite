import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shouldRunSuite } from './testutils';

describe('runOrSkip', () => {
  const originalEnv = { ...process.env };
  const originalConsoleWarn = console.warn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockConsoleWarn: any;

  beforeEach(() => {
    mockConsoleWarn = vi.fn();
    console.warn = mockConsoleWarn;
    delete process.env.IS_CI_AUTOMATION;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    console.warn = originalConsoleWarn;
  });

  it('should return true when IS_CI_AUTOMATION is set', () => {
    process.env.IS_CI_AUTOMATION = 'true';
    const result = shouldRunSuite({ someKey: '' }, 'test suite');
    expect(result).toBe(true);
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should return true when all config values are truthy', () => {
    const result = shouldRunSuite(
      { key1: 'value1', key2: 'value2' },
      'test suite'
    );
    expect(result).toBe(true);
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('should return false and log warning when some config values are falsy', () => {
    const result = shouldRunSuite({ key1: 'value1', key2: '' }, 'test suite');
    expect(result).toBe(false);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'env variables are not correctly set to run test suite'
    );
  });

  it('should return false and log warning when all config values are falsy', () => {
    const result = shouldRunSuite({ key1: '', key2: '' }, 'test suite');
    expect(result).toBe(false);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'env variables are not correctly set to run test suite'
    );
  });
});
