import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '..', 'dist');
const rawBase = process.argv[2] || '';
const base = rawBase.trim().replace(/^\/+|\/+$/g, '');
const prefix = base ? `/${base}` : '';

if (!prefix) {
  console.log('no base path supplied; skipping Pages URL rewrite');
  process.exit(0);
}

if (!fs.existsSync(dist)) {
  console.error(`docs dist not found: ${dist}`);
  process.exit(1);
}

function walk(directory, out = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html') || entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

function alreadyPrefixed(url) {
  return url === prefix || url.startsWith(`${prefix}/`);
}

function rewriteUrl(url) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (alreadyPrefixed(url)) return url;
  return `${prefix}${url}`;
}

let changed = 0;

for (const file of walk(dist)) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;

  if (file.endsWith('.html')) {
    after = after.replace(
      /(\b(?:href|src|action|formaction|poster)=)(["']?)(\/(?!\/)[^\s"'<>]*)/gi,
      (match, attr, quote, url) =>
        alreadyPrefixed(url) ? match : `${attr}${quote}${rewriteUrl(url)}`,
    );
  }

  if (file.endsWith('.css')) {
    after = after.replace(
      /(url\(\s*["']?)(\/(?!\/)[^"')]*)/gi,
      (match, attr, url) => (alreadyPrefixed(url) ? match : `${attr}${rewriteUrl(url)}`),
    );
  }

  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
  }
}

console.log(`rewrote root-relative URLs in ${changed} Pages file(s) under ${prefix}`);
