import { createEffect, createSignal, navigate, onCleanup, onMount } from '@krate/runtime';

export interface SidebarItem {
  title: string;
  url?: string;
  active?: boolean;
  indexURL?: string;
  collapsible?: boolean;
  expanded?: boolean;
  icon?: string;
  badge?: { text: string; variant?: string };
  children?: SidebarItem[];
}

export interface TOCItem {
  title: string;
  id: string;
  depth: number;
}

export interface BreadcrumbItem {
  label: string;
  url: string;
  isLast: boolean;
}

function trimTrailingSlashes(value: string): string {
  let path = value;
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

export function normalizeDocsPath(value: string): string {
  let path = value || '/docs/';
  if (path.startsWith('http')) {
    try {
      path = new URL(path).pathname;
    } catch {
      path = '/docs/';
    }
  }
  if (!path.startsWith('/')) path = `/docs/${path}`;
  if (path.endsWith('/index.html')) path = path.slice(0, -11);
  if (path.endsWith('/index')) path = path.slice(0, -6);

  // Krate prefixes sidebar URLs with the configured basePath (for example
  // /erlcjs/docs/... on GitHub Pages). Strip it so active states compare
  // against the base-path-free docs route.
  const docsIndex = path.indexOf('/docs/');
  if (docsIndex > 0) {
    path = path.slice(docsIndex);
  } else if (path.endsWith('/docs')) {
    path = '/docs/';
  }

  path = trimTrailingSlashes(path);
  return `${path}/`;
}

/**
 * Routes plain internal anchors through Krate's SPA router. Content links,
 * sidebar links, and footer links would otherwise trigger full reloads, which
 * makes the page fade inconsistent. Links already marked with data-krate-link
 * are left to the runtime's own handler.
 */
export function SpaLinkInterceptor() {
  onMount(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target ? (target.closest('a') as HTMLAnchorElement | null) : null;
      if (!anchor) return;
      if (
        anchor.hasAttribute('data-krate-link') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) {
        return;
      }

      event.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    }

    document.addEventListener('click', onClick);
    onCleanup(() => document.removeEventListener('click', onClick));
  });

  return <span class="sr-only" aria-hidden="true" />;
}

function containsActive(item: SidebarItem, current: string): boolean {
  if (item.active) return true;
  if (item.url && normalizeDocsPath(item.url) === current) return true;
  for (const child of item.children || []) {
    if (containsActive(child, current)) return true;
  }
  return false;
}

