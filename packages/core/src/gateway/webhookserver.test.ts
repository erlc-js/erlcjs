import { request } from 'node:http';
import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';

function makeClient() {
    return new Client({
        servers: ['PRC-111111111-key'],
        webhook: { enabled: true, port: 0, path: '/hook' },
    });
}

async function listen(client: Client): Promise<number> {
    const httpServer = (client as any).gateway.server;
    if (!httpServer.listening) {
        await new Promise((resolve) => httpServer.once('listening', resolve));
    }
    return httpServer.address().port;
}

function post(port: number, body: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const req = request(
            {
                host: '127.0.0.1',
                port,
                path: '/hook',
                method: 'POST',
                headers: { 'Content-Length': Buffer.byteLength(body) },
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
});
