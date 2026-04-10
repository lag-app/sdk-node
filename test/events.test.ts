import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('events.list returns event collection', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { events: [] } }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const result = await client.events.list('s1');
    assert.deepEqual(result.events, []);
    assert.equal(mock.requests[0]!.path, '/servers/s1/events');
  } finally {
    await mock.close();
  }
});

test('events.create posts event body', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.path, '/servers/s1/events');
      const body = JSON.parse(req.body);
      assert.equal(body.title, 'Game Night');
      return {
        status: 201,
        body: {
          id: 'e1',
          serverId: 's1',
          title: 'Game Night',
          description: null,
          coverImageUrl: null,
          startsAt: '2026-04-15T19:00:00Z',
          endsAt: null,
          status: 'scheduled',
          voiceRoomId: 'r1',
          createdBy: 'u1',
          creatorUsername: 'alice',
          creatorDisplayName: null,
          shareCode: 'abc123',
          externalAccessEnabled: false,
          externalAutoAdmit: false,
          rsvpCounts: { going: 0, maybe: 0, notGoing: 0 },
          myRsvp: null,
          templateId: null,
          createdAt: '2026-04-10T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const ev = await client.events.create('s1', {
      title: 'Game Night',
      startsAt: '2026-04-15T19:00:00Z',
    });
    assert.equal(ev.title, 'Game Night');
  } finally {
    await mock.close();
  }
});

test('events.rsvp returns counts', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: { status: 'going', counts: { going: 3, maybe: 1, notGoing: 0 } },
    }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const r = await client.events.rsvp('s1', 'e1', { status: 'going' });
    assert.equal(r.status, 'going');
    assert.equal(r.counts.going, 3);
  } finally {
    await mock.close();
  }
});

test('events.guests.admit hits nested path', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({ body: { status: 'admitted' } }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    await client.events.guests.admit('s1', 'e1', 'g1');
    assert.equal(mock.requests[0]!.path, '/servers/s1/events/e1/guests/g1/admit');
  } finally {
    await mock.close();
  }
});

test('events.templates.create hits /event-templates path', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler((req) => {
      assert.equal(req.path, '/servers/s1/event-templates');
      return {
        status: 201,
        body: {
          id: 't1',
          serverId: 's1',
          title: 'Weekly',
          description: null,
          coverImageUrl: null,
          durationMinutes: 60,
          rrule: 'FREQ=WEEKLY',
          timezone: 'America/Los_Angeles',
          startTime: '19:00',
          externalAccessEnabled: false,
          externalAutoAdmit: false,
          nextOccurrenceAt: '2026-04-15T19:00:00Z',
          createdBy: 'u1',
          createdAt: '2026-04-10T00:00:00Z',
        },
      };
    });
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const tpl = await client.events.templates.create('s1', {
      title: 'Weekly',
      rrule: 'FREQ=WEEKLY',
      timezone: 'America/Los_Angeles',
      startTime: '19:00',
      durationMinutes: 60,
    });
    assert.equal(tpl.title, 'Weekly');
  } finally {
    await mock.close();
  }
});
