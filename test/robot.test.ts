import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient, LagInvalidTokenError } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

const ROBOT_TOKEN = 'lag_robot_abcd1234_secretsecret';
const USER_TOKEN = 'lag_pat_test';

test('LagClient.isRobot detects robot keys', () => {
  const robot = new LagClient({ token: ROBOT_TOKEN });
  assert.equal(robot.isRobot, true);
  const user = new LagClient({ token: USER_TOKEN });
  assert.equal(user.isRobot, false);
});

test('robot client uses Robot auth scheme on identity()', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: {
        id: 'rob_1',
        name: 'Helper',
        serverId: 'srv_1',
        avatarUrl: null,
        permissions: ['send_messages', 'read_messages'],
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    }));
    const client = new LagClient({ token: ROBOT_TOKEN, baseUrl: mock.baseUrl, maxRetries: 0 });
    const who = await client.identity();
    assert.equal(mock.requests.length, 1);
    const r = mock.requests[0]!;
    assert.equal(r.method, 'GET');
    assert.equal(r.path, '/robots/@me/info');
    assert.equal(r.headers['authorization'], `Robot ${ROBOT_TOKEN}`);
    assert.equal(who.kind, 'robot');
    assert.equal(who.displayName, 'Helper');
    assert.equal(who.serverId, 'srv_1');
    assert.deepEqual(who.permissions, ['send_messages', 'read_messages']);
  } finally {
    await mock.close();
  }
});

test('user client uses Bearer auth scheme on identity()', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: {
        id: 'usr_1',
        username: 'alice',
        displayName: 'Alice',
        avatarUrl: 'https://cdn/a.png',
        status: 'online',
        createdAt: '2026-01-01T00:00:00Z',
      },
    }));
    const client = new LagClient({ token: USER_TOKEN, baseUrl: mock.baseUrl, maxRetries: 0 });
    const who = await client.identity();
    assert.equal(mock.requests.length, 1);
    const r = mock.requests[0]!;
    assert.equal(r.path, '/users/me');
    assert.equal(r.headers['authorization'], `Bearer ${USER_TOKEN}`);
    assert.equal(who.kind, 'user');
    assert.equal(who.displayName, 'Alice');
    assert.equal(who.username, 'alice');
    assert.equal(who.serverId, null);
  } finally {
    await mock.close();
  }
});

test('robot client rewrites /servers paths to /robots/@me/servers', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      status: 201,
      body: {
        id: 'msg_1',
        roomId: 'room_1',
        userId: '',
        username: 'Helper',
        displayName: 'Helper',
        avatarUrl: null,
        content: 'Hello!',
        createdAt: '2026-01-01T00:00:00Z',
        editedAt: null,
        robotId: 'rob_1',
        robotName: 'Helper',
        robotAvatarUrl: null,
        isBot: true,
      },
    }));
    const client = new LagClient({ token: ROBOT_TOKEN, baseUrl: mock.baseUrl, maxRetries: 0 });
    const msg = await client.servers.rooms.messages.send('srv_1', 'room_1', { content: 'Hello!' });
    assert.equal(mock.requests.length, 1);
    const r = mock.requests[0]!;
    assert.equal(r.method, 'POST');
    assert.equal(r.path, '/robots/@me/servers/srv_1/rooms/room_1/messages');
    assert.equal(r.headers['authorization'], `Robot ${ROBOT_TOKEN}`);
    assert.equal(msg.content, 'Hello!');
  } finally {
    await mock.close();
  }
});

test('user client does not rewrite /servers paths', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      status: 201,
      body: {
        id: 'msg_1',
        roomId: 'room_1',
        userId: 'usr_1',
        username: 'alice',
        displayName: 'Alice',
        avatarUrl: null,
        content: 'Hi',
        createdAt: '2026-01-01T00:00:00Z',
        editedAt: null,
      },
    }));
    const client = new LagClient({ token: USER_TOKEN, baseUrl: mock.baseUrl, maxRetries: 0 });
    await client.servers.rooms.messages.send('srv_1', 'room_1', { content: 'Hi' });
    assert.equal(mock.requests[0]!.path, '/servers/srv_1/rooms/room_1/messages');
  } finally {
    await mock.close();
  }
});

test('robot client rewrites GET messages list path', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { messages: [], hasMore: false, nextCursor: null } }));
    const client = new LagClient({ token: ROBOT_TOKEN, baseUrl: mock.baseUrl, maxRetries: 0 });
    await client.servers.rooms.messages.list('srv_1', 'room_1');
    assert.match(
      mock.requests[0]!.path,
      /^\/robots\/@me\/servers\/srv_1\/rooms\/room_1\/messages(\?|$)/,
    );
  } finally {
    await mock.close();
  }
});

test('users.me() throws LagInvalidTokenError for robot token', async () => {
  const client = new LagClient({ token: ROBOT_TOKEN, maxRetries: 0 });
  await assert.rejects(() => client.users.me(), (err: unknown) => {
    assert.ok(err instanceof LagInvalidTokenError);
    assert.match((err as Error).message, /not available/);
    return true;
  });
});

test('robot client does not rewrite non-/servers paths', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { status: 'ok', version: '1.0', timestamp: 'now' } }));
    const client = new LagClient({ token: ROBOT_TOKEN, baseUrl: mock.baseUrl, maxRetries: 0 });
    await client.system.health();
    assert.equal(mock.requests[0]!.path, '/health');
  } finally {
    await mock.close();
  }
});
