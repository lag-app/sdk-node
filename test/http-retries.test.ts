import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('retries 5xx and succeeds on second attempt', async () => {
  const mock = await startMockServer();
  try {
    mock.enqueue(
      { status: 502, body: { error: 'bg', message: 'first', statusCode: 502 } },
      { status: 200, body: { version: '1.2.3' } },
    );
    const client = new LagClient({
      token: 'lag_pat_x',
      baseUrl: mock.baseUrl,
      maxRetries: 2,
    });
    const result = await client.system.version();
    assert.equal(result.version, '1.2.3');
    assert.equal(mock.requests.length, 2);
  } finally {
    await mock.close();
  }
});

test('does not retry 4xx other than 429', async () => {
  const mock = await startMockServer();
  try {
    mock.enqueue(
      { status: 400, body: { error: 'bad', message: 'no', statusCode: 400 } },
      { status: 200, body: { version: '1.0.0' } },
    );
    const client = new LagClient({
      token: 'lag_pat_x',
      baseUrl: mock.baseUrl,
      maxRetries: 3,
    });
    await assert.rejects(client.system.version());
    assert.equal(mock.requests.length, 1, 'should not have retried 400');
  } finally {
    await mock.close();
  }
});

test('gives up after maxRetries 5xx attempts', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      status: 503,
      body: { error: 'down', message: 'still down', statusCode: 503 },
    }));
    const client = new LagClient({
      token: 'lag_pat_x',
      baseUrl: mock.baseUrl,
      maxRetries: 2,
    });
    await assert.rejects(client.system.version());
    // Initial attempt + 2 retries == 3 total
    assert.equal(mock.requests.length, 3);
  } finally {
    await mock.close();
  }
});
