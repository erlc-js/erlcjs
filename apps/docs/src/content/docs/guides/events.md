---
title: Handling Events
description: Every event emitted by the erlc.js client, typed.
order: 5
---

Attach listeners with `client.on(...)`. Every event name and callback argument is typed through `ClientEvents`.

```ts
import { Client, ERLCEvents } from '@erlcjs/core';

const client = new Client({
    servers: ['YOUR_SERVER_KEY'],
    polling: true,
});

client.on(ERLCEvents.playerJoin, (player) => {
    console.log(`${player.username} joined ${player.server.id}`);
});
```

Events carry a structure with a `server` property (or the `Server` itself), so multi-server bots can tell where an update came from.

## Server events

| Event | Fires when | Arguments |
|-------|------------|-----------|
| `ready` | Every configured server has completed its first poll | — |
| `serverReady` | A server completes its first successful poll | `server` |
| `serverOnline` | An offline server recovers | `server` |
| `serverOffline` | A server goes offline and its caches are cleared | `server` |
| `poll` | A poll finishes and caches are updated | `server` |
| `serverCreate` | Server info is loaded for the first time | `serverInfo` |
| `serverUpdate` | Server info changes | `oldInfo, newInfo` |

## Player events

| Event | Fires when | Arguments |
|-------|------------|-----------|
| `playerJoin` | A player joins | `player` |
| `playerUpdate` | Player data changes | `oldPlayer, newPlayer` |
| `playerLeave` | A player leaves | `player` |

## Vehicle events

| Event | Fires when | Arguments |
|-------|------------|-----------|
| `vehicleAdd` | A vehicle spawns | `vehicle` |
| `vehicleUpdate` | Vehicle data changes | `oldVehicle, newVehicle` |
| `vehicleRemove` | A vehicle despawns | `vehicle` |

## Logs and calls

| Event | Fires when | Arguments |
|-------|------------|-----------|
| `command` | A console command is logged | `commandLog` |
| `joinLog` | A player joins or leaves the server | `joinLog` |
| `kill` | A player is killed | `killLog` |
| `modCall` | A player requests a moderator | `modCall` |
| `modCallAnswered` | A moderator answers a call | `modCall` |
| `emergencyCallAdd` | A 911 call starts | `emergencyCall` |
| `emergencyCallUpdate` | A call's responders or details change | `oldCall, newCall` |
| `emergencyCallRemove` | A call is cleared | `emergencyCall` |

## Staff events

| Event | Fires when | Arguments |
|-------|------------|-----------|
| `staffAdd` | A staff member is added | `staff, role` |
| `staffRemove` | A staff member is removed | `staff, role` |

The role is `'Admin'`, `'Mod'`, or `'Helper'`.

## Gateway events

| Event | Fires when | Arguments |
|-------|------------|-----------|
| `customCommand` | A player runs a registered `;command` | `player, command, args` |
| `webhookProbe` | A webhook is entered in-game | `server` |

:::tip Poll ordering
`poll` is emitted **after** the server's caches have been updated, so listeners can safely read `server.players.cache`, `server.vehicles.cache`, and the rest.
:::

## Custom commands

Register a command with `server.registerCommand` or `client.registerCommand` and listen to `customCommand` if you want raw handling:

```ts
client.on(ERLCEvents.customCommand, (player, command, args) => {
    console.log(`${player.username} ran ${command} with ${args.join(', ')}`);
});
```

Registered commands are dispatched automatically. Custom commands need the webhook gateway to be enabled.

## Errors

```ts
client.on('error', (err) => {
    console.error(err);
});
```

If you do not attach an `error` listener, erlc.js logs the error instead of crashing the process.
