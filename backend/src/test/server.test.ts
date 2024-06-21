// mock logger module
import router from '@/routes/logger';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const { mockInfoLogger, mockErrorLogger } = vi.hoisted(() => ({
  mockInfoLogger: vi.fn(),
  mockErrorLogger: vi.fn(),
}));

vi.mock('@/logger', () => {
  const mLogger = {
    info: mockInfoLogger,
    error: mockErrorLogger,
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
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'info', message: 'Test message' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: 'Logged successfully' });
    expect(response.status).toBe(200);

    expect(mockInfoLogger).toBeCalledWith('📳 CLIENT INFO: Test message');
  });

  it('should log errors from client', async () => {
    const response = await request(app)
      .post('/api/logger')
      .send({ type: 'error', message: 'Client error' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message: 'Logged successfully' });
    expect(response.status).toBe(200);

    expect(mockErrorLogger).toBeCalledWith('📳 CLIENT ERROR: Client error');
  });
});
