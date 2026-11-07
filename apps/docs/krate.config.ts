import { defineConfig, docs, sitemap } from '@krate/core';

const baseUrl = 'https://erlcjs.xyz';

export default defineConfig({
  entry: 'src/pages/index.tsx',
  outDir: 'dist',
  pagesDir: 'src/pages',
  publicDir: 'public',
  minify: true,

  viewTransitions: 'auto',

  devServer: {
    port: 3000,
    open: false,
  },

  markdown: {
    gfm: true,
    headingAnchors: true,
    admonitions: true,
    codeHighlight: true,
  },

  seo: {
    baseUrl,
    siteName: 'erlc.js',
    description:
      'A fully-typed TypeScript SDK for Roblox Emergency Response: Liberty County.',
    image: `${baseUrl}/og.png`,
  },

  redirects: [
    { source: '/guides/:path*', destination: '/docs/guides/:path*', permanent: true },
    { source: '/api/:path*', destination: '/docs/api/:path*', permanent: true },
  ],

  plugins: [
    sitemap({ baseUrl, changeFreq: 'weekly', priority: '0.8' }),
    docs({
      contentDir: 'src/content/docs',
      title: 'erlc.js',
      theme: './src/theme/docs-layout.tsx',
      editLink: { base: 'https://github.com/erlc-js/erlcjs/blob/dev/apps/docs' },
      sidebar: [
        { title: 'Documentation', url: '/docs/' },
        {
          title: 'Guides',
          collapsible: true,
          expanded: true,
          children: [
            { title: 'Getting Started', url: '/docs/guides/getting-started/' },
            { title: 'Client', url: '/docs/guides/client/' },
            { title: 'Players', url: '/docs/guides/players/' },
            { title: 'Server & Commands', url: '/docs/guides/server-commands/' },
            { title: 'Events', url: '/docs/guides/events/' },
            { title: 'Cache', url: '/docs/guides/cache/' },
            { title: 'Map', url: '/docs/guides/map/getting-started/' },
            { title: 'Presets', url: '/docs/guides/presets/getting-started/' },
            { title: 'Migrating from v1', url: '/docs/guides/migrating-from-v1/' },
            { title: 'MCP server', url: '/docs/guides/mcp/' },
          ],
        },
        {
          title: 'API Reference',
          collapsible: true,
          expanded: true,
          children: [
            { title: 'Overview', url: '/docs/api/' },
            { title: 'Core', url: '/docs/api/core/' },
            { title: 'Map', url: '/docs/api/map/' },
            { title: 'Presets', url: '/docs/api/presets/' },
          ],
        },
      ],
      search: {
        enabled: true,
        engine: 'pagefind',
        maxResults: 8,
      },
      links: [
        { icon: 'lucide:github', url: 'https://github.com/erlc-js/erlcjs', name: 'GitHub' },
        { icon: 'lucide:message-circle', url: 'https://discord.gg/yMK7Szrn8Q', name: 'Discord' },
      ],
    }),
  ],
});
