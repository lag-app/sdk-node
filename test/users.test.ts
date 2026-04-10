import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('users.me sends GET /users/me', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: {
        id: 'u1',
        username: 'alice',
        displayName: 'Alice',
        avatarUrl: null,
        status: 'online',
        createdAt: '2026-01-01T00:00:00Z',
      },
    }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const me = await client.users.me();
    assert.equal(me.username, 'alice');
    assert.equal(mock.requests[0]!.method, 'GET');
    assert.equal(mock.requests[0]!.path, '/users/me');
  } finally {
    await mock.close();
  }
});

test('users.updateMe sends PATCH with JSON body', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.method, 'PATCH');
      assert.equal(req.path, '/users/me');
      const body = JSON.parse(req.body);
      assert.deepEqual(body, { displayName: 'Bob' });
      return {
        body: {
          id: 'u1',
          username: 'alice',
          displayName: 'Bob',
          avatarUrl: null,
          status: 'online',
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const updated = await client.users.updateMe({ displayName: 'Bob' });
    assert.equal(updated.displayName, 'Bob');
  } finally {
    await mock.close();
  }
});

test('users.search url-encodes the query', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: [] }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.users.search('hello world');
    assert.match(mock.requests[0]!.path, /\/users\/search\?q=hello\+world|\/users\/search\?q=hello%20world/);
  } finally {
    await mock.close();
  }
});

test('users.checkUsername returns availability', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { available: true } }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const res = await client.users.checkUsername('newname');
    assert.equal(res.available, true);
    assert.match(mock.requests[0]!.path, /username=newname/);
  } finally {
    await mock.close();
  }
});
