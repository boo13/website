#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const aihomeRoot = resolve(repoRoot, '..', 'AIHome');
const scriptPath = resolve(aihomeRoot, 'scripts', 'generate_playlist_covers.py');

const result = spawnSync(
  'uv',
  [
    'run',
    'python',
    scriptPath,
    '--db',
    resolve(aihomeRoot, 'data', 'aihome.db'),
    '--output',
    resolve(repoRoot, 'public', 'data', 'ai-playlists.json'),
    ...process.argv.slice(2),
  ],
  {
    cwd: aihomeRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
