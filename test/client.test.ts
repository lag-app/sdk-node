import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient, USER_AGENT } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('LagClient sends Bearer token, JSON Accept, and User-Agent', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { status: 'ok', version: '0.1.0', timestamp: 'now' } }));
    const client = new LagClient({ token: 'lag_pat_test', baseUrl: mock.baseUrl });
    await client.system.health();

    assert.equal(mock.requests.length, 1);
    const r = mock.requests[0]!;
    assert.equal(r.method, 'GET');
    assert.equal(r.path, '/health');
    assert.equal(r.headers['authorization'], 'Bearer lag_pat_test');
    assert.equal(r.headers['accept'], 'application/json');
    assert.equal(r.headers['user-agent'], USER_AGENT);
  } finally {
    await mock.close();
  }
});

test('LagClient throws on missing token', () => {
  // @ts-expect-error - intentionally invalid for the test
  assert.throws(() => new LagClient({}), /token/);
});

test('LagClient supports custom User-Agent override', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { version: '1.0.0' } }));
    const client = new LagClient({
      token: 'lag_pat_test',
      baseUrl: mock.baseUrl,
      userAgent: 'my-app/2.0',
    });
    await client.system.version();
    assert.equal(mock.requests[0]!.headers['user-agent'], 'my-app/2.0');
  } finally {
    await mock.close();
  }
});

test('LagClient strips trailing slashes from baseUrl', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { version: '1.0.0' } }));
    const client = new LagClient({
      token: 'lag_pat_test',
      baseUrl: mock.baseUrl + '///',
    });
    await client.system.version();
    assert.equal(mock.requests[0]!.path, '/version');
  } finally {
    await mock.close();
  }
});
