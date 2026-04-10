import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('images.upload sends multipart form data', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.method, 'POST');
      assert.equal(req.path, '/images');
      const ct = String(req.headers['content-type'] ?? '');
      // The runtime sets Content-Type with the boundary; we just check the prefix.
      assert.match(ct, /^multipart\/form-data; boundary=/);
      // The body should mention the purpose field name.
      assert.match(req.body, /name="purpose"/);
      assert.match(req.body, /name="file"/);
      return {
        status: 201,
        body: {
          id: 'img1',
          uploaderId: 'u1',
          url: 'https://cdn.example/img1.png',
          originalUrl: null,
          contentType: 'image/png',
          size: 4,
          width: 1,
          height: 1,
          purpose: 'general',
          processingStatus: 'ready',
          variants: null,
          blurhash: null,
          alt: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const meta = await client.images.upload(new Uint8Array([1, 2, 3, 4]), {
      purpose: 'general',
      filename: 'tiny.png',
      contentType: 'image/png',
    });
    assert.equal(meta.id, 'img1');
  } finally {
    await mock.close();
  }
});

test('images.status returns processing snapshot', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: {
        id: 'img1',
        processingStatus: 'processing',
        variants: null,
        url: 'https://cdn.example/img1.png',
      },
    }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const s = await client.images.status('img1');
    assert.equal(s.processingStatus, 'processing');
    assert.equal(mock.requests[0]!.path, '/images/img1/status');
  } finally {
    await mock.close();
  }
});

test('images.delete returns void on 204', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ status: 204 }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.images.delete('img1');
    assert.equal(mock.requests[0]!.method, 'DELETE');
  } finally {
    await mock.close();
  }
});
