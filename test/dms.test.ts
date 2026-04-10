import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('dms.create posts the target userId', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.method, 'POST');
      assert.equal(req.path, '/dms');
      assert.deepEqual(JSON.parse(req.body), { userId: 'u2' });
      return {
        status: 201,
        body: {
          id: 'c1',
          otherUser: {
            id: 'u2',
            username: 'bob',
            displayName: null,
            avatarUrl: null,
            status: 'online',
            createdAt: '2026-01-01T00:00:00Z',
          },
          lastMessage: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const conv = await client.dms.create('u2');
    assert.equal(conv.id, 'c1');
  } finally {
    await mock.close();
  }
});

test('dms.sendMessage posts content body', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.method, 'POST');
      assert.equal(req.path, '/dms/c1/messages');
      assert.deepEqual(JSON.parse(req.body), { content: 'hello' });
      return {
        status: 201,
        body: {
          id: 'm1',
          conversationId: 'c1',
          userId: 'u1',
          username: 'alice',
          displayName: null,
          avatarUrl: null,
          content: 'hello',
          createdAt: '2026-01-01T00:00:00Z',
          replyTo: null,
          image: null,
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const msg = await client.dms.sendMessage('c1', { content: 'hello' });
    assert.equal(msg.content, 'hello');
  } finally {
    await mock.close();
  }
});

test('dms.deleteMessage returns 204 cleanly', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ status: 204 }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.dms.deleteMessage('c1', 'm1');
    assert.equal(mock.requests[0]!.method, 'DELETE');
    assert.equal(mock.requests[0]!.path, '/dms/c1/messages/m1');
  } finally {
    await mock.close();
  }
});
