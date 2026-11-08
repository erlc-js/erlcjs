import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const repoRoot = path.resolve(projectRoot, '../..');
const krateRoot = path.dirname(require.resolve('@krate/core/package.json'));
const krateCli = path.join(krateRoot, 'bin', 'krate.js');
const apiIndex = path.join(projectRoot, 'src', 'content', 'docs', 'api', 'index.md');

if (!fs.existsSync(apiIndex)) {
  console.log('API reference not found, generating it once');
  const generated = spawnSync('pnpm', ['docs:generate'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (generated.error) {
    console.error(`failed to start pnpm: ${generated.error.message}`);
  }
  if (generated.status !== 0) process.exit(generated.status || 1);
}

const child = spawn(process.execPath, [krateCli, 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code || 0));
