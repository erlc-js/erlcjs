---
title: Rendering a Map
description: Install @erlcjs/map and render a live map every poll.
order: 1
---

`@erlcjs/map` uses `sharp` to compose a live PNG map from `@erlcjs/core` caches.

## Install

```bash
npm install @erlcjs/map @erlcjs/core
```

## Render a map

```ts
import { writeFile } from 'node:fs/promises';
import { Client, ERLCEvents } from '@erlcjs/core';
import { drawMap, MapType } from '@erlcjs/map';

const client = new Client({
    servers: ['YOUR_SERVER_KEY'],
    polling: { enabled: true },
});

client.on(ERLCEvents.poll, async (server) => {
    const map = await drawMap({
        players: server.players,
        emergencyCalls: server.emergencyCalls,
        map: MapType.fall,
        showModCalls: true,
    });

    await writeFile('map.png', map);
});
```

## Options

| Option | Description |
|--------|-------------|
| `players` | A `PlayerManager` or array of players to draw |
| `emergencyCalls` | An `EmergencyCallManager` or array of calls |
| `map` | A `MapType`, file path, `Buffer`, or `ArrayBuffer` |
| `size` | Headshot size: `48`, `50`, `60`, `75`, `100`, `110`, `150`, or `180` |
| `showModCalls` | Draw unanswered mod calls (defaults to `true`) |

## Built-in maps

```ts
MapType.fall
MapType.fall_postals
MapType.snow
MapType.snow_postals
MapType.spring
MapType.spring_postals
MapType.summer
MapType.summer_postals
```

Use a custom background by passing a file path, `Buffer`, or `ArrayBuffer` as `map`.

## Use an array of players

`drawMap` accepts a plain array if you want to filter players first:

```ts
const wanted = [...server.players.cache.values()].filter((player) => player.wantedLevel > 0);

const map = await drawMap({
    players: wanted,
    map: MapType.summer_postals,
});
```
