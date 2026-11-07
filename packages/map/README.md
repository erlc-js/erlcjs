# @erlcjs/map

[![npm version](https://img.shields.io/npm/v/@erlcjs/map?style=flat-square)](https://www.npmjs.com/package/@erlcjs/map)
[![npm downloads](https://img.shields.io/npm/dm/@erlcjs/map?style=flat-square)](https://www.npmjs.com/package/@erlcjs/map)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/@erlcjs/map?style=flat-square)](https://github.com/erlc-js/erlcjs/blob/main/LICENSE)

`@erlcjs/map` renders an in-game map with player locations, emergency calls, and mod calls. It uses `sharp` under the hood and supports the maps provided by ER:LC or your own image.

## Prerequisites

- Node.js 20 or newer
- `@erlcjs/core` installed and configured

## Installation

```sh
npm install @erlcjs/map @erlcjs/core
# or
pnpm add @erlcjs/map @erlcjs/core
```

## Quick Start

```typescript
import { writeFile } from 'node:fs/promises';
import { Client, ERLCEvents } from '@erlcjs/core';
import { drawMap, MapType } from '@erlcjs/map';

const client = new Client({
    servers: ['YOUR_SERVER_API_KEY'],
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
| `emergencyCalls` | An `EmergencyCallManager` or array of calls to draw |
| `map` | A `MapType`, file path, `Buffer`, or `ArrayBuffer` |
| `size` | Headshot size: `48`, `50`, `60`, `75`, `100`, `110`, `150`, or `180` |
| `showModCalls` | Whether to draw unanswered mod calls (defaults to `true`) |

## Built-in Maps

```typescript
MapType.fall
MapType.fall_postals
MapType.snow
MapType.snow_postals
MapType.spring
MapType.spring_postals
MapType.summer
MapType.summer_postals
```

Pass your own image by setting `map` to a file path or buffer.

## License

[Apache-2.0](../../LICENSE) © erlc-js contributors
