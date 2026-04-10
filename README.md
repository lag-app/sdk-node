# @lagapp/sdk

[![npm version](https://img.shields.io/npm/v/@lagapp/sdk.svg)](https://www.npmjs.com/package/@lagapp/sdk)
[![CI](https://github.com/lag-app/sdk-node/actions/workflows/ci.yml/badge.svg)](https://github.com/lag-app/sdk-node/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/@lagapp/sdk.svg)](https://www.npmjs.com/package/@lagapp/sdk)

The official TypeScript / Node SDK for the [Lag](https://trylag.com) API.

`@lagapp/sdk` is a small, hand-written REST client for the public Lag API. It
covers users, friends, DMs, servers, rooms, room messages, events, and image
uploads. It does **not** include the WebSocket protocol or the voice client -
those are out of scope for this package.

- Zero runtime dependencies (uses the global `fetch` from Node 18+).
- ESM, ships `.d.ts` declarations.
- Typed error hierarchy with automatic retries on transient failures.
- Cursor pagination with an async-iterable helper for walking pages.

## Install

```bash
npm install @lagapp/sdk
# or
pnpm add @lagapp/sdk
# or
yarn add @lagapp/sdk
```

## Quickstart

```ts
import { LagClient } from '@lagapp/sdk';

const client = new LagClient({
  token: process.env.LAG_TOKEN!, // a Personal Access Token (lag_pat_*) or Supabase JWT
});

const me = await client.users.me();
console.log(`Hello, ${me.displayName ?? me.username}`);

const servers = await client.servers.list();
for (const server of servers) {
  console.log(`- ${server.name} (${server.memberCount} members)`);
}
```

## Authentication

The SDK accepts any Bearer token the API would accept:

- A **Personal Access Token** (`lag_pat_*`) - the recommended option for
  scripts, bots, and CI. Create one in the Lag web app under settings, or via
  the `lag` CLI with `lag auth login`.
- A **Supabase JWT** - useful when you already have an authenticated session,
  e.g. inside a SvelteKit server load function.

The token is sent as `Authorization: Bearer <token>` on every request. The SDK
does not implement OAuth flows, refresh tokens, or browser-based login - if
you need any of those, obtain a token elsewhere and pass it in.

## Configuration

```ts
const client = new LagClient({
  token: 'lag_pat_...',
  baseUrl: 'https://api.trylag.com', // default
  timeoutMs: 30_000,                  // default
  maxRetries: 2,                       // default
  userAgent: 'my-app/1.0',             // optional override
  fetch: customFetch,                  // optional fetch implementation
});
```

`maxRetries` controls how many times the client will retry on a transient
failure (5xx, 429, network error). Backoff is exponential with jitter, capped
at ~8s. The server's `Retry-After` header is honored on 429.

## Resources

Every resource hangs off the `LagClient` instance:

| Property | What it covers |
|---|---|
| `client.system` | `/health`, `/version`, `/system-status`, `/config` |
| `client.users` | `/users/me`, `/users/me/avatar`, `/users/:id`, `/users/search`, `/users/check-username`, Steam helpers |
| `client.friends` | List, requests, send/accept/decline, remove, block |
| `client.dms` | Conversations + messages with cursor pagination |
| `client.servers` | Servers CRUD, icon upload, leave |
| `client.servers.invites` | Create / list / revoke / preview / join |
| `client.servers.members` | Kick, ban, mute (and the corresponding lists) |
| `client.servers.roles` | Role CRUD and assignment |
| `client.servers.rooms` | Voice rooms |
| `client.servers.rooms.messages` | Room chat: list/send/edit/delete with cursor pagination |
| `client.events` | Server events: list/create/get/update/cancel/RSVP |
| `client.events.guests` | Host-side guest moderation |
| `client.events.templates` | Recurring event templates |
| `client.images` | Multipart upload, metadata, status, delete |

### Pagination

DM and room message endpoints return:

```ts
{ messages: [...], hasMore: boolean, nextCursor: string | null }
```

You can call them by hand:

```ts
let cursor: string | undefined;
do {
  const page = await client.dms.listMessages(convId, { limit: 50, cursor });
  for (const msg of page.messages) handle(msg);
  cursor = page.nextCursor ?? undefined;
} while (cursor);
```

Or async-iterate them with the built-in walker:

```ts
for await (const page of client.dms.iterMessages(convId, { limit: 50 })) {
  for (const msg of page.items) handle(msg);
}
```

The same pattern works for room messages via
`client.servers.rooms.messages.iter(serverId, roomId)`.

### Image upload

```ts
import { readFileSync } from 'node:fs';
import { LagClient } from '@lagapp/sdk';

const client = new LagClient({ token: process.env.LAG_TOKEN! });

// From a file path:
await client.images.upload('./avatar.png', { purpose: 'avatar' });

// From raw bytes:
const bytes = readFileSync('./avatar.png');
await client.images.upload(bytes, {
  purpose: 'avatar',
  filename: 'avatar.png',
  contentType: 'image/png',
});

// From a Blob (works in browsers and Node 18+):
const blob = new Blob([bytes], { type: 'image/png' });
await client.images.upload(blob, { purpose: 'general' });
```

The SDK builds the multipart request itself; you do not need to construct
`FormData`. Maximum upload size is 25 MiB.

## Error handling

Every non-2xx response becomes a typed error you can match with `instanceof`:

```ts
import {
  LagApiError,
  LagAuthError,
  LagPermissionError,
  LagNotFoundError,
  LagConflictError,
  LagRateLimitError,
  LagServerError,
  LagConnectionError,
} from '@lagapp/sdk';

try {
  await client.servers.get('does-not-exist');
} catch (err) {
  if (err instanceof LagNotFoundError) {
    // 404
  } else if (err instanceof LagRateLimitError) {
    // 429 - err.retryAfterSeconds may contain the server's hint
  } else if (err instanceof LagApiError) {
    // any other API error
    console.error(err.status, err.message, err.body);
  } else {
    throw err;
  }
}
```

Network failures (DNS, refused connection, timeouts before any response)
throw `LagConnectionError`. Everything else is a subclass of `LagApiError`.

## Local development

```bash
npm install
npm run build       # tsc -> dist/
npm run typecheck
npm test            # node --test via tsx
```

Tests run against an in-process HTTP server (`test/helpers/mock-server.ts`)
so no real Lag API is required. Each resource has its own test file.

## Related

- The Lag API itself - source under `product/apps/api/` in the Lag monorepo.
- `lag-sdk` for Python (sibling package in `sdks/python/`).
- The `lag` CLI - `cli/` in the Lag monorepo, MIT licensed.

## License

MIT. See [`LICENSE`](./LICENSE).
