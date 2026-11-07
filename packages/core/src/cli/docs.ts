import { DOCS } from './generated.js';
import type { BundledDoc } from './types.js';

export const DOCS_BASE_URL = 'https://erlcjs.xyz';

export interface SearchHit {
  doc: BundledDoc;
  score: number;
  snippet: string;
}

interface SearchableDoc {
  doc: BundledDoc;
  title: string;
  description: string;
  path: string;
  headings: string;
  content: string;
  plain: string;
}

const SECTION_TITLES: Record<string, string> = {
  overview: 'Overview',
  guides: 'Guides',
  api: 'API Reference',
};

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^#{2,4}\s+/.test(line))
    .map((line) => line.replace(/^#{2,4}\s+/, '').replace(/[`*_]/g, ''))
    .join(' ');
}

function buildSearchIndex(): SearchableDoc[] {
  return DOCS.map((doc) => {
    const plain = stripMarkdown(doc.content);
    return {
      doc,
      title: doc.title.toLowerCase(),
      description: doc.description.toLowerCase(),
      path: doc.path.toLowerCase(),
      headings: extractHeadings(doc.content).toLowerCase(),
      content: plain.toLowerCase(),
      plain,
    };
  });
}

const SEARCH_INDEX = buildSearchIndex();

const BY_ALIAS = new Map<string, BundledDoc>();

for (const doc of DOCS) {
  const aliases = [doc.slug.toLowerCase(), doc.path.toLowerCase(), doc.title.toLowerCase()];
  for (const alias of aliases) {
    if (!BY_ALIAS.has(alias)) BY_ALIAS.set(alias, doc);
  }
  if (doc.slug === 'index') BY_ALIAS.set('', doc);
}

export function normalizeDocLookup(value: string): string {
  let path = value.trim();

  if (path.startsWith('erlcjs://docs')) {
    path = path.slice('erlcjs://docs'.length);
  } else if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      // Keep the original value so the error message remains useful.
    }
  }

  path = path.split('#')[0]?.split('?')[0] ?? '';
  try {
    path = decodeURIComponent(path);
  } catch {
    // Ignore malformed escapes and use the raw value.
  }

  path = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  path = path.replace(/^docs\/?/i, '');
  path = path.replace(/\.md$/i, '');
  path = path.replace(/\/index$/i, '');

  return path.toLowerCase();
}

export function findDoc(value: string): BundledDoc | null {
  const normalized = normalizeDocLookup(value);
  const exact = BY_ALIAS.get(normalized);
  if (exact) return exact;
  if (!normalized) return null;

  const suffix = DOCS.filter(
    (doc) => doc.slug.toLowerCase() === normalized || doc.slug.toLowerCase().endsWith(`/${normalized}`),
  );
  return suffix.length === 1 ? suffix[0] ?? null : null;
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'not',
  'of',
  'on',
  'or',
  'should',
  'that',
  'the',
  'this',
  'to',
  'was',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'you',
  'your',
]);

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));
}

function snippetFor(doc: SearchableDoc, tokens: string[]): string {
  const lower = doc.plain.toLowerCase();
  let index = -1;

  for (const token of tokens) {
    const found = lower.indexOf(token);
    if (found !== -1 && (index === -1 || found < index)) index = found;
  }

  if (index === -1) {
    return doc.doc.description || doc.plain.slice(0, 180);
  }

  const start = Math.max(0, index - 70);
  const end = Math.min(doc.plain.length, start + 200);
  const text = doc.plain.slice(start, end).trim();
  return `${start > 0 ? '...' : ''}${text}${end < doc.plain.length ? '...' : ''}`;
}

