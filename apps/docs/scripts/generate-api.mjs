import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const repoRoot = path.resolve(projectRoot, '../..');
const apiDir = path.join(projectRoot, 'src', 'content', 'docs', 'api');
const stagingDir = path.join(repoRoot, 'temp', 'api-markdown');
const apiDocumenter = path.join(
  path.dirname(require.resolve('@microsoft/api-documenter/package.json')),
  'bin',
  'api-documenter',
);

console.log('generating API markdown');
fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });
execFileSync(
  process.execPath,
  [
    apiDocumenter,
    'markdown',
    '-i',
    'temp',
    '-o',
    path.relative(repoRoot, stagingDir),
  ],
  { cwd: repoRoot, stdio: 'inherit' },
);

const files = fs
  .readdirSync(stagingDir)
  .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
  .sort();

const packageNames = ['core', 'map', 'presets'];
const packageDescriptions = {
  core: 'Client for the ER:LC API, with polling, webhooks, caches, and console commands.',
  map: 'Renders ER:LC player and emergency-call data to a PNG map.',
  presets: 'Moderation callbacks for vehicles, commands, and kills.',
};

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slugPart(part) {
  return part === 'error' ? 'error-event' : part;
}

function routeFor(baseName) {
  if (baseName === 'index') return '/docs/api/';

  const parts = baseName.split('.').map((part) => (part === '_constructor_' ? 'constructor' : part));
  if (parts.length === 1) return `/docs/api/${slugPart(parts[0])}/`;
  if (parts.length > 2) {
    return `/docs/api/${parts.slice(0, -1).map(slugPart).join('/')}/`;
  }
  return `/docs/api/${parts.map(slugPart).join('/')}/`;
}

const routes = new Map();
for (const file of files) {
  const baseName = file.replace(/\.(md|mdx)$/, '');
  routes.set(baseName, routeFor(baseName));
}

function rewriteLinks(content) {
  return content.replace(/\]\(([^)]+)\)/g, (match, target) => {
    if (/^(https?:)?\/\//.test(target) || target.startsWith('#') || target.startsWith('/')) {
      return match;
    }

    const [rawPath, hash = ''] = target.split('#');
    const clean = rawPath.replace(/^\.\//, '').replace(/\.(md|mdx)$/, '');
    const route = routes.get(clean) || (clean === 'index' ? '/docs/api/' : `/docs/api/${clean.replace(/\./g, '/')}/`);

    return `](${route}${hash ? `#${hash}` : ''})`;
  });
}

function headingTitle(content) {
  const match = content.match(/^##\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function cleanTitle(heading, parts) {
  if (!heading) return parts[parts.length - 1] ? capitalize(parts[parts.length - 1]) : 'API';

  let title = heading.trim();
  if (/\spackage$/i.test(title)) return capitalize(parts[0]);

  title = title
    .replace(/\s+(class|interface|enum|type|function|variable|namespace)$/i, '')
    .replace(/\s+(method|property|accessor)$/i, '')
    .trim();

  if (title.includes('.')) {
    return title.replace(/\.\(constructor\)$/i, '.constructor');
  }

  return title;
}

function groupOrder(heading) {
  const lower = heading.toLowerCase();
  if (lower.includes('class')) return 10;
  if (lower.includes('interface')) return 20;
  if (lower.includes('enum')) return 30;
  if (lower.includes('function')) return 40;
  if (lower.includes('type')) return 50;
  if (lower.includes('variable')) return 60;
  return 70;
}

function escapeYaml(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function frontmatter({ title, order, label, hidden, description }) {
  const lines = ['---', `title: "${escapeYaml(title)}"`, `description: "${escapeYaml(description)}"`, `order: ${order}`];

  if (label || hidden) {
    lines.push('sidebar:');
    if (label) lines.push(`  label: "${escapeYaml(label)}"`);
    if (hidden) lines.push('  hidden: true');
    if (!hidden && label) {
      lines.push('  collapsible: true');
      lines.push('  defaultOpen: true');
    }
  }

  lines.push('---', '');
  return lines.join('\n');
}

fs.rmSync(apiDir, { recursive: true, force: true });
fs.mkdirSync(apiDir, { recursive: true });

let written = 0;

for (const file of files) {
  const baseName = file.replace(/\.(md|mdx)$/, '');
  const parts = baseName.split('.').map((part) => (part === '_constructor_' ? 'constructor' : part));

  // Member pages are represented by their parent class/interface page. Keeping
  // one page per symbol keeps the static build fast and the sidebar simple.
  if (parts.length >= 3) continue;

  const source = fs.readFileSync(path.join(stagingDir, file), 'utf8');

  let content = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\[Home\]\([^\n]+\)(?: &gt; [^\n]+)?\r?\n?/m, '')
    .trim();

  const heading = headingTitle(content);
  const title = cleanTitle(heading, parts);

  content = content.replace(/^##\s+.+\r?\n\r?\n?/m, '');
  content = rewriteLinks(content).trim();
  content = content
    .replace(
      /<table>/g,
      '<div class="table-wrap" role="region" aria-label="Scrollable API table" tabindex="0"><table>',
    )
    .replace(/<\/table>/g, '</table></div>');

  const isIndex = baseName === 'index';
  const isPackageRoot = parts.length === 1 && !isIndex;
  const isMember = parts.length >= 3;

  let order = groupOrder(heading);
  let label;
  let hidden = false;

  if (isIndex) {
    order = 20;
    label = 'API Reference';
  } else if (isPackageRoot) {
    order = packageNames.indexOf(parts[0]) + 1;
    label = capitalize(parts[0]);
  } else if (isMember) {
    order = 0;
    hidden = true;
  }

  const description = isIndex
    ? 'Every public class, function, enum, interface, and type.'
    : isPackageRoot
      ? packageDescriptions[parts[0]]
      : `API reference for ${title} in @erlcjs/${parts[0]}.`;

  let target;
  if (isIndex) {
    target = path.join(apiDir, 'index.md');
  } else if (isPackageRoot) {
    target = path.join(apiDir, slugPart(parts[0]), 'index.md');
  } else {
    const slugParts = parts.slice(0, -1).map(slugPart);
    const lastPart = slugPart(parts[parts.length - 1]);
    target = path.join(apiDir, ...slugParts, `${lastPart}.md`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });

  let body = content;
  if (isIndex) {
    body = [
      '| Package | Description |',
      '| --- | --- |',
      `| [@erlcjs/core](/docs/api/core/) | ${packageDescriptions.core} |`,
      `| [@erlcjs/map](/docs/api/map/) | ${packageDescriptions.map} |`,
      `| [@erlcjs/presets](/docs/api/presets/) | ${packageDescriptions.presets} |`,
    ].join('\n');
  }

  fs.writeFileSync(target, `${frontmatter({ title, order, label, hidden, description })}\n${body}\n`, 'utf8');
  written++;
}

fs.rmSync(stagingDir, { recursive: true, force: true });
console.log(`✓ wrote ${written} API pages to ${path.relative(repoRoot, apiDir)}`);
