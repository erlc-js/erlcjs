---
title: Using Presets
description: Install @erlcjs/presets and use the moderation helpers.
order: 1
---

`@erlcjs/presets` exports plain functions that return event callbacks. Pass them directly to `client.on(...)`.

## Install

```bash
npm install @erlcjs/presets @erlcjs/core
```

## Imports

```ts
import {
    welcomePlayer,
    banKickRejoin,
    banVehicles,
    VehiclePunishments,
    banLiveries,
    LiveryPunishments,
    banCommand,
    CommandPunishments,
    RDM,
} from '@erlcjs/presets';
```

## Welcome players

```ts
client.on(ERLCEvents.playerJoin, welcomePlayer());
client.on(ERLCEvents.playerJoin, welcomePlayer('Welcome! Please read the rules.'));
```

## Ban kick-rejoiners

```ts
// Default: 30 minutes
client.on(ERLCEvents.playerJoin, banKickRejoin());

// One hour
client.on(ERLCEvents.playerJoin, banKickRejoin(3600));
```

## Restrict vehicles

```ts
client.on(
    ERLCEvents.vehicleAdd,
    banVehicles(
        ['Chevlon Commuter Van 2006'],
        VehiclePunishments.warnThenKick(15),
    ),
);
```

Add an allowlist of UserIds or permissions as the third argument:

```ts
banVehicles(
    ['Chevlon Commuter Van 2006'],
    VehiclePunishments.warnThenKick(15),
    [PlayerPermission.Mod, PlayerPermission.Administrator],
);
```

## Restrict liveries

```ts
client.on(
    ERLCEvents.vehicleAdd,
    banLiveries(['Staff'], LiveryPunishments.warnThenKick(10)),
);
```

Target one vehicle model:

```ts
banLiveries([{ livery: 'Staff', vehicle: Vehicles.CHEVLON_COMMUTER_VAN_2006 }], action);
```

## Punish commands

```ts
client.on(
    ERLCEvents.command,
    banCommand(
        [':admin', ':mod'],
        CommandPunishments.removePermissions(),
        true,
        [PlayerPermission.Owner],
    ),
);

client.on(
    ERLCEvents.command,
    banCommand([':bring all', ':load all'], CommandPunishments.kick(), false),
);
```

## Detect RDM

```ts
// 4+ kills in 30 seconds (defaults)
client.on(ERLCEvents.kill, RDM((log) => log.killer?.kick('RDM')));

// 5+ kills in 60 seconds, administrators exempt
client.on(
    ERLCEvents.kill,
    RDM(
        (log) => log.killer?.ban('RDM'),
        [PlayerPermission.Administrator],
        5,
        60,
    ),
);
```

## Notes

- All helpers return callbacks designed for `client.on(...)`.
- `allowlist` accepts UserIds and `PlayerPermission` values.
- Presets catch and report failed command promises through the client's error event.
