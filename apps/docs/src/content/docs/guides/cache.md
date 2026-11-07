---
title: Accessing the Cache
description: Where every structure lives and how fresh it is.
order: 6
---

Polling fills per-server caches. Each server has its own independent copy, so the same manager name on two servers points at two different datasets.

```ts
const server = client.servers.get('YOUR_SERVER_ID')!;
```

## Caches

| Cache | Key | Structure |
|-------|-----|-----------|
| `server.players.cache` | UserId | `Player` |
| `server.vehicles.cache` | License plate | `Vehicle` |
| `server.staff.admins` | UserId | `Staff` |
| `server.staff.mods` | UserId | `Staff` |
| `server.staff.helpers` | UserId | `Staff` |
| `server.commandLogs.cache` | Player + timestamp + command | `CommandLog` |
| `server.killLogs.cache` | Killer + killed + timestamp | `KillLog` |
| `server.modCalls.cache` | Caller + timestamp | `ModCall` |
| `server.emergencyCalls.cache` | Call number | `EmergencyCall` |

`server.info` holds the latest `ServerInfo` snapshot.

## Examples

```ts
// Players
const player = server.players.cache.get(userId);
console.log(player?.username);

// Vehicles
const vehicle = server.vehicles.cache.get('ABC123');
console.log(vehicle?.name, vehicle?.ownerUsername);

// Staff
const admins = [...server.staff.admins.values()];
console.log(admins.map((staff) => staff.username));

// Active emergency calls
for (const call of server.emergencyCalls.cache.values()) {
    console.log(`#${call.callNumber}: ${call.description}`);
}
```

## Freshness

With polling enabled, data is at most one poll interval old (five seconds by default). The `poll` event fires after caches update:

```ts
client.on(ERLCEvents.poll, (server) => {
    console.log(server.players.cache.size);
});
```

When a server is marked offline, volatile caches (players, vehicles, calls, staff) are cleared. Historical logs remain until their cache limit evicts them.

## Limit log caches

```ts
const client = new Client({
    servers: ['YOUR_SERVER_KEY'],
    polling: true,
    maxCacheSize: {
        commandLog: 500,
        killLog: 500,
        modCalls: 250,
    },
});
```

When a limit is exceeded, the oldest entries by timestamp are removed first.
