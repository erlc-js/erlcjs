import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];

if (!version) {
  console.error('usage: node scripts/set-version.mjs <version>');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`invalid semver version: ${version}`);
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packages = ['core', 'map', 'presets'];

function numericParts(value) {
  return value
    .split('-')[0]
    .split('.')
    .map((part) => Number(part));
}

function compareVersions(a, b) {
  const left = numericParts(a);
  const right = numericParts(b);
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

for (const name of packages) {
  const file = path.join(root, 'packages', name, 'package.json');
  const source = fs.readFileSync(file, 'utf8');
  const pkg = JSON.parse(source);

  if (compareVersions(version, pkg.version) < 0) {
    console.error(
      `refusing to downgrade ${pkg.name} from ${pkg.version} to ${version}; check the tag`,
    );
    process.exit(1);
  }

  const next = source.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`);
  fs.writeFileSync(file, next, 'utf8');
  console.log(`${pkg.name} -> ${version}`);
}
