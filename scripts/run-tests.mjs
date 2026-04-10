#!/usr/bin/env node
// Cross-platform test runner.
//
// We don't rely on shell glob expansion because npm scripts run under
// cmd.exe on Windows, which doesn't expand `test/*.test.ts`. Instead we
// discover the test files in Node and pass them explicitly.
import { readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testDir = resolve(root, 'test');

const files = readdirSync(testDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts'))
  .map((entry) => `test/${entry.name}`)
  .sort();

if (files.length === 0) {
  console.error('No test files found in test/');
  process.exit(1);
}

const args = ['--import', 'tsx', '--test', ...files];
const child = spawn(process.execPath, args, { stdio: 'inherit', cwd: root });
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
