import { createEffect, createSignal, onCleanup, onMount } from '@krate/runtime';
import {
  Breadcrumbs,
  DiscordIcon,
  GitHubIcon,
  SidebarNav,
  SpaLinkInterceptor,
  TOCNav,
  ThemeToggle,
  normalizeDocsPath,
} from './chrome';
import { DocsSearch } from './docs-search';
import '../styles/global.css';
import './docs.css';

interface SidebarItem {
  title: string;
  url: string;
  active?: boolean;
  indexURL?: string;
  collapsible?: boolean;
  expanded?: boolean;
  icon?: string;
  badge?: { text: string; variant?: string };
  children?: SidebarItem[];
}

interface TOCItem {
  title: string;
  id: string;
  depth: number;
}

interface BreadcrumbItem {
  label: string;
  url: string;
  isLast: boolean;
}

interface SocialLinkItem {
  icon: string;
  url: string;
  name: string;
}

interface HeroAction {
  text: string;
  link: string;
  variant?: string;
}

interface HeroData {
  title?: string;
  tagline?: string;
  image?: string;
  actions?: HeroAction[];
}

interface DocsLayoutProps {
  pageTitle: string;
  siteTitle: string;
  children: any;
  sidebarItems: SidebarItem[];
  tocItems: TOCItem[];
  breadcrumbs: BreadcrumbItem[];
  prevTitle?: string;
  prevLink?: string;
  nextTitle?: string;
  nextLink?: string;
  socialLinks: SocialLinkItem[];
  currentPath: string;
  description?: string;
  template?: 'doc' | 'hero';
  hero?: HeroData;
  tocHidden?: boolean;
  tocLabel?: string;
  editUrl?: string;
  lastUpdated?: string;
  authors?: string[];
}

