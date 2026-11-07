import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run() {
  const result = spawnSync('krate build', {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

let status = run();

if (status !== 0) {
  console.log('build failed, clearing generated cache and retrying');
  fs.rmSync(path.join(root, '.krate'), { recursive: true, force: true });
  fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  status = run();
}

process.exit(status);
