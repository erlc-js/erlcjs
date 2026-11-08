import { DiscordIcon, GitHubIcon, SpaLinkInterceptor, ThemeToggle } from '../theme/chrome';
import '../styles/global.css';
import '../styles/home.css';

export default function SiteLayout(props: { children: any }) {
  return (
    <div class="site-shell">
      <SpaLinkInterceptor />
      <Head>
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

      <header class="site-header">
        <div class="site-header-inner">
          <a class="site-brand" href="/">
            <img class="brand-logo" src="/logo.png" alt="" width="26" height="26" />
            <span class="brand-name">erlc.js</span>
          </a>

          <nav class="site-nav" aria-label="Primary">
            <a href="/docs/guides/getting-started/">Guides</a>
            <a href="/docs/api/">API</a>
          </nav>

          <div class="site-actions">
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
              href="https://github.com/erlc-js/erlcjs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <GitHubIcon />
            </a>
            <ThemeToggle storageKey="theme" />
          </div>
        </div>
      </header>

      <main id="main">{props.children}</main>

      <footer class="site-footer">
        <div class="site-footer-inner">
          <div class="site-footer-brand">
            <img class="brand-logo" src="/logo.png" alt="" width="24" height="24" />
            <div>
              <div class="site-footer-name">erlc.js</div>
              <div class="site-footer-note">TypeScript SDK for ER:LC private servers.</div>
            </div>
          </div>
          <div class="site-footer-links">
            <div class="site-footer-column">
              <div class="site-footer-title">Docs</div>
              <a href="/docs/guides/getting-started/">Getting started</a>
              <a href="/docs/guides/client/">Client</a>
              <a href="/docs/guides/events/">Events</a>
              <a href="/docs/api/">API reference</a>
            </div>
            <div class="site-footer-column">
              <div class="site-footer-title">Packages</div>
              <a href="https://www.npmjs.com/package/@erlcjs/core" target="_blank" rel="noopener noreferrer">
                @erlcjs/core
              </a>
              <a href="https://www.npmjs.com/package/@erlcjs/map" target="_blank" rel="noopener noreferrer">
                @erlcjs/map
              </a>
              <a href="https://www.npmjs.com/package/@erlcjs/presets" target="_blank" rel="noopener noreferrer">
                @erlcjs/presets
              </a>
            </div>
            <div class="site-footer-column">
              <div class="site-footer-title">Project</div>
              <a href="https://github.com/erlc-js/erlcjs" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://discord.gg/yMK7Szrn8Q" target="_blank" rel="noopener noreferrer">
                Discord
              </a>
              <a href="https://github.com/erlc-js/erlcjs/blob/dev/LICENSE">Apache-2.0</a>
            </div>
          </div>
        </div>
        <div class="site-footer-bottom">
          <span>© 2026 erlc-js contributors</span>
          <a
            href="https://krate.js.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built with Krate
          </a>
        </div>
      </footer>
    </div>
  );
}
