import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import router from '../../routes/metrics';

const { mockcapture, getHashedEmail } = vi.hoisted(() => ({
  mockcapture: vi.fn(),
  getHashedEmail: vi.fn(),
}));

vi.mock('@/metrics', () => {
  const mMetrics = {
    useMetrics: vi.fn(() => ({
      capture: mockcapture,
      shutdown: vi.fn(),
    })),
  };
  return {
    ...mMetrics,
  };
});

vi.mock('@/utils/session', () => {
  return {
    getHashedEmail: getHashedEmail,
  };
});

//  Mock express session
const expressSession = session({
  secret: process.env.SESSION_SECRET ?? 'abc123xyz',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    sameSite: 'none', // Cannot use 'lax' or 'strict' for local dev.
  },
});

// Set up express app with logger router
const app = express();
app.use(expressSession);
app.use(express.json());
app.use(router);

describe('POST /api/metrics/page-load', () => {
  it('should capture metrics for anon users', async () => {
    const mockPayload = {
      browser_version: '1.0',
      os_version: '1.0',
    };

    const expectedResponse = {
      distinctId: '127.0.0.1-1.0-1.0',
      event: 'page-load',
      properties: {
        ...mockPayload,
        service: 'send',
      },
    };

    const response = await request(app)
      .post('/api/metrics/page-load')
      .send(mockPayload)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(mockcapture).toBeCalledWith(expectedResponse);

    expect(response.status).toBe(200);
  });

  it('should capture metrics for logged users', async () => {
    const mockedHash = 'mocked-email-hash';

    getHashedEmail.mockReturnValue(mockedHash);
    const mockPayload = {
      browser_version: '1.0',
      os_version: '1.0',
    };

    const expectedResponse = {
      distinctId: mockedHash,
      event: 'page-load',
      properties: {
        ...mockPayload,
        service: 'send',
      },
    };

    const response = await request(app)
      .post('/api/metrics/page-load')
      .send(mockPayload)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(mockcapture).toBeCalledWith(expectedResponse);

    expect(response.status).toBe(200);
  });
});
