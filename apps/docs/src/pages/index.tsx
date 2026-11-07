import { Code } from '@krate/components';
import { MapIcon, PackageIcon, ShieldIcon } from '../theme/chrome';

export default function Home() {
  return (
    <>
      <Head>
        <title>erlc.js — TypeScript SDK for ER:LC private servers</title>
        <meta
          name="description"
          content="A fully-typed TypeScript SDK for Roblox Emergency Response: Liberty County. Multi-server, polling, webhooks, caches, maps, and presets."
        />
      </Head>

      <section class="hero">
        <div class="hero-copy">
          <h1 class="hero-title">The TypeScript SDK for ER:LC.</h1>
          <p class="hero-lede">
            Manage servers, players, and console commands through one typed client.
          </p>

          <div class="hero-actions">
            <a class="btn btn-primary" href="/docs/guides/getting-started/">Get started</a>
            <a class="btn btn-secondary" href="/docs/api/">API reference</a>
          </div>
        </div>

        <div class="hero-panel">
          <Code lang="typescript" title="server.ts" showCopy>{`import { Client, ERLCEvents } from '@erlcjs/core';

const client = new Client({
    servers: ['YOUR_SERVER_KEY'],
    polling: { enabled: true },
});

client.on(ERLCEvents.playerJoin, (player) => {
    player.message(\`Welcome to \${player.server.info?.name}!\`);
});

client.on(ERLCEvents.kill, (kill) => {
    console.log(kill.killerUsername, 'killed', kill.killedUsername);
});

client.on('error', console.error);`}</Code>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>What's included.</h2>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-head">
              <span class="feature-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="7" rx="2" />
                  <rect x="3" y="13" width="18" height="7" rx="2" />
                  <path d="M7 7.5h.01M7 16.5h.01" />
                </svg>
              </span>
              <h3>Multi-server</h3>
            </div>
            <p>One client owns many servers, each with its own cache and polling loop.</p>
          </div>
          <div class="feature-card">
            <div class="feature-head">
              <span class="feature-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                </svg>
              </span>
              <h3>Typed events</h3>
            </div>
            <p>Player, vehicle, call, and log events are inferred from the source.</p>
          </div>
          <div class="feature-card">
            <div class="feature-head">
              <span class="feature-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
              </span>
              <h3>Polling + webhooks</h3>
            </div>
            <p>Poll for full state, or use the signed gateway for calls and custom commands.</p>
          </div>
          <div class="feature-card">
            <div class="feature-head">
              <span class="feature-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="4" y="3" width="16" height="6" rx="3" />
                  <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
                  <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                </svg>
              </span>
              <h3>Cached structures</h3>
            </div>
            <p>Players, vehicles, staff, and logs are live objects with related-data getters.</p>
          </div>
        </div>
      </section>

      <section class="quickstart">
        <div class="quickstart-copy">
          <h2>Start in one file.</h2>
          <p>
            Install the package, add a server key, and subscribe to an event. The
            client handles polling and caching from there.
          </p>
          <a class="text-link" href="/docs/guides/getting-started/">Read the getting started guide</a>
        </div>

        <div class="quickstart-code">
          <Code lang="bash" title="terminal" showCopy>{`npm install @erlcjs/core
node index.js`}</Code>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Packages</h2>
        </div>

        <div class="package-grid">
          <a class="package-card" href="/docs/guides/getting-started/">
            <div class="package-head">
              <span class="package-icon"><PackageIcon /></span>
              <div class="package-name">@erlcjs/core</div>
            </div>
            <p>Client, REST, polling, webhooks, caches, and structures.</p>
            <span class="package-link">Read the docs</span>
          </a>
          <a class="package-card" href="/docs/guides/map/getting-started/">
            <div class="package-head">
              <span class="package-icon"><MapIcon /></span>
              <div class="package-name">@erlcjs/map</div>
            </div>
            <p>Live PNG maps with headshots, team colors, calls, and mod badges.</p>
            <span class="package-link">Render a map</span>
          </a>
          <a class="package-card" href="/docs/guides/presets/getting-started/">
            <div class="package-head">
              <span class="package-icon"><ShieldIcon /></span>
              <div class="package-name">@erlcjs/presets</div>
            </div>
            <p>Reusable moderation callbacks for vehicles, liveries, commands, and kills.</p>
            <span class="package-link">Use presets</span>
          </a>
        </div>
      </section>

      <section class="cta">
        <h2>Build your bot today.</h2>
        <p>Install the package and connect your first server in minutes.</p>
        <div class="cta-actions">
          <a class="btn btn-primary" href="/docs/guides/getting-started/">Get started</a>
          <a class="text-link" href="/docs/api/">API reference</a>
        </div>
      </section>
    </>
  );
}
