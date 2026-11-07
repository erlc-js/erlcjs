# @erlcjs/presets

[![npm version](https://img.shields.io/npm/v/@erlcjs/presets?style=flat-square)](https://www.npmjs.com/package/@erlcjs/presets)
[![npm downloads](https://img.shields.io/npm/dm/@erlcjs/presets?style=flat-square)](https://www.npmjs.com/package/@erlcjs/presets)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/@erlcjs/presets?style=flat-square)](https://github.com/erlc-js/erlcjs/blob/main/LICENSE)

`@erlcjs/presets` provides reusable moderation, punishment, and utility callbacks for `@erlcjs/core`.

## Prerequisites

- Node.js 20 or newer
- `@erlcjs/core` installed and configured

## Installation

```sh
npm install @erlcjs/presets @erlcjs/core
# or
pnpm add @erlcjs/presets @erlcjs/core
```

## Vehicle Restrictions

```typescript
import { Client, ERLCEvents, PlayerPermission, Vehicles } from '@erlcjs/core';
import { banVehicles, VehiclePunishments } from '@erlcjs/presets';

const client = new Client({
    servers: ['YOUR_SERVER_API_KEY'],
    polling: { enabled: true },
});

client.on(
    ERLCEvents.vehicleAdd,
    banVehicles(
        [Vehicles.CHEVLON_COMMUTER_VAN_2006],
        VehiclePunishments.warnThenKick(10, true, 'This vehicle is restricted.'),
        [PlayerPermission.Mod, PlayerPermission.Administrator],
    ),
);
```

## Livery Restrictions

```typescript
import { PlayerPermission } from '@erlcjs/core';
import { banLiveries, LiveryPunishments } from '@erlcjs/presets';

client.on(
    ERLCEvents.vehicleAdd,
    banLiveries(
        ['Staff'],
        LiveryPunishments.warnThenKick(15, true, 'This livery is restricted.'),
        [PlayerPermission.Mod, PlayerPermission.Administrator, PlayerPermission.Owner],
    ),
);
```

Livery restrictions can also target a specific vehicle model:

```typescript
banLiveries([{ livery: 'Staff', vehicle: Vehicles.CHEVLON_COMMUTER_VAN_2006 }], action);
```

## Command Restrictions

```typescript
import { banCommand, CommandPunishments } from '@erlcjs/presets';

client.on(
    ERLCEvents.command,
    banCommand([':admin', ':mod'], CommandPunishments.removePermissions(), true, [
        PlayerPermission.Owner,
    ]),
);
```

## Kill and Player Presets

```typescript
import { welcomePlayer, banKickRejoin, RDM } from '@erlcjs/presets';

client.on(ERLCEvents.playerJoin, welcomePlayer());
client.on(ERLCEvents.playerJoin, banKickRejoin(1800));
client.on(ERLCEvents.kill, RDM((log) => log.killer?.kick('RDM'), [], 4, 30));
```

## Automated Messages

```typescript
import { autoHint, autoAnnouncement, autoCommand } from '@erlcjs/presets';

const hint = autoHint(server, 'Follow the server rules!');
const announcement = autoAnnouncement(server, 'Server restart in 5 minutes.');
const command = autoCommand(server, ':heal all');

// Stop them with clearInterval(hint), etc.
```

## Available Presets

- `banVehicles`, `VehiclePunishments`
- `banLiveries`, `LiveryPunishments`
- `banCommand`, `CommandPunishments`
- `welcomePlayer`, `banKickRejoin`
- `RDM`
- `autoHint`, `autoAnnouncement`, `autoCommand`

## License

[Apache-2.0](../../LICENSE) © erlc-js contributors
