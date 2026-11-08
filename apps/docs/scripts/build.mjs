import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const krateRoot = path.dirname(require.resolve('@krate/core/package.json'));
const krateCli = path.join(krateRoot, 'bin', 'krate.js');

function run() {
  const result = spawnSync(process.execPath, [krateCli, 'build'], {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`failed to start krate: ${result.error.message}`);
  }

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
