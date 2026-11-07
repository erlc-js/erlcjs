---
title: Instantiating the Client
description: Understand client options, polling, webhooks, and multi-server management.
order: 2
---

The `Client` is the coordinator. It owns the REST layer, every configured server, the webhook gateway, and the shared command registry.

## Create a client

```ts
import { Client } from '@erlcjs/core';

const client = new Client({
    servers: ['YOUR_SERVER_KEY_1', 'YOUR_SERVER_KEY_2'],
    globalKey: 'OPTIONAL_GLOBAL_KEY',
    globalAppId: 'OPTIONAL_GLOBAL_APP_ID',
    polling: { enabled: true },
});
```

Each key belongs to one private server. The server ID is parsed from the key and used as the key in `client.servers`:

```ts
const server = client.servers.get('YOUR_SERVER_ID')!;

server.players.cache;
await server.commands.execute(':pm jamie hello');
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `servers` | `string[]` | **Required.** The server API keys to manage. |
| `globalKey` | `string` | Optional application key. |
| `globalAppId` | `string \| number` | Optional app ID, used for authorization links. |
| `polling` | `object \| true` | Poll settings, or `true` for the defaults. |
| `webhook` | `object` | Webhook gateway settings. |
| `maxCacheSize` | `object` | Limits for `killLog`, `commandLog`, and `modCalls` caches. |

## Polling

```ts
const client = new Client({
    servers: ['YOUR_SERVER_KEY'],
    polling: {
        enabled: true,
        pollingRateMs: 5000, // minimum 500
        autoStartPolling: true,
    },
});
```

Polling fetches full state on a timer: server info, players, vehicles, staff, calls, and logs. It needs no public IP and is the easiest way to run a bot.

```ts
client.stopPolling();       // stop every server
client.startPolling(3000);  // restart every server at 3s
client.isPolling;           // true if any server is polling
```

Each server can also be controlled independently with `server.startPolling()` and `server.stopPolling()`.

## Webhooks

Webhooks give you near-real-time emergency-call and custom-command events. They require a public URL (or a tunnel such as ngrok).

```ts
const client = new Client({
    servers: ['YOUR_SERVER_KEY'],
    polling: { enabled: true },
    webhook: {
        enabled: true,
        port: 3000,
        path: '/webhook',
        timestampTolerance: 5,
    },
});
```

The webhook server verifies ER:LC's Ed25519 signature, rejects stale timestamps, and routes events to the matching server.

:::warning Keep polling enabled
Webhooks only deliver emergency-call, custom-command, and webhook-probe events. Polling is still required for players, vehicles, staff, and logs.
:::

## Manage servers at runtime

```ts
const server = client.addServer('YOUR_SERVER_KEY_3');
client.removeServer(server.id);
```

`addServer` starts polling automatically when auto-start is enabled. `removeServer` stops polling and clears that server's caches.

## Wait for readiness

```ts
await client.onceReady();       // every server has completed its first poll
await server.waitFor('POLL');   // the next poll for one server
```

`client.onceReady()` resolves immediately if the client is already ready. `waitFor` accepts a timeout in milliseconds and rejects with `TimeoutError`.

## Authorization links

For public applications, generate a link that lets server owners authorize your app:

```ts
console.log(server.authorizationLink);
```
