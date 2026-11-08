---
title: Documentation
description: Build with the fully-typed TypeScript SDK for ER:LC.
order: 0
template: hero
hero:
  title: erlc.js
  tagline: TypeScript SDK for the Emergency Response: Liberty County API.
  actions:
    - text: Get started
      link: /docs/guides/getting-started/
      variant: primary
    - text: API reference
      link: /docs/api/
      variant: secondary
toc:
  disabled: true
---

## Packages

:::card Core
`@erlcjs/core` — client, REST, polling, webhooks, caches, and structures.
[Read the docs](/docs/guides/getting-started/)
:::

:::card Map
`@erlcjs/map` — live PNG maps with players, calls, and mod badges.
[Render a map](/docs/guides/map/getting-started/)
:::

:::card Presets
`@erlcjs/presets` — moderation callbacks for vehicles, commands, and kills.
[Use presets](/docs/guides/presets/getting-started/)
:::

## Quick start

```ts
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

Each server key belongs to one private server. Access it through `client.servers.get(id)`.
