import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '..', 'dist');
const base = (process.argv[2] || '').trim().replace(/^\/+|\/+$/g, '');
const prefix = base ? `/${base}` : '';

if (!prefix) {
  console.log('no base path supplied; skipping Pages URL check');
  process.exit(0);
}

function walk(directory, out = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html') || entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

function isPrefixed(url) {
  return url === prefix || url.startsWith(`${prefix}/`);
}

const failures = [];

for (const file of walk(dist)) {
  const source = fs.readFileSync(file, 'utf8');
  const urls = [];

  if (file.endsWith('.html')) {
    const regex = /(?:href|src|action|formaction|poster)=(["']?)(\/(?!\/)[^\s"'<>]*)/gi;
    let match;
    while ((match = regex.exec(source))) urls.push(match[2]);
  } else {
    const regex = /url\(\s*["']?(\/(?!\/)[^"')]*)/gi;
    let match;
    while ((match = regex.exec(source))) urls.push(match[1]);
  }

  for (const url of urls) {
    if (!isPrefixed(url)) failures.push(`${path.relative(dist, file)}: ${url}`);
  }
}

if (failures.length > 0) {
  console.error(`found ${failures.length} root-relative URL(s) outside ${prefix}:`);
  for (const failure of failures.slice(0, 25)) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`all Pages URLs use ${prefix}`);