export function searchDocs(query: string, limit = 8): SearchHit[] {
  const phrase = query.trim().toLowerCase();
  const tokens = tokenize(query);
  if (!phrase || tokens.length === 0) return [];

  const safeLimit = Math.min(20, Math.max(1, Math.trunc(limit)));
  const hits: SearchHit[] = [];

  for (const doc of SEARCH_INDEX) {
    let score = 0;
    let matched = 0;

    if (doc.title.includes(phrase)) score += 50;
    if (doc.description.includes(phrase)) score += 16;
    if (doc.content.includes(phrase)) score += 6;

    for (const token of tokens) {
      let tokenMatched = false;

      if (doc.title.includes(token)) {
        score += 14;
        tokenMatched = true;
      }
      if (doc.headings.includes(token)) {
        score += 6;
        tokenMatched = true;
      }
      if (doc.description.includes(token)) {
        score += 5;
        tokenMatched = true;
      }
      if (doc.path.includes(token)) {
        score += 3;
        tokenMatched = true;
      }
      if (doc.content.includes(token)) {
        score += 1;
        tokenMatched = true;
      }

      if (tokenMatched) matched += 1;
    }

    if (matched === 0) continue;
    if (matched === tokens.length) score += 8;
    if (doc.doc.section === 'guides') score += 2;
    if (doc.doc.section === 'overview') score += 1;

    hits.push({
      doc: doc.doc,
      score,
      snippet: snippetFor(doc, tokens),
    });
  }

  hits.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return hits.slice(0, safeLimit);
}

export function formatSearchResults(query: string, hits: SearchHit[]): string {
  if (hits.length === 0) {
    return `No docs matched "${query}". Try a shorter query, a symbol name, or call list_docs to browse the available pages.`;
  }

  const lines = [`Found ${hits.length} doc${hits.length === 1 ? '' : 's'} for "${query}":`, ''];

  for (const hit of hits) {
    lines.push(`## ${hit.doc.title}`);
    lines.push(`Path: ${hit.doc.path}`);
    lines.push(`URL: ${DOCS_BASE_URL}${hit.doc.path}`);
    if (hit.doc.description) lines.push(`Description: ${hit.doc.description}`);
    lines.push(`Snippet: ${hit.snippet}`);
    lines.push('');
  }

  lines.push('Call get_doc with a Path above to read the full page.');
  return lines.join('\n');
}

export function listDocs(section?: string): BundledDoc[] {
  if (!section || section.toLowerCase() === 'all') return DOCS;

  const filter = section
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^docs\//, '');

  if (!filter) return DOCS;
  return DOCS.filter((doc) => doc.section === filter || doc.slug.startsWith(`${filter}/`));
}

export function formatDocList(section?: string): string {
  const docs = listDocs(section);
  if (docs.length === 0) {
    return `No docs found for section "${section}". Available sections: overview, guides, api.`;
  }

  const lines = [
    `# erlc.js documentation${section && section.toLowerCase() !== 'all' ? `: ${section}` : ''}`,
    '',
    `${docs.length} page${docs.length === 1 ? '' : 's'}. Use get_doc with a path to read one.`,
    '',
  ];

  let currentSection = '';
  for (const doc of docs) {
    if (doc.section !== currentSection) {
      currentSection = doc.section;
      lines.push(`## ${SECTION_TITLES[currentSection] ?? currentSection}`);
      lines.push('');
    }
    lines.push(`- **${doc.title}** (${doc.path})`);
    if (doc.description) lines.push(`  ${doc.description}`);
  }

  return lines.join('\n');
}

export function renderDoc(doc: BundledDoc): string {
  const lines = [`# ${doc.title}`, ''];

  if (doc.description) {
    lines.push(`> ${doc.description}`, '');
  }

  lines.push(`Path: ${doc.path}`);
  lines.push(`URL: ${DOCS_BASE_URL}${doc.path}`);
  lines.push('');
  lines.push(doc.content);

  return lines.join('\n');
}

export function renderDocsIndex(): string {
  return JSON.stringify(
    {
      name: 'erlc.js docs',
      url: `${DOCS_BASE_URL}/docs/`,
      count: DOCS.length,
      docs: DOCS.map((doc) => ({
        title: doc.title,
        description: doc.description,
        path: doc.path,
        uri: `erlcjs://docs/${doc.slug}`,
        section: doc.section,
      })),
    },
    null,
    2,
  );
}
