// mock logger module
import router, { loggerPrefix, loggerResponse } from '@/routes/logger';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const { mockInfoLogger, mockErrorLogger, mockWarnLogger } = vi.hoisted(() => ({
  mockInfoLogger: vi.fn(),
  mockErrorLogger: vi.fn(),
  mockWarnLogger: vi.fn(),
}));

vi.mock('@/logger', () => {
  const mLogger = {
    info: mockInfoLogger,
    error: mockErrorLogger,
    warn: mockWarnLogger,
  };
  return {
    default: mLogger,
  };
});

// Set up express app with logger router
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(router);

const timestamp = new Date();

const commonArgs = {
  logGroup: 'client',
  /* This is an eyesore but it's what we actually get from the client  */
  timestamp: JSON.parse(JSON.stringify(timestamp)),
};

describe('POST /api/logger', () => {
  it('should log information from client', async () => {
    const message = 'Test message';
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'info', message, timestamp })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: loggerResponse });
    expect(response.status).toBe(200);

    expect(mockInfoLogger).toBeCalledWith({
      message: `${loggerPrefix.info}: ${message}`,
      ...commonArgs,
    });
  });

  it('should log errors from client', async () => {
    const message = 'Client error';
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'error', message, timestamp })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: loggerResponse });
    expect(response.status).toBe(200);

    expect(mockErrorLogger).toBeCalledWith({
      message: `${loggerPrefix.error}: ${message}`,
      ...commonArgs,
    });
  });

  it('should log warnings from client', async () => {
    const message = 'Client warning';
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'warn', message, timestamp })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: loggerResponse });
    expect(response.status).toBe(200);

    expect(mockWarnLogger).toBeCalledWith({
      message: `${loggerPrefix.warn}: ${message}`,
      ...commonArgs,
    });
  });
});
