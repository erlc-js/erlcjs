import { describe, expect, it } from 'vitest';
import { DOCS } from './generated.js';
import {
  findDoc,
  listDocs,
  normalizeDocLookup,
  renderDoc,
  searchDocs,
} from './docs.js';

describe('bundled docs', () => {
  it('contains every docs route', () => {
    expect(DOCS.length).toBeGreaterThan(80);
    expect(new Set(DOCS.map((doc) => doc.path)).size).toBe(DOCS.length);

    for (const doc of DOCS) {
      expect(doc.path).toMatch(/^\/docs\//);
      expect(doc.path.endsWith('/')).toBe(true);
      expect(doc.title.length).toBeGreaterThan(0);
    }
  });

  it('includes guides and API reference pages', () => {
    expect(DOCS.some((doc) => doc.path === '/docs/guides/getting-started/')).toBe(true);
    expect(DOCS.some((doc) => doc.path === '/docs/guides/players/')).toBe(true);
    expect(DOCS.some((doc) => doc.path === '/docs/api/core/client/')).toBe(true);
  });
});

describe('doc lookup', () => {
  it('normalizes routes, slugs, URLs, and MCP URIs', () => {
    expect(normalizeDocLookup('/docs/guides/players/')).toBe('guides/players');
    expect(normalizeDocLookup('guides/players')).toBe('guides/players');
    expect(normalizeDocLookup('https://erlcjs.xyz/docs/guides/players/')).toBe('guides/players');
    expect(normalizeDocLookup('erlcjs://docs/guides/players')).toBe('guides/players');
    expect(normalizeDocLookup('/docs/')).toBe('');
  });

  it('finds docs from every supported form', () => {
    const route = findDoc('/docs/guides/players/');
    const slug = findDoc('guides/players');
    const uri = findDoc('erlcjs://docs/guides/players');
    const url = findDoc('https://erlcjs.xyz/docs/guides/players/');

    expect(route?.title).toBe('Managing Players');
    expect(slug?.path).toBe('/docs/guides/players/');
    expect(uri?.path).toBe('/docs/guides/players/');
    expect(url?.path).toBe('/docs/guides/players/');
  });

  it('returns null for unknown docs', () => {
    expect(findDoc('guides/does-not-exist')).toBeNull();
  });

  it('renders a full markdown page', () => {
    const doc = findDoc('guides/players');
    expect(doc).not.toBeNull();
    const rendered = renderDoc(doc!);

    expect(rendered).toContain('# Managing Players');
    expect(rendered).toContain('Path: /docs/guides/players/');
    expect(rendered).toContain('## Player properties');
  });
});

describe('doc search', () => {
  it('finds event names in guides', () => {
    const hits = searchDocs('playerJoin', 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.doc.path === '/docs/guides/events/')).toBe(true);
  });

  it('finds API symbols', () => {
    const hits = searchDocs('ClientOptions', 5);
    expect(hits.some((hit) => hit.doc.path === '/docs/api/core/clientoptions/')).toBe(true);
  });

  it('returns empty results for a missing term', () => {
    expect(searchDocs('zzzzqqqqwwww')).toEqual([]);
  });

  it('filters docs by section', () => {
    const apiDocs = listDocs('api');
    expect(apiDocs.length).toBeGreaterThan(10);
    expect(apiDocs.every((doc) => doc.section === 'api')).toBe(true);
  });
});
