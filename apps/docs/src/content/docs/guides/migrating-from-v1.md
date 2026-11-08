---
title: Migrating from v1
description: Move from the single-server v1 client to the multi-server v2 client.
order: 7
---

The big change in v2 is that **one `Client` now manages multiple ER:LC servers**. Everything that used to live on the client now lives on a per-server `Server` object. The migration is mostly mechanical.

## Quick summary

| v1 | v2 |
|----|----|
| `new Client({ serverKey })` | `new Client({ servers: [key] })` |
| `client.players` | `server.players` |
| `client.vehicles` | `server.vehicles` |
| `client.commands` | `server.commands` |
| `client.commandLogs` | `server.commandLogs` |
| `client.killLogs` | `server.killLogs` |
| `client.modCalls` | `server.modCalls` |
| `client.emergencyCalls` | `server.emergencyCalls` |
| `client.staff` | `server.staff` |
| `client.server.cache` | `server.info` |
| `client.authorizationLink` | `server.authorizationLink` |

## Before and after

```ts
// v1
const client = new Client({ serverKey: 'YOUR_KEY', polling: true });
const player = client.players.cache.get(userId);
await player?.kick('Reason');
await client.commands.execute(':pm jamie hi');
```

```ts
// v2
const client = new Client({ servers: ['YOUR_KEY'], polling: true });
const server = client.servers.get('YOUR_SERVER_ID')!;
const player = server.players.cache.get(userId);
await player?.kick('Reason');
await server.commands.execute(':pm jamie hi');
```

## Resolve a server

The server ID is parsed from the API key:

```ts
const server = client.servers.get('YOUR_SERVER_ID');
// or
const first = [...client.servers.values()][0];
```

`server.info` replaces `client.server.cache`:

```ts
// v1
const name = client.server.cache?.name;
const current = client.server.cache?.currentPlayers;

// v2
const name = server.info?.name;
const current = server.info?.currentPlayers;
```

## Events

Events are emitted by the client, but payloads carry the server:

```ts
client.on(ERLCEvents.playerJoin, (player) => {
    console.log(player.server.id); // which server
});
```

Add `serverOnline`, `serverOffline`, and `serverReady` handlers if you manage several servers.

## Custom commands

`client.registerCommand` still exists and registers globally. Use `server.registerCommand` for a command that only works on one server:

```ts
server.registerCommand({
    name: 'ping',
    execute: ({ player }) => player.message('pong'),
});
```

For per-server state inside a global command, use `player.server` rather than closing over a specific server.

## Checklist

- Replace `serverKey` with `servers: [key]`
- Resolve a `Server` from `client.servers`
- Move manager access from `client.*` to `server.*`
- Replace `client.server.cache` with `server.info`
- Move `client.commands.execute()` calls to `server.commands.execute()`
- Move `client.authorizationLink` to `server.authorizationLink`
- Add an `error` listener if you do not have one
- Test custom commands with the webhook gateway enabled
