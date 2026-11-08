import { request } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';

afterEach(() => {
    vi.restoreAllMocks();
});

function makeClient(path = '/hook') {
    return new Client({
        servers: ['PRC-111111111-key'],
        webhook: { enabled: true, port: 0, path },
    });
}

async function listen(client: Client): Promise<number> {
    const httpServer = (client as any).gateway.server;
    if (!httpServer.listening) {
        await new Promise((resolve) => httpServer.once('listening', resolve));
    }
    return httpServer.address().port;
}

function post(
    port: number,
    body: string,
    headers: Record<string, string> = {},
    path = '/hook',
): Promise<number> {
    return new Promise((resolve, reject) => {
        const req = request(
            {
                host: '127.0.0.1',
                port,
                path,
                method: 'POST',
                headers: { 'Content-Length': Buffer.byteLength(body), ...headers },
            },
            (res) => {
                res.resume();
                res.on('end', () => resolve(res.statusCode ?? 0));
            },
        );
        req.on('error', reject);
        req.end(body);
    });
}

describe('WebhookServer', () => {
    it('handles server errors instead of crashing the process', () => {
        const client = makeClient();
        const httpServer = (client as any).gateway.server;
        expect(httpServer.listenerCount('error')).toBeGreaterThan(0);
        client.destroy();
    });

    it('rejects payloads that exceed the body limit', async () => {
        const client = makeClient();
        const port = await listen(client);

        const status = await post(port, 'x'.repeat(1024 * 1024 + 1));

        expect(status).toBe(413);
        client.destroy();
    });

    it('matches webhook paths with query strings and trailing slashes', async () => {
        const client = makeClient('/hook/');
        const port = await listen(client);

        // A 401 proves the path matched; an unmatched path returns 404.
        expect(await post(port, '{}', {}, '/hook?probe=1')).toBe(401);
        client.destroy();
    });

    it('rejects requests without signature headers', async () => {
        const client = makeClient();
        const port = await listen(client);

        expect(await post(port, '{}')).toBe(401);
        client.destroy();
    });

    it('rejects stale timestamps before verifying the signature', async () => {
        const verify = vi.spyOn(globalThis.crypto.subtle, 'verify').mockResolvedValue(true);
        const client = makeClient();
        const port = await listen(client);

        const stale = String(Math.floor(Date.now() / 1000) - 600);
        const status = await post(port, '{}', {
            'x-signature-ed25519': '00',
            'x-signature-timestamp': stale,
        });

        expect(status).toBe(401);
        expect(verify).not.toHaveBeenCalled();
        client.destroy();
    });

    it('accepts a valid signature and dispatches events', async () => {
        const verify = vi.spyOn(globalThis.crypto.subtle, 'verify').mockResolvedValue(true);
        const client = makeClient();
        const port = await listen(client);
        const probes: string[] = [];
        client.on(ERLCEvents.webhookProbe, (server) => probes.push(server.id));

        const timestamp = String(Math.floor(Date.now() / 1000) - 60);
        const body = JSON.stringify({
            server: '111111111',
            events: [{ event: 'WebhookProbe' }],
        });
        const status = await post(port, body, {
            'x-signature-ed25519': '00',
            'x-signature-timestamp': timestamp,
        });

        expect(status).toBe(200);
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(probes).toEqual(['111111111']);
        expect(verify).toHaveBeenCalledOnce();
        client.destroy();
    });

    it('fetches the player cache when a custom command arrives before polling', async () => {
        vi.spyOn(globalThis.crypto.subtle, 'verify').mockResolvedValue(true);
        const client = makeClient();
        const server = client.servers.get('111111111')!;
        const ran: string[] = [];
        client.registerCommand({
            name: 'ping',
            execute: ({ player, args }) => {
                ran.push(`${player.username}:${args.join(',')}`);
            },
        });
        const fetchAll = vi.spyOn(server.players, 'fetchAll').mockImplementation(async () => {
            server.players.updateCache([
                {
                    Player: 'Alex:1',
                    Permission: 'Normal',
                    Team: 'Civilian',
                    Callsign: '',
                    Location: {
                        LocationX: 0,
                        LocationZ: 0,
                        PostalCode: '0',
                        StreetName: '',
                        BuildingNumber: '',
                    },
                    WantedStars: 0,
                },
            ]);
            return server.players.cache;
        });

        const port = await listen(client);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const body = JSON.stringify({
            server: '111111111',
            events: [
                {
                    event: 'CustomCommand',
                    origin: 'Alex:1',
                    data: { command: ';ping', argument: 'one "two three"' },
                },
            ],
        });
        const status = await post(port, body, {
            'x-signature-ed25519': '00',
            'x-signature-timestamp': timestamp,
        });

        expect(status).toBe(200);
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(fetchAll).toHaveBeenCalledOnce();
        expect(ran).toEqual(['Alex:one,two three']);
        client.destroy();
    });

    it('ignores malformed event lists instead of failing the request', async () => {
        vi.spyOn(globalThis.crypto.subtle, 'verify').mockResolvedValue(true);
        const client = makeClient();
        const port = await listen(client);

        const timestamp = String(Math.floor(Date.now() / 1000));
        const body = JSON.stringify({ server: '111111111', events: {} });
        const status = await post(port, body, {
            'x-signature-ed25519': '00',
            'x-signature-timestamp': timestamp,
        });

        expect(status).toBe(200);
        client.destroy();
    });
});
