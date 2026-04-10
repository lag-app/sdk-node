# Changelog

All notable changes to `@lag/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-10

### Added
- Initial release covering the public REST surface of the Lag API.
- `LagClient` with resources: `system`, `users`, `friends`, `dms`, `servers`, `events`, `images`.
- Sub-resources: server `invites`, `members`, `roles`, `rooms`, room `messages`, event `guests`, event `templates`.
- Cursor-based pagination helpers with `AsyncIterable` page walking.
- Typed error hierarchy: `LagApiError`, `LagAuthError`, `LagPermissionError`, `LagNotFoundError`, `LagConflictError`, `LagRateLimitError`, `LagServerError`, `LagConnectionError`.
- Automatic retries with exponential backoff and `Retry-After` support.
- Multipart image upload from path, `Buffer`, `Uint8Array`, `Blob`, or `ReadableStream`.
