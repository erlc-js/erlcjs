---
title: Getting Started with erlc.js
description: Install erlc.js, create a client, and run your first script.
order: 1
---

erlc.js is a fully-typed TypeScript wrapper for the Roblox **Emergency Response: Liberty County** private server API. This guide gets you from zero to a running bot.

## Create a server key

Open Roblox and join your ER:LC private server. Open the server settings panel (owner or co-owner required), go to **Server API**, and generate a key. Keep it secret.

## Create a project

```bash
mkdir erlc-bot
cd erlc-bot
npm init -y
```

Set `"type": "module"` in `package.json` if you want to use ESM imports.

## Install the core package

```bash
npm install @erlcjs/core
```

You can also use `pnpm add @erlcjs/core`, `yarn add @erlcjs/core`, or `bun add @erlcjs/core`.

## Write your first script

Create `index.js`:

```ts
import { Client, ERLCEvents } from '@erlcjs/core';

const client = new Client({
    servers: ['YOUR_SERVER_API_KEY'],
    polling: { enabled: true },
});

client.on(ERLCEvents.playerJoin, (player) => {
    console.log(`[JOIN] ${player.username}`);
    player.message('Welcome to the server! Have fun.');
});

client.on('error', (err) => {
    console.error('erlc.js error:', err);
});

console.log('erlc.js is running...');
```

## Run it

```bash
node index.js
```

:::tip Polling is the simplest start
Polling needs no public IP, port forwarding, or tunnel. Add the webhook gateway later if you want near-real-time emergency calls and in-game custom commands.
:::

## What just happened?

- `Client` holds one or more ER:LC servers.
- `polling: { enabled: true }` fetches full server state every five seconds.
- Events such as `playerJoin` are emitted from the cached state, fully typed.
- Commands like `player.message()` go back through the REST API.

## Next steps

- [Instantiating the Client](/docs/guides/client/) — options, polling, and webhooks
- [Managing Players](/docs/guides/players/) — kicks, messages, and player data
- [Server & Commands](/docs/guides/server-commands/) — server info and console commands
- [Handling Events](/docs/guides/events/) — the full event reference
- [Accessing the Cache](/docs/guides/cache/) — where every structure lives
