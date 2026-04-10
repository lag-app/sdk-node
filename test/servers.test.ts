import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient, Permission } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('servers.list calls /servers/me', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: [] }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.servers.list();
    assert.equal(mock.requests[0]!.path, '/servers/me');
  } finally {
    await mock.close();
  }
});

test('servers.create posts name and emoji', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.deepEqual(JSON.parse(req.body), { name: 'My Server', iconEmoji: ':rocket:' });
      return {
        status: 201,
        body: {
          id: 's1',
          name: 'My Server',
          iconUrl: null,
          iconEmoji: ':rocket:',
          ownerId: 'u1',
          memberCount: 1,
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const s = await client.servers.create({ name: 'My Server', iconEmoji: ':rocket:' });
    assert.equal(s.name, 'My Server');
  } finally {
    await mock.close();
  }
});

test('servers.invites.create hits the right path', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.path, '/servers/s1/invites');
      assert.deepEqual(JSON.parse(req.body), { maxUses: 5 });
      return {
        status: 201,
        body: {
          id: 'i1',
          code: 'abcd1234',
          createdBy: 'u1',
          maxUses: 5,
          uses: 0,
          expiresAt: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const inv = await client.servers.invites.create('s1', { maxUses: 5 });
    assert.equal(inv.code, 'abcd1234');
  } finally {
    await mock.close();
  }
});

test('servers.members.kick deletes the member', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ status: 204 }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.servers.members.kick('s1', 'u2');
    assert.equal(mock.requests[0]!.path, '/servers/s1/members/u2');
    assert.equal(mock.requests[0]!.method, 'DELETE');
  } finally {
    await mock.close();
  }
});

test('servers.roles.create accepts a Permission bitfield', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      const body = JSON.parse(req.body);
      assert.equal(body.name, 'Mod');
      assert.equal(body.permissions, Permission.MANAGE_MESSAGES | Permission.KICK_MEMBERS);
      return {
        status: 201,
        body: {
          id: 'r1',
          serverId: 's1',
          name: 'Mod',
          color: null,
          permissions: body.permissions,
          sortOrder: 3,
          isDefault: false,
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const role = await client.servers.roles.create('s1', {
      name: 'Mod',
      permissions: Permission.MANAGE_MESSAGES | Permission.KICK_MEMBERS,
    });
    assert.equal(role.name, 'Mod');
  } finally {
    await mock.close();
  }
});

test('servers.rooms.messages.send hits nested path', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.path, '/servers/s1/rooms/r1/messages');
      return {
        status: 201,
        body: {
          id: 'm1',
          roomId: 'r1',
          userId: 'u1',
          username: 'alice',
          displayName: null,
          avatarUrl: null,
          content: 'gg',
          createdAt: '2026-01-01T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const msg = await client.servers.rooms.messages.send('s1', 'r1', { content: 'gg' });
    assert.equal(msg.content, 'gg');
  } finally {
    await mock.close();
  }
});
