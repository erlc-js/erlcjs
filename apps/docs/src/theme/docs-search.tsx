import { createSignal, navigate, onCleanup, onMount } from '@krate/runtime';

interface Hit {
  href?: string;
  path?: string;
  title?: string;
  body?: string;
  content?: string;
}

interface SearchEntry {
  title?: string;
  path?: string;
  content?: string;
}

let indexPromise: Promise<SearchEntry[]> | null = null;

function loadIndex(): Promise<SearchEntry[]> {
  if (!indexPromise) {
    indexPromise = fetch('/docs/data/search-index.json')
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => []);
  }
  return indexPromise;
}

function groupRank(path: string): number {
  if (path.startsWith('/docs/guides')) return 0;
  if (path.startsWith('/docs/api')) return 2;
  return 1;
}

function searchIndex(entries: SearchEntry[], query: string, limit: number): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return entries
    .map((entry) => {
      const title = (entry.title || '').toLowerCase();
      const haystack = `${title} ${(entry.content || '').toLowerCase()}`;
      let score = 0;

      for (const word of words) {
        if (haystack.indexOf(word) === -1) return { entry, score: 0 };
        score += title.indexOf(word) !== -1 ? 10 : 1;
      }

      return { entry, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      const group = groupRank(a.entry.path || '') - groupRank(b.entry.path || '');
      return group !== 0 ? group : b.score - a.score;
    })
    .slice(0, limit)
    .map(({ entry }) => ({
      href: entry.path || '/',
      title: entry.title || 'Untitled',
      body: (entry.content || '').slice(0, 150),
    }));
}

export interface DocsSearchProps {
  placeholder?: string;
  maxResults?: number;
  label?: string;
}

export function DocsSearch(props: DocsSearchProps) {
  const placeholder = props.placeholder || 'Search docs';
  const limit = props.maxResults || 8;
  const label = props.label || 'Search documentation';

  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<Hit[]>([]);
  const [open, setOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [active, setActive] = createSignal(-1);

  let rootRef: HTMLElement | null = null;
  let inputRef: any = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function run(value: string) {
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    loadIndex()
      .then((entries) => {
        setResults(searchIndex(entries, value, limit));
        setOpen(true);
        setActive(-1);
        setLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLoading(false);
      });
  }

  function onInput(value: string) {
    setQuery(value);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => run(value), 100);
  }

  function choose(index: number) {
    const hit = results()[index];
    if (!hit) return;
    setOpen(false);
    navigate(hit.href || hit.path || '/');
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    const list = results();
    if (!open() || list.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((active() + 1) % list.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((active() - 1 + list.length) % list.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(active() < 0 ? 0 : active());
    }
  }

  onMount(() => {
    function onDocumentClick(event: MouseEvent) {
      if (rootRef && !rootRef.contains(event.target as Node)) setOpen(false);
    }

    function onShortcut(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        inputRef?.focus();
        if (results().length > 0) setOpen(true);
      } else if (event.key === 'Escape') {
        setOpen(false);
        inputRef?.blur();
      }
    }

    document.addEventListener('click', onDocumentClick);
    window.addEventListener('keydown', onShortcut);
    onCleanup(() => {
      document.removeEventListener('click', onDocumentClick);
      window.removeEventListener('keydown', onShortcut);
    });
  });

  return (
    <div class="docs-search" ref={rootRef}>
      <span class="docs-search-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        class="docs-search-input"
        type="search"
        placeholder={placeholder}
        aria-label={label}
        aria-keyshortcuts="Control+K Meta+K"
        autocomplete="off"
        spellcheck="false"
        value={query()}
        ref={inputRef}
        onInput={(event: any) => onInput(event.target.value)}
        onFocus={() => {
          if (results().length > 0) setOpen(true);
        }}
        onKeyDown={onKey}
      />

      <kbd class="docs-search-kbd">Ctrl K</kbd>

      {open() && (
        <div class="docs-search-results" role="listbox">
          {loading() && results().length === 0 && (
            <div class="docs-search-empty">Searching...</div>
          )}
          {!loading() && results().length === 0 && (
            <div class="docs-search-empty">No results</div>
          )}
          {results().map((hit, index) => (
            <a
              key={hit.href || hit.path || String(index)}
              class={`docs-search-item${index === active() ? ' active' : ''}`}
              href={hit.href || hit.path || '/'}
              data-krate-link
              role="option"
              aria-selected={index === active() ? 'true' : 'false'}
            >
              <span class="docs-search-title">{hit.title || 'Untitled'}</span>
              {(hit.body || hit.content) && (
                <span class="docs-search-snippet">
                  {(hit.body || hit.content || '').slice(0, 150)}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
