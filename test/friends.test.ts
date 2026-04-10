import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('friends.list returns array of friends', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: [
        {
          id: 'u2',
          friendshipId: 'f1',
          since: '2026-01-01T00:00:00Z',
          user: {
            id: 'u2',
            username: 'bob',
            displayName: 'Bob',
            avatarUrl: null,
            status: 'offline',
            createdAt: '2025-01-01T00:00:00Z',
          },
        },
      ],
    }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const friends = await client.friends.list();
    assert.equal(friends.length, 1);
    assert.equal(friends[0]!.user.username, 'bob');
    assert.equal(mock.requests[0]!.path, '/friends');
  } finally {
    await mock.close();
  }
});

test('friends.sendRequest posts username body', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.method, 'POST');
      assert.equal(req.path, '/friends/request');
      assert.deepEqual(JSON.parse(req.body), { username: 'bob' });
      return {
        status: 201,
        body: {
          id: 'f1',
          requesterId: 'u1',
          addresseeId: 'u2',
          status: 'pending',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const fs = await client.friends.sendRequest('bob');
    assert.equal(fs.status, 'pending');
  } finally {
    await mock.close();
  }
});

test('friends.remove DELETEs the friendship', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ status: 204 }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.friends.remove('f1');
    assert.equal(mock.requests[0]!.method, 'DELETE');
    assert.equal(mock.requests[0]!.path, '/friends/f1');
  } finally {
    await mock.close();
  }
});
