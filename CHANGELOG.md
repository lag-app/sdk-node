# Changelog

All notable changes to `@lagapp/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-10

### Added
- Robot API key support. `LagClient` now accepts robot keys (`lag_robot_*`)
  via the same `token` field and automatically switches the Authorization
  scheme to `Robot`. Server-scoped operations (sending, editing, deleting
  messages, listing rooms / members / message history) are transparently
  routed to the `/robots/@me/servers/...` endpoints, so the same resource
  methods work for both users and robots.
- New `client.identity()` returning a unified `Identity` object for both
  PAT users and robot keys, with a `kind` discriminator and the
  credential's display name, avatar, and (for robots) server scope and
  permissions.
- New `Identity` and `IdentityKind` types exported from `@lagapp/sdk`.
- New `LagInvalidTokenError` thrown upfront when a method is called with
  an incompatible token kind (e.g. `users.me()` with a robot key).
- `client.isRobot` getter.

### Changed
- README and client doc comments no longer reference Supabase JWTs.

## [0.1.0] - 2026-04-10

### Added
- Initial release covering the public REST surface of the Lag API.
- `LagClient` with resources: `system`, `users`, `friends`, `dms`, `servers`, `events`, `images`.
- Sub-resources: server `invites`, `members`, `roles`, `rooms`, room `messages`, event `guests`, event `templates`.
- Cursor-based pagination helpers with `AsyncIterable` page walking.
- Typed error hierarchy: `LagApiError`, `LagAuthError`, `LagPermissionError`, `LagNotFoundError`, `LagConflictError`, `LagRateLimitError`, `LagServerError`, `LagConnectionError`.
- Automatic retries with exponential backoff and `Retry-After` support.
- Multipart image upload from path, `Buffer`, `Uint8Array`, `Blob`, or `ReadableStream`.
