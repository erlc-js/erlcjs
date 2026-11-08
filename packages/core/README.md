# @erlcjs/core

[![npm version](https://img.shields.io/npm/v/@erlcjs/core?style=flat-square)](https://www.npmjs.com/package/@erlcjs/core)
[![npm downloads](https://img.shields.io/npm/dm/@erlcjs/core?style=flat-square)](https://www.npmjs.com/package/@erlcjs/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/@erlcjs/core?style=flat-square)](https://github.com/erlc-js/erlcjs/blob/main/LICENSE)

`@erlcjs/core` is a fully-typed TypeScript wrapper for Roblox's **Emergency Response: Liberty County (ER:LC)** private server API. It manages polling, webhooks, rate limits, and per-server caches so you can build moderation tools, dashboards, and bots.

## Features

- **Multi-server client** — manage one or many ER:LC servers from a single process.
- **Polling and webhooks** — poll for full state or use the signed webhook gateway.
- **Typed events** — every event callback is fully typed.
- **Automatic caching** — players, vehicles, staff, calls, and logs are cached as structures.
- **Player helpers** — kick, ban, jail, heal, message, teleport, and more.
- **Custom commands** — register in-game `;commands` with permissions and aliases.

## Prerequisites

- Node.js 20 or newer
- A valid ER:LC private server API key

## Installation

```sh
npm install @erlcjs/core
# or
pnpm add @erlcjs/core
```

## CLI and MCP

`@erlcjs/core` ships the `erlcjs` CLI and a bundled documentation MCP server.

```sh
erlcjs version
erlcjs mcp
```

`version` prints the installed package version. `mcp` starts a stdio MCP server with the official erlc.js documentation baked into the package. It works offline and exposes:

- `search_docs` to find guides and API pages by topic, symbol, event, or error name
- `get_doc` to read a full Markdown page
- `list_docs` to browse the docs by section
- `erlcjs://docs` and `erlcjs://docs/<slug>` resources
- an `answer-from-docs` prompt for agent workflows

Add the server to an MCP client:

```json
{
  "mcpServers": {
    "erlcjs": {
      "command": "erlcjs",
      "args": ["mcp"]
    }
  }
}
```

If the package is not installed globally, use:

```sh
npx -y @erlcjs/core mcp
```

## Quick Start

```typescript
import { Client, ERLCEvents } from '@erlcjs/core';

const client = new Client({
    servers: ['YOUR_SERVER_API_KEY'],
    polling: { enabled: true },
});

client.on(ERLCEvents.playerJoin, (player) => {
    player.message(`Welcome to ${player.server.info?.name}!`);
});

client.on('error', console.error);
```

Each server key belongs to one private server. Access its managers and caches through the server:

```typescript
const server = client.servers.get('YOUR_SERVER_ID')!;

server.players.cache.get(userId);
await server.commands.execute(':pm jamie hello');
await server.commands.execute(':h Server restart in 5 minutes');
```

## Players

```typescript
const player = server.players.cache.get(userId);

await player?.message('Please follow the rules.');
await player?.kick('Breaking the rules');
await player?.ban('Repeated offences');
```

Players also expose `jail`, `heal`, `kill`, `wanted`, `respawn`, `load`, `refresh`, `helper`, `mod`, `admin`, `tp`, and their un-prefixed counterparts.

## Webhook Gateway

```typescript
const client = new Client({
    servers: ['YOUR_SERVER_API_KEY'],
    polling: { enabled: true },
    webhook: {
        enabled: true,
        port: 3000,
        path: '/webhook',
    },
});
```

Webhooks are verified with ER:LC's Ed25519 signature and a timestamp tolerance. They deliver emergency-call and custom-command events; keep polling enabled for the rest.

## Custom Commands

```typescript
import { PlayerPermission } from '@erlcjs/core';

server.registerCommand({
    name: 'ping',
    aliases: ['p'],
    permission: [PlayerPermission.Mod],
    execute: ({ player }) => {
        player.message('pong');
    },
});
```

Players can then run `;ping` or `;p` in-game. Custom commands are delivered through the webhook gateway.

## Authorization Link

For public applications, generate a link that lets server owners authorize your app:

```typescript
console.log(server.authorizationLink);
```

## Documentation

Full guides and the API reference are available at [erlcjs.xyz](https://erlcjs.xyz).

## License

[Apache-2.0](../../LICENSE) © erlc-js contributors
