# `@lagapp/sdk` examples

Five small, self-contained examples covering the most common Lag robot patterns. Each one is a single TypeScript file you can copy into your own project, install `@lagapp/sdk`, and run with `tsx`.

| File | What it does | Permissions | Transport |
|---|---|---|---|
| `hello.ts` | Smallest possible smoke test - prints the robot's identity and posts one message. | `send_messages` | none |
| `slash-commands.ts` | Long-running bot with `!ping`, `!roll`, `!time`, `!help` commands. Polls the event queue and replies via the SDK. | `read_messages`, `send_messages` | long-poll |
| `welcome-bot.ts` | Greets new members in a designated welcome room. | `read_members`, `send_messages` | long-poll |
| `webhook-server.ts` | Production-grade webhook receiver: Express + Standard-Webhooks signature verification + SDK reply. | `read_messages`, `send_messages` | webhook |
| `daily-digest.ts` | One-shot script that summarizes the last 24h of room activity (run on cron). | `read_messages`, `send_messages` | none |

## Setup

```bash
npm install @lagapp/sdk
npm install -D tsx typescript @types/node
```

`webhook-server.ts` additionally requires:

```bash
npm install express
npm install -D @types/express
```

## Environment variables

All examples read configuration from environment variables so you can run them without editing the source.

| Variable | Used by | Description |
|---|---|---|
| `LAG_ROBOT_API_KEY` | all | Robot API key (`lag_robot_<prefix>_<secret>`). Created in the [Robot Management Portal](https://trylag.com/robots). |
| `LAG_ROOM_ID` | `hello.ts` | The room to post the hello message into. |
| `LAG_WELCOME_ROOM_ID` | `welcome-bot.ts` | The room where welcome messages should appear. |
| `LAG_WEBHOOK_SECRET` | `webhook-server.ts` | Standard-Webhooks signing secret (`whsec_...`) shown when you create a webhook robot. |
| `PORT` | `webhook-server.ts` | HTTP port to listen on. Defaults to `3000`. |
| `LAG_SOURCE_ROOM_ID` | `daily-digest.ts` | Room to read history from. |
| `LAG_DIGEST_ROOM_ID` | `daily-digest.ts` | Room to post the summary into. |
| `LAG_API_BASE` | `slash-commands.ts`, `welcome-bot.ts` | Optional. Override the API base URL (defaults to `https://api.trylag.com`). Useful for self-hosted instances. |

## Running an example

```bash
LAG_ROBOT_API_KEY=lag_robot_abcd1234_secret \
LAG_ROOM_ID=room_xyz \
tsx examples/hello.ts
```

For long-running bots (`slash-commands.ts`, `welcome-bot.ts`, `webhook-server.ts`), use a process manager like `pm2`, `systemd`, or a container in production.

## A note on event delivery

The Lag SDKs cover the request side - sending, editing, deleting messages, listing rooms / members / message history. They do **not** yet wrap the event delivery endpoints (`/events/poll`, `/events/sse`). The poll-based examples here use raw `fetch` for the listener and the SDK for the reply path. When the events resource lands in the SDK, those examples will get a one-line update.

## Docs

- [Robot overview](https://trylag.com/docs/robots)
- [Creating robots](https://trylag.com/docs/robots/creating-robots)
- [API reference](https://trylag.com/docs/robots/api-reference)
- [More examples in the docs](https://trylag.com/docs/robots/examples)
