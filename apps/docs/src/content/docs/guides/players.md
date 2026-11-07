---
title: Managing Players
description: Track player state and perform moderator actions.
order: 3
---

Every server keeps its own live player cache. Polling updates it, and `playerJoin`, `playerUpdate`, and `playerLeave` tell you when it changes.

## Access players

```ts
const server = client.servers.get('YOUR_SERVER_ID')!;

// The cache is a Map keyed by Roblox UserId
const player = server.players.cache.get(1234567);

if (player) {
    console.log(player.username);
    console.log(player.team);
    console.log(player.permission);
}
```

## Player properties

| Property | Description |
|----------|-------------|
| `id` | Roblox UserId |
| `username` | Roblox username |
| `team` | Current in-game team |
| `permission` | `Normal`, `Server Moderator`, `Server Administrator`, or `Server Owner` |
| `wantedLevel` | Wanted stars (0–5) |
| `callsign` | Department callsign, if assigned |
| `location` | `x`, `z`, `postalCode`, `streetName`, and `buildingNumber` |

## Moderator actions

The `Player` class wraps common commands:

```ts
await player?.kick('Breaking the rules');
await player?.ban('Repeated offences');
await player?.jail();
await player?.heal();
await player?.kill();
await player?.wanted();
await player?.respawn();
await player?.load();
await player?.refresh();
await player?.message('Please read the rules.');
await player?.tp(otherPlayer);
```

It also exposes `helper`/`unhelper`, `mod`/`unmod`, and `admin`/`unadmin`.

:::note Permissions
These actions require the server key to have permission to run the equivalent console command.
:::

## React to joins

```ts
client.on(ERLCEvents.playerJoin, async (player) => {
    if (player.username === 'SpammerUser') {
        await player.kick('Automated action');
        return;
    }

    await player.message('Welcome! Please follow the rules.');
});
```

## Related data

```ts
player?.vehicles;    // spawned vehicles owned by this player
player?.commandLogs; // command logs for this player
player?.kills;       // kills where this player was the killer
player?.deaths;      // deaths where this player was killed
```

These getters read the current caches; they do not fetch new data.

## Filter the cache

```ts
server.players.wanted;      // wantedLevel > 0
server.players.onlineStaff; // permission !== 'Normal'
```

:::tip Resolve names
`server.players.getIdFromName('jamie')` returns the cached UserId for a username, or `undefined` if that player is not online.
:::
