import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const repoRoot = path.resolve(projectRoot, '../..');
const apiIndex = path.join(projectRoot, 'src', 'content', 'docs', 'api', 'index.md');

if (!fs.existsSync(apiIndex)) {
  console.log('API reference not found, generating it once');
  const generated = spawnSync('pnpm docs:generate', {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (generated.status !== 0) process.exit(generated.status || 1);
}

const child = spawn('pnpm --filter apps-docs dev', {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code || 0));
