import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LagApiError,
  LagAuthError,
  LagClient,
  LagConflictError,
  LagConnectionError,
  LagNotFoundError,
  LagPermissionError,
  LagRateLimitError,
  LagServerError,
} from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

const fixtures: Array<{
  status: number;
  ctor: new (...args: any[]) => LagApiError;
  name: string;
}> = [
  { status: 401, ctor: LagAuthError, name: 'LagAuthError' },
  { status: 403, ctor: LagPermissionError, name: 'LagPermissionError' },
  { status: 404, ctor: LagNotFoundError, name: 'LagNotFoundError' },
  { status: 409, ctor: LagConflictError, name: 'LagConflictError' },
  { status: 500, ctor: LagServerError, name: 'LagServerError' },
];

for (const f of fixtures) {
  test(`maps HTTP ${f.status} to ${f.name}`, async () => {
    const mock = await startMockServer();
    try {
      mock.setHandler(() => ({
        status: f.status,
        body: { error: 'Test', message: `boom-${f.status}`, statusCode: f.status },
      }));
      // No retries for this test - we want to see the error immediately.
      const client = new LagClient({
        token: 'lag_pat_x',
        baseUrl: mock.baseUrl,
        maxRetries: 0,
      });
      await assert.rejects(client.system.health(), (err: unknown) => {
        assert.ok(err instanceof f.ctor, `expected ${f.name}, got ${(err as Error).constructor.name}`);
        assert.ok(err instanceof LagApiError);
        assert.equal((err as LagApiError).status, f.status);
        assert.match((err as LagApiError).message, new RegExp(`boom-${f.status}`));
        return true;
      });
    } finally {
      await mock.close();
    }
  });
}

test('429 surfaces Retry-After seconds on LagRateLimitError', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      status: 429,
      headers: { 'Retry-After': '7' },
      body: { error: 'rate', message: 'slow down', statusCode: 429 },
    }));
    const client = new LagClient({
      token: 'lag_pat_x',
      baseUrl: mock.baseUrl,
      maxRetries: 0,
    });
    await assert.rejects(client.system.health(), (err: unknown) => {
      assert.ok(err instanceof LagRateLimitError);
      assert.equal((err as LagRateLimitError).retryAfterSeconds, 7);
      return true;
    });
  } finally {
    await mock.close();
  }
});

test('connection failures surface as LagConnectionError', async () => {
  const client = new LagClient({
    // Port 1 is reserved/unreachable; this avoids any DNS lookup or flakiness.
    token: 'lag_pat_x',
    baseUrl: 'http://127.0.0.1:1',
    maxRetries: 0,
    timeoutMs: 500,
  });
  await assert.rejects(client.system.health(), (err: unknown) => {
    assert.ok(err instanceof LagConnectionError);
    return true;
  });
});

test('error envelope without message still produces a typed error', async () => {
  const mock = await startMockServer();
  try {
    // Server replies with non-JSON body. The transport must fall back gracefully.
    mock.setHandler(() => ({ status: 502, body: 'Bad Gateway' }));
    const client = new LagClient({
      token: 'lag_pat_x',
      baseUrl: mock.baseUrl,
      maxRetries: 0,
    });
    await assert.rejects(client.system.health(), (err: unknown) => {
      assert.ok(err instanceof LagServerError);
      assert.equal((err as LagServerError).status, 502);
      return true;
    });
  } finally {
    await mock.close();
  }
});