export default function ErlcDocsLayout(props: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [tocOpen, setTocOpen] = createSignal(false);
  const [activeTocTitle, setActiveTocTitle] = createSignal('');

  const isHero = props.template === 'hero';
  const showToc = !props.tocHidden && (props.tocItems?.length ?? 0) > 0;
  const tocLabel = props.tocLabel || 'On this page';
  const currentPath = normalizeDocsPath(props.currentPath || '/docs/');

  function closeNav() {
    setSidebarOpen(false);
    setTocOpen(false);
  }

  onMount(() => {
    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeNav();
    }
    window.addEventListener('keydown', onKeydown);
    onCleanup(() => window.removeEventListener('keydown', onKeydown));
  });

  createEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.classList.toggle('docs-nav-open', sidebarOpen());
  });

  const guidesActive = currentPath.startsWith('/docs/guides');
  const apiActive = currentPath.startsWith('/docs/api');

  return (
    <div class="docs-shell">
      <SpaLinkInterceptor />
      <Head>
        <title>{props.pageTitle} — erlc.js docs</title>
        <link rel="icon" href="/logo.png" />
        <link
          rel="preload"
          href="/fonts/jetbrains-mono.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0b0b0e" media="(prefers-color-scheme: dark)" />
      </Head>

      <a class="skip-link" href="#main">Skip to content</a>

      <header class="docs-header">
        <div class="docs-header-inner">
          <Link className="docs-brand" href="/">
            <img class="brand-logo" src="/logo.png" alt="" width="26" height="26" />
            <span class="brand-name">erlc.js</span>
            <span class="brand-badge">docs</span>
          </Link>

          <nav class="docs-topnav" aria-label="Primary">
            <Link class={guidesActive ? 'active' : ''} href="/docs/guides/getting-started/">
              Guides
            </Link>
            <Link class={apiActive ? 'active' : ''} href="/docs/api/">
              API
            </Link>
          </nav>

          <div class="docs-actions">
            <div class="docs-search-slot">
              <DocsSearch placeholder="Search docs" maxResults={8} />
            </div>
            <a
              class="icon-link"
              href="https://github.com/erlc-js/erlcjs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <GitHubIcon />
            </a>
            <a
              class="icon-link"
              href="https://discord.gg/yMK7Szrn8Q"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              title="Discord"
            >
              <DiscordIcon />
            </a>
            <ThemeToggle storageKey="theme" />
            <button
              class="docs-menu-btn"
              type="button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen() ? 'true' : 'false'}
              onClick={() => setSidebarOpen(!sidebarOpen())}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div class="docs-frame">
        <div
          class={`docs-sidebar-overlay${sidebarOpen() ? ' open' : ''}`}
          onClick={closeNav}
        />

        <aside class={`docs-sidebar${sidebarOpen() ? ' open' : ''}`}>
          <div class="docs-sidebar-inner">
            <SidebarNav
              items={props.sidebarItems}
              currentPath={currentPath}
              onNavigate={closeNav}
            />
            <div class="docs-sidebar-footer">
              <div class="docs-sidebar-icons">
                <a
                  class="icon-link"
                  href="https://github.com/erlc-js/erlcjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                >
                  <GitHubIcon />
                </a>
                <a
                  class="icon-link"
                  href="https://discord.gg/yMK7Szrn8Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  title="Discord"
                >
                  <DiscordIcon />
                </a>
                <a
                  class="icon-link"
                  href="https://www.npmjs.com/package/@erlcjs/core"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="npm"
                  title="npm"
                >
                  <Icon name="ri:npmjs-fill" width="18" height="18" />
                </a>
              </div>
              <a
                class="docs-krate-link"
                href="https://krate.js.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Built with Krate
              </a>
            </div>
          </div>
        </aside>

        <main class="docs-main" id="main">
          {showToc && (
            <div class={tocOpen() ? 'docs-toc-mobile open' : 'docs-toc-mobile'}>
              <button
                class="docs-toc-mobile-header"
                type="button"
                aria-expanded={tocOpen() ? 'true' : 'false'}
                onClick={() => setTocOpen(!tocOpen())}
              >
                <span class="docs-toc-mobile-copy">
                  <span class="docs-toc-mobile-label">{tocLabel}</span>
                  <span class="docs-toc-mobile-title">
                    {activeTocTitle() || props.tocItems[0]?.title || props.pageTitle}
                  </span>
                </span>
                <svg
                  class="docs-toc-mobile-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div class="docs-toc-mobile-body" inert={tocOpen() ? undefined : true}>
                <div class="docs-toc-mobile-inner">
                  <TOCNav
                    items={props.tocItems}
                    onNavigate={closeNav}
                    onActive={setActiveTocTitle}
                  />
                </div>
              </div>
            </div>
          )}

          {isHero ? (
            <section class="docs-hero">
              <h1 class="docs-hero-title">{props.hero?.title || props.pageTitle}</h1>
              {props.hero?.tagline && <p class="docs-hero-tagline">{props.hero.tagline}</p>}
              {props.hero?.actions && props.hero.actions.length > 0 && (
                <div class="docs-hero-actions">
                  {props.hero.actions.map((action) => (
                    <Link
                      class={`docs-hero-action${action.variant === 'secondary' ? ' secondary' : ''}`}
                      href={action.link}
                    >
                      {action.text}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <Breadcrumbs items={props.breadcrumbs} />
              <h1 class="docs-title">{props.pageTitle}</h1>
              {props.description && <p class="docs-lede">{props.description}</p>}
            </>
          )}

          <article class={`docs-content${isHero ? ' docs-content-hero' : ''}`}>
            {props.children}
          </article>

          <footer class="docs-page-footer">
            {props.editUrl ? (
              <a class="docs-edit-link" href={props.editUrl} target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Edit this page
              </a>
            ) : (
              <span />
            )}
            {props.lastUpdated && <span class="docs-updated">Updated {props.lastUpdated.slice(0, 10)}</span>}
          </footer>
        </main>

        {showToc && (
          <aside class="docs-toc">
            <div class="docs-toc-inner">
              <div class="docs-toc-label">{tocLabel}</div>
              <TOCNav items={props.tocItems} onNavigate={closeNav} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
