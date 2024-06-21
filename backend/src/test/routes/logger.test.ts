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

describe('POST /api/logger', () => {
  it('should log information from client', async () => {
    const message = 'Test message';
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'info', message })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: loggerResponse });
    expect(response.status).toBe(200);

    expect(mockInfoLogger).toBeCalledWith(`${loggerPrefix.info}: ${message}`);
  });

  it('should log errors from client', async () => {
    const message = 'Client error';
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'error', message })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: loggerResponse });
    expect(response.status).toBe(200);

    expect(mockErrorLogger).toBeCalledWith(`${loggerPrefix.error}: ${message}`);
  });

  it('should log warnings from client', async () => {
    const message = 'Client warning';
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'warn', message })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: loggerResponse });
    expect(response.status).toBe(200);

    expect(mockWarnLogger).toBeCalledWith(`${loggerPrefix.warn}: ${message}`);
  });
});
