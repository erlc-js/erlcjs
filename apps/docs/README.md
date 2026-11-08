# erlc.js docs

The erlc.js documentation site, built with [Krate](https://krate.js.org).

## Development

From this directory:

```bash
pnpm dev      # krate dev on http://localhost:3000
pnpm build    # production build dist/
pnpm serve    # preview the production build
```

From the repo root, use `pnpm docs:dev` for a fast docs-only dev server
(the API reference is generated on first run), or `pnpm docs:build` to
regenerate the API reference and build the site.

Run `pnpm docs:generate` after changing a public API so the reference picks
up the new symbols.

## Structure

```
src/
  pages/              Homepage, 404, and the marketing shell
  theme/              Custom docs layout, chrome, search, and styles
  styles/             Shared tokens, homepage, and docs CSS
  content/docs/       Guides and the generated API reference
public/
  fonts/              JetBrains Mono + Inter
  logo.png            erlc.js logo
  og.png              Social card
krate.config.ts       Site config, docs plugin, search, redirects
scripts/generate-api.mjs
```

## Content

Guides live in `src/content/docs/guides` as Markdown. Frontmatter controls the title and sidebar order:

```md
---
title: Getting Started
description: Install erlc.js and run your first script.
order: 1
---
```

API pages are generated from the package API Extractor output with `node scripts/generate-api.mjs`. Do not edit `src/content/docs/api` by hand.
