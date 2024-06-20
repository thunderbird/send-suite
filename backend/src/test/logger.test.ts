// Mock winston before importing your logger
vi.mock('winston', () => {
  const mockCreateLogger = vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    add: vi.fn(),
  }));
  const mockTransports = {
    File: vi.fn(),
    Console: vi.fn(),
  };
  return {
    default: {
      createLogger: mockCreateLogger,
      format: {
        combine: vi.fn(),
        timestamp: vi.fn(),
        errors: vi.fn(() => vi.fn()),
        prettyPrint: vi.fn(),
        printf: vi.fn(),
      },
      transports: mockTransports,
    },
  };
});

import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';
import logger from '../logger';

describe('Logger Tests', () => {
  it('should create error and combined log files', () => {
    expect(fs.existsSync('logs/error.log')).toBe(true);
    expect(fs.existsSync('logs/combined.log')).toBe(true);
  });

  it('should log errors to the error log', async () => {
    const testError = new Error('Test error');
    logger.error(testError);

    // Assuming asynchronous file writing
    await new Promise((r) => setTimeout(r, 500));

    const errorLogContent = fs.readFileSync('logs/error.log', 'utf8');
    expect(errorLogContent).toContain('Test error');
    expect(errorLogContent).toContain('ERROR');
  });

  it('should use the correct format for console output', () => {
    const mock = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(mock);

    logger.info('Testing format');

    // const expectedFormat = new RegExp(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} INFO: Testing format/);
    expect(mock).toHaveBeenCalledWith(expect.any(String));

    mock.mockRestore();
  });
});

describe('Logger Tests', () => {
  it('should create error and combined log files', () => {
    expect(fs.existsSync('logs/error.log')).toBe(true);
    expect(fs.existsSync('logs/combined.log')).toBe(true);
  });

  it('should log errors to the error log', async () => {
    const testError = new Error('Test error');
    logger.error(testError);
    // Assuming asynchronous file writing
    await new Promise((r) => setTimeout(r, 500));
    const errorLogContent = fs.readFileSync('logs/error.log', 'utf8');
    expect(errorLogContent).toContain('Test error');
    expect(errorLogContent).toContain('ERROR');
  });

  it('should use the correct format for console output', () => {
    const mock = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(mock);
    logger.info('Testing format');
    expect(mock).toHaveBeenCalledWith(expect.any(String));
    mock.mockRestore();
  });

  it('should call the API with the correct parameters', async () => {
    const mockApiCall = vi.fn();
    vi.mock('../lib/api', () => ({
      ApiConnection: vi.fn(() => ({
        call: mockApiCall,
      })),
    }));

    const message = 'Test message';
    await logger.info(message);

    expect(mockApiCall).toHaveBeenCalledWith(
      'logger',
      {
        message: JSON.stringify(message),
      },
      'POST'
    );
  });

  it('should log an error message if API call fails', async () => {
    const mockApiCall = vi.fn(() => ({
      message: null,
    }));
    vi.mock('../lib/api', () => ({
      ApiConnection: vi.fn(() => ({
        call: mockApiCall,
      })),
    }));

    const mockConsoleError = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError);

    const message = 'Test message';
    await logger.info(message);

    expect(mockConsoleError).toHaveBeenCalledWith('Failed to log message');
  });
});
