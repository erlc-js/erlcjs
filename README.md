<div align="center">

# erlc.js

**A modern, fully-typed TypeScript wrapper for the Roblox Emergency Response: Liberty County private server API.**

erlc.js manages one or more ER:LC private servers, keeps their state cached, and turns
polling and webhook updates into typed events — so you can build moderation bots,
dashboards, and live maps without writing HTTP glue.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@erlcjs/core.svg)](https://www.npmjs.com/package/@erlcjs/core)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

## Highlights

- **Multi-server client** — manage many ER:LC private servers from one process.
- **Polling + webhooks** — poll for full server state, or use the signed webhook gateway for near-real-time events.
- **Fully typed events** — every event's callback arguments are inferred for you.
- **Cached structures** — players, vehicles, staff, calls, and logs are cached as rich objects.
- **Player helpers** — kick, ban, jail, heal, message, teleport, and more.
- **Custom in-game commands** — register commands players can run with `;command` in chat.
- **Map rendering** — `@erlcjs/map` draws a live PNG map of players and emergency calls.
- **Presets** — `@erlcjs/presets` ships ready-made moderation callbacks.

## Getting Started

### Install

```sh
npm install @erlcjs/core
```

Requires Node.js 20 or newer.

### Create a client

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

Each key belongs to one private server. The client parses the server ID from the key
and exposes the server through `client.servers.get(id)`.

## Quick Tour

### Managing servers

```ts
const client = new Client({
    servers: ['YOUR_SERVER_KEY_1', 'YOUR_SERVER_KEY_2'],
    polling: true,
});

for (const server of client.servers.values()) {
    console.log(server.id, server.info?.name);
}

// Add or remove servers at runtime.
const server = client.addServer('YOUR_SERVER_KEY_3');
client.removeServer(server.id);
```

Every server has its own managers and caches: `players`, `vehicles`, `staff`,
`commands`, `commandLogs`, `killLogs`, `modCalls`, and `emergencyCalls`.

### Listening to events

```ts
client.on(ERLCEvents.playerJoin, (player) => {
    console.log(`${player.username} joined ${player.server.id}`);
});

client.on(ERLCEvents.playerLeave, (player) => {
    console.log(`${player.username} left`);
});

client.on(ERLCEvents.kill, (kill) => {
    console.log(`${kill.killer.username} killed ${kill.killed.username}`);
});
```

Other events include `playerUpdate`, `vehicleAdd`, `vehicleRemove`, `vehicleUpdate`,
`command`, `modCall`, `emergencyCallAdd`, `emergencyCallUpdate`,
`emergencyCallRemove`, `staffAdd`, `staffRemove`, `poll`, `serverReady`,
`serverOnline`, `serverOffline`, and `webhookProbe`.

### Working with players

```ts
const player = server.players.cache.get(userId);

await player?.message('Please follow the server rules.');
await player?.kick('Breaking the rules');
await player?.ban('Repeated offences');
```

Players also expose `jail`, `heal`, `kill`, `wanted`, `respawn`, `load`, `refresh`,
`helper`, `mod`, `admin`, `tp`, and their un-prefixed counterparts. Getter helpers
such as `player.vehicles`, `player.commandLogs`, `player.kills`, and `player.deaths`
read from the cache.

### Running server commands

```ts
await server.commands.execute(':pm jamie hello');
await server.commands.execute(':h Server restart in 5 minutes');
```

### Custom in-game commands

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

Custom commands are delivered through the webhook gateway, so enable `webhook` to
receive them.

### Real-time webhooks

```ts
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

Incoming webhooks are verified with ER:LC's Ed25519 signature and a timestamp
tolerance. Webhooks only deliver emergency-call, custom-command, and webhook-probe
events, so keep polling enabled for the rest.

### Rendering a map

```ts
import { writeFile } from 'node:fs/promises';
import { drawMap, MapType } from '@erlcjs/map';

client.on(ERLCEvents.poll, async (server) => {
    const map = await drawMap({
        players: server.players,
        emergencyCalls: server.emergencyCalls,
        map: MapType.summer_postals,
        showModCalls: true,
    });

    await writeFile('map.png', map);
});
```

### Using presets

```ts
import { welcomePlayer, banVehicles, VehiclePunishments } from '@erlcjs/presets';
import { PlayerPermission, Vehicles } from '@erlcjs/core';

client.on(ERLCEvents.playerJoin, welcomePlayer());

client.on(
    ERLCEvents.vehicleAdd,
    banVehicles(
        [Vehicles.CHEVLON_COMMUTER_VAN_2006],
        VehiclePunishments.warnThenKick(),
        [PlayerPermission.Owner],
    ),
);
```

## Packages

| Package | Description |
|---------|-------------|
| `@erlcjs/core` | Client, REST handling, polling, webhooks, caches, and structures |
| `@erlcjs/map` | PNG map rendering for players and emergency calls |
| `@erlcjs/presets` | Ready-made moderation and utility presets |

## Documentation

Guides and the generated API reference live at [erlcjs.xyz](https://erlcjs.xyz).

## Status

erlc.js is actively developed. The v2 API is the current release line; see
[CONTRIBUTING.md](CONTRIBUTING.md) if you want to help.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the development
workflow, and [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

[Apache-2.0](LICENSE) © erlc-js contributors
