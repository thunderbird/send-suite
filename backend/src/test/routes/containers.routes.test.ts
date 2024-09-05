import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import router from '../../routes/containers';

const { mockReportUpload } = vi.hoisted(() => ({
  mockReportUpload: vi.fn(),
}));

// Set up express app with logger router
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(router);

vi.mock('@/models', () => {
  const models = {
    reportUpload: mockReportUpload,
  };
  return {
    default: models,
    ...models,
  };
});

describe('Containers routes', () => {
  it('should log information from client', async () => {
    mockReportUpload.mockReturnValue('dummy response');

    const message = 'reported successfully';
    const mockedUploadId = 'someid';
    const mockedContainerId = 'containerId';

    const response = await request(app)
      .post(`/${mockedContainerId}/report`)
      .send({ uploadId: mockedUploadId })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.body).toEqual({ message });
    expect(response.status).toBe(200);

    expect(mockReportUpload).toBeCalledWith(mockedUploadId);
  });
});
