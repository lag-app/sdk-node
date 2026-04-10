import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LagClient } from '../src/index.js';
import { startMockServer } from './helpers/mock-server.js';

test('iterMessages walks cursors until hasMore is false', async () => {
  const mock = await startMockServer();
  try {
    let call = 0;
    mock.setHandler(() => {
      call += 1;
      if (call === 1) {
        return {
          body: {
            messages: [{ id: 'm1' }, { id: 'm2' }],
            hasMore: true,
            nextCursor: '2026-01-01T00:00:00Z',
          },
        };
      }
      if (call === 2) {
        return {
          body: {
            messages: [{ id: 'm3' }],
            hasMore: false,
            nextCursor: null,
          },
        };
      }
      return { status: 500, body: { error: 'over-fetched', message: 'extra', statusCode: 500 } };
    });

    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const collected: string[] = [];
    for await (const page of client.dms.iterMessages('conv1', { limit: 2 })) {
      for (const msg of page.items) collected.push((msg as { id: string }).id);
    }

    assert.deepEqual(collected, ['m1', 'm2', 'm3']);
    assert.equal(mock.requests.length, 2);
    assert.match(mock.requests[0]!.path, /\/dms\/conv1\/messages\?limit=2/);
    assert.match(mock.requests[1]!.path, /cursor=2026-01-01/);
  } finally {
    await mock.close();
  }
});

test('listMessages returns the raw page object', async () => {
  const mock = await startMockServer();
  try {
    mock.setHandler(() => ({
      body: { messages: [{ id: 'a' }], hasMore: false, nextCursor: null },
    }));
    const client = new LagClient({ token: 'lag_pat_x', baseUrl: mock.baseUrl });
    const page = await client.dms.listMessages('c1');
    assert.equal(page.messages.length, 1);
    assert.equal(page.hasMore, false);
    assert.equal(page.nextCursor, null);
  } finally {
    await mock.close();
  }
});
