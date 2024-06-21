// mock logger module
import router from '@/routes/logger';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const { mockInfoLogger, mockErrorLogger } = vi.hoisted(() => ({
  mockInfoLogger: vi.fn(),
  mockErrorLogger: vi.fn(),
}));

vi.mock('winston', () => {
  const mFormat = {
    combine: vi.fn(),
    timestamp: vi.fn(),
    printf: vi.fn(),
    errors: vi.fn(),
    prettyPrint: vi.fn(),
  };
  const mTransports = {
    Console: vi.fn(),
    File: vi.fn(),
  };
  const mLogger = {
    info: vi.fn(),
    add: vi.fn(),
  };
  return {
    default: {
      format: mFormat,
      transports: mTransports,
      createLogger: vi.fn(() => mLogger),
    },
  };
});

vi.mock('@/logger', () => {
  const mLogger = {
    info: mockInfoLogger,
    error: mockErrorLogger,
  };
  return {
    default: mLogger,
  };
});

const app = express();

app.use(express.json({ limit: '5mb' }));

app.use(router);

app.get('/user', function (req, res) {
  res.status(200).json({ name: 'john' });
});

describe('GET /user', () => {
  it('SANITY GET', async () => {
    const response = await request(app).get('/user');

    expect(response.body).toEqual({ name: 'john' });
    expect(response.status).toBe(200);
  });
});

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

describe('stupid test', () => {
  it('should pass for sanity', async () => {
    expect(true).toBe(true);
  });
});
