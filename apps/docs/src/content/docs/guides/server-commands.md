---
title: Server & Commands
description: Inspect server state and execute console commands.
order: 4
---

Each managed server exposes its latest info snapshot and a command manager.

## Inspect the server

```ts
const server = client.servers.get('YOUR_SERVER_ID')!;

console.log(server.info?.name);
console.log(`${server.info?.currentPlayers}/${server.info?.maxPlayers}`);
console.log(server.info?.joinKey);
console.log(server.info?.accVerifiedReq);
```

| Property | Description |
|----------|-------------|
| `name` | Server name |
| `ownerId` | Owner UserId |
| `coOwnerIds` | Co-owner UserIds |
| `currentPlayers` | Players online |
| `maxPlayers` | Player limit |
| `joinKey` | Join code |
| `accVerifiedReq` | `Disabled`, `Email`, or `Phone/ID` |
| `teamBalance` | Whether team balance is enforced |
| `queue` | UserIds currently in the queue |

There are also convenience getters:

```ts
server.isFull;
server.hasQueue;
server.offline;
server.isPolling;
```

## Execute commands

```ts
const response = await server.commands.execute(':heal jamie');
console.log(response);
```

The REST layer queues commands and respects ER:LC rate limits automatically.

## Common commands

| Command | Action |
|---------|--------|
| `:heal <username>` | Heal a player |
| `:kick <username> <reason>` | Kick a player |
| `:kill <username>` | Kill a player |
| `:pm <username> <message>` | Private message |
| `:ban <username> <reason>` | Ban a player |
| `:m <message>` | Server-wide announcement |
| `:h <message>` | Server-wide hint |

```ts
await server.commands.execute(':m Maintenance in 5 minutes!');
await server.commands.execute(':h Follow the server rules.');
```

## Manual requests

Use `server.request(...)` for an endpoint the managers do not cover:

```ts
const data = await server.request('GET', '/v2/server?Players=true');
```

`server.rest.request(...)` is available as well. Both automatically include the server key.

## Custom in-game commands

```ts
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

Players run custom commands with `;ping` or `;p`. They are delivered by the webhook gateway, so keep `webhook` enabled to receive them.
