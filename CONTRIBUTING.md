# Contributing to erlc.js

Thanks for your interest in contributing to erlc.js! We welcome bug reports, feature
requests, documentation improvements, and pull requests.

## Getting Started

erlc.js is a monorepo built with pnpm workspaces and Turborepo.

| Package | Location | Description |
|---------|----------|-------------|
| `@erlcjs/core` | `packages/core` | API client, REST handling, polling, webhooks, caches |
| `@erlcjs/map` | `packages/map` | PNG map rendering built on `sharp` |
| `@erlcjs/presets` | `packages/presets` | Ready-made moderation and utility presets |
| Docs | `apps/docs` | Krate documentation site |

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/)

### Setting up the repo

```sh
git clone https://github.com/erlc-js/erlcjs.git
cd erlcjs
pnpm install
pnpm build
```

### Running checks

```sh
pnpm lint     # eslint + tsdoc across packages
pnpm test     # vitest suites (core and presets)
pnpm build    # tsup build for every package
```

The `test` scripts in `packages/core` and `packages/presets` run with Vitest. Some
integration scripts (such as `packages/map/src/index.integration.ts` and
`packages/core/src/index.integration.ts`) expect `API_KEY`, `GLOBAL_KEY`, and `APP_ID`
in a root `.env` file and talk to a real server.

### Working on the docs

```sh
pnpm docs:dev      # start the Krate docs server (generates the API reference on first run)
pnpm docs:generate # regenerate the API reference without starting the server
```

## Project Layout

```
packages/
  core/     API client and everything it manages (managers, structures, gateway)
  map/      Map rendering helpers and built-in map types
  presets/  Reusable moderation callbacks and punishment helpers
apps/
  docs/     Documentation site (guides + generated API reference)
```

## Development Workflow

1. Fork the repository and create a branch from `dev`.
2. Make your changes. Keep them focused and small.
3. Add or update tests. New manager behavior should have a Vitest test; new public
   API should be covered by TSDoc.
4. Run `pnpm build`, `pnpm test`, and `pnpm lint`.
5. Add a changeset for any change to a published package:
   ```sh
   pnpm changeset
   ```
6. Open a pull request against `dev`.

## Pull Request Guidelines

- One logical change per PR. Keep the diff reviewable.
- Use a descriptive title and reference related issues.
- Update the docs or TSDoc when user-facing behavior changes.
- Verify CI passes before asking for review.

## Coding Conventions

- **TypeScript**: Strict mode is enabled. Follow the existing style — 4-space
  indentation, single quotes, semicolons, and trailing commas.
- **Public API**: Add TSDoc comments (`@public`, `@param`, `@returns`); API Extractor
  reads them to build the reference docs.
- **Structures**: Follow the existing `_patch(raw)` / `toJSON()` pattern, and type
  event payloads through `ClientEvents`.
- **Managers**: Keep the `fetchAll()` / `updateCache()` shape and emit the
  corresponding events when data changes.
- **Comments**: Only when they explain *why*, not what.

## Report a Security Issue

Please do **not** open a public issue for security problems. See
[SECURITY.md](SECURITY.md) for how to report vulnerabilities privately.

## Getting Help

- Open an issue for bugs or feature requests.
- Use the discussion area for questions about usage.