function SidebarEntry(props: {
  item: SidebarItem;
  current: string;
  onNavigate?: () => void;
}) {
  const item = props.item;
  const hasChildren = !!item.children && item.children.length > 0;
  const active = containsActive(item, props.current);
  const expanded = item.expanded || active;
  const [open, setOpen] = createSignal(expanded);
  let collapseRef: any = null;
  let animationTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  function toggle() {
    const node = collapseRef as HTMLElement | null;
    const next = !open();

    if (!node) {
      setOpen(next);
      return;
    }

    clearTimer();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setOpen(next);
      node.style.maxHeight = next ? '' : '0px';
      return;
    }

    if (next) {
      node.style.maxHeight = '0px';
      setOpen(true);
      const height = node.scrollHeight;
      animationTimer = setTimeout(() => {
        node.style.maxHeight = `${height}px`;
        animationTimer = setTimeout(() => {
          node.style.maxHeight = '';
          animationTimer = null;
        }, 260);
      }, 10);
    } else {
      node.style.maxHeight = `${node.scrollHeight}px`;
      void node.offsetHeight;
      setOpen(false);
      node.style.maxHeight = '0px';
    }
  }

  onCleanup(clearTimer);

  if (!hasChildren) {
    return (
      <a
        class={active ? 'docs-sidebar-link active' : 'docs-sidebar-link'}
        href={item.url || '#'}
        onClick={props.onNavigate}
      >
        <span>{item.title}</span>
        {item.badge && <span class="docs-sidebar-badge">{item.badge.text}</span>}
      </a>
    );
  }

  return (
    <div
      class={
        active
          ? open()
            ? 'docs-sidebar-group active open'
            : 'docs-sidebar-group active'
          : open()
            ? 'docs-sidebar-group open'
            : 'docs-sidebar-group'
      }
    >
      <button
        class="docs-sidebar-summary"
        type="button"
        aria-expanded={open() ? 'true' : 'false'}
        onClick={toggle}
      >
        <span>{item.title}</span>
        <svg
          class="docs-sidebar-chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <div
        class="docs-sidebar-collapse"
        style={expanded ? '' : 'max-height: 0px'}
        inert={open() ? undefined : true}
        ref={collapseRef}
      >
        <div class="docs-sidebar-children">
          {item.children?.map((child) => (
            <SidebarEntry item={child} current={props.current} onNavigate={props.onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SidebarNav(props: {
  items: SidebarItem[];
  currentPath?: string;
  onNavigate?: () => void;
}) {
  const current = normalizeDocsPath(props.currentPath || '/docs/');

  return (
    <nav class="docs-sidebar-nav" aria-label="Documentation">
      {props.items.map((item) => (
        <SidebarEntry item={item} current={current} onNavigate={props.onNavigate} />
      ))}
    </nav>
  );
}

export function TOCNav(props: {
  items: TOCItem[];
  onNavigate?: () => void;
  onActive?: (title: string) => void;
}) {
  let navRef: any = null;
  let progressRef: any = null;
  let markerRef: any = null;

  onMount(() => {
    if (!navRef) return;

    const links = Array.from(navRef.querySelectorAll('a[href^="#"]')) as HTMLAnchorElement[];
    const entries = links
      .map((link) => {
        const href = link.getAttribute('href') || '';
        const id = decodeURIComponent(href.slice(1));
        return { link, heading: document.getElementById(id) };
      })
      .filter((entry) => entry.heading) as Array<{
      link: HTMLAnchorElement;
      heading: HTMLElement;
    }>;

    if (entries.length === 0) return;

    function update() {
      if (!navRef || !progressRef || !markerRef) return;

      let activeIndex = 0;
      for (let index = 0; index < entries.length; index++) {
        if (entries[index].heading.getBoundingClientRect().top <= 120) {
          activeIndex = index;
        }
      }

      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) activeIndex = entries.length - 1;

      for (let index = 0; index < entries.length; index++) {
        entries[index].link.classList.toggle('active', index === activeIndex);
      }

      if (props.onActive) {
        const title = entries[activeIndex].link.textContent || '';
        props.onActive(title.trim());
      }

      const activeLink = entries[activeIndex].link;
      const center = activeLink.offsetTop + activeLink.offsetHeight / 2;

      if (atBottom) {
        const end = navRef.offsetHeight - 2;
        progressRef.style.height = `${end}px`;
        markerRef.style.top = `${end}px`;
      } else {
        progressRef.style.height = `${center}px`;
        markerRef.style.top = `${center}px`;
      }
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    onCleanup(() => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    });
  });

  return (
    <nav class="docs-toc-nav" aria-label="On this page" ref={navRef}>
      <span class="docs-toc-progress" aria-hidden="true" ref={progressRef}></span>
      <span class="docs-toc-marker" aria-hidden="true" ref={markerRef}></span>
      {props.items.map((item) => (
        <a
          class={`docs-toc-link depth-${item.depth}`}
          href={`#${item.id}`}
          onClick={props.onNavigate}
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}

export function Breadcrumbs(props: { items: BreadcrumbItem[] }) {
  if (!props.items || props.items.length === 0) return <span />;

  return (
    <nav class="docs-breadcrumbs" aria-label="Breadcrumb">
      {props.items.map((item, index) => (
        <span class="docs-breadcrumb-item">
          {index > 0 && <span class="docs-breadcrumb-sep">/</span>}
          {item.isLast ? (
            <span class="docs-breadcrumb-current">{item.label}</span>
          ) : (
            <a href={item.url}>{item.label}</a>
          )}
        </span>
      ))}
    </nav>
  );
}

export function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
      />
    </svg>
  );
}

export function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
  );
}

export function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="m4 7.5 8 4.5 8-4.5" />
      <path d="M12 12v9" />
    </svg>
  );
}

export function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ThemeToggle(props: { storageKey?: string }) {
  const storageKey = props.storageKey || 'theme';
  const [theme, setTheme] = createSignal('light');
  let buttonRef: any = null;

  onMount(() => {
    let saved = '';
    try {
      saved = localStorage.getItem(storageKey) || '';
    } catch {
      saved = '';
    }

    const dark =
      saved === 'dark' ||
      (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setTheme(dark ? 'dark' : 'light');
  });

  createEffect(() => {
    const dark = theme() === 'dark';
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
    if (buttonRef) {
      buttonRef.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      buttonRef.setAttribute('data-theme-state', dark ? 'dark' : 'light');
    }
  });

  function toggle() {
    const next = theme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Storage can be unavailable in private mode.
    }
  }

  return (
    <button
      class="theme-toggle"
      ref={buttonRef}
      type="button"
      aria-label="Toggle color theme"
      onClick={toggle}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313-12.454z" />
      </svg>
    </button>
  );
}
