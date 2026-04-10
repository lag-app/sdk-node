# Contributing to the Lag Node SDK

Thanks for your interest in contributing! This document explains how to get a development environment running and the conventions we follow.

## Getting started

```bash
git clone https://github.com/lag-app/sdk-node.git
cd sdk-node
npm install
```

## Common commands

```bash
npm run typecheck   # Type check without emitting
npm test            # Run the test suite
npm run build       # Build to ./dist
```

## Project layout

```
src/    - Public SDK source
test/   - Test suite (node:test runner)
dist/   - Build output (generated, do not edit)
```

## Coding conventions

- TypeScript strict mode is enabled. New code must type check cleanly.
- Use `node:test` for tests. Every new feature or bug fix must include a test.
- Public API additions should be reflected in the README and `CHANGELOG.md`.
- Avoid adding runtime dependencies unless strictly necessary.
- Do not use the em dash character. Use a single dash instead.

## Commit messages

Use imperative mood with conventional prefixes:

```
feat: add retry policy to client
fix: handle 429 with Retry-After header
docs: document pagination helpers
chore: bump devDependencies
```

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your changes with tests.
3. Run `npm run typecheck`, `npm test`, and `npm run build` locally.
4. Update `CHANGELOG.md` under the `Unreleased` section if your change is user facing.
5. Open a PR using the template and link any related issues.

## Reporting security issues

Please do not open public GitHub issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for the disclosure process.
