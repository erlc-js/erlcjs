import { createServer, type Server as HTTPServer } from 'node:http';
import type { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';
import type { Server } from '../client/server.js';
import { ServerNotConfiguredError } from '../errors/index.js';

/** Maximum accepted webhook body size in bytes. */
const MAX_BODY_BYTES = 1024 * 1024;

/**
 * Resolves the player identifier from a webhook origin, which may be a UserId
 * or a `Username:UserId` string.
 * @param origin - The raw `origin` field from a webhook event.
 * @returns The UserId, or undefined when the origin is not a valid identifier.
 */
function resolveOriginId(origin: unknown): number | undefined {
    if (typeof origin === 'number') return Number.isInteger(origin) ? origin : undefined;
    if (typeof origin !== 'string') return undefined;

    const value = origin.includes(':') ? origin.split(':').pop()! : origin;
    const id = Number(value);
    return value.length > 0 && Number.isInteger(id) ? id : undefined;
}

/**
 * Splits an argument string into tokens, respecting single and double quoted segments.
 * @param input - The raw argument string from a webhook custom command event.
 * @returns The parsed arguments.
 */
function parseArgs(input: string): string[] {
    const trimmed = input.trim();
    if (!trimmed) return [];

    const args: string[] = [];
    let current = '';
    let quote: string | null = null;

    for (const char of trimmed) {
        if (quote) {
            if (char === quote) quote = null;
            else current += char;
        } else if (char === '"' || char === "'") {
            quote = char;
        } else if (char === ' ') {
            if (current) {
                args.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current) args.push(current);
    return args;
}

/**
 * Webhook Server for handling real-time gateway events pushed by ER:LC for all managed servers.
 * Incoming events are routed to the matching server by the top-level `payload.server` field.
 * @public
 */
export class WebhookServer {
    private readonly server: HTTPServer;

    /**
     * Creates an instance of WebhookServer.
     * @param client - The erlcjs client.
     */
    constructor(private readonly client: Client) {
        this.server = createServer((req, res) => {
            const configuredPath = this.client.options.webhook?.path || '/';
            const configPath = configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`;
            const requestPath = (req.url ?? '').split('?')[0]!;
            const matchesPath = requestPath.replace(/\/+$/, '') === configPath.replace(/\/+$/, '');

            if (req.method === 'POST' && matchesPath) {
                let bodyChunks: Buffer[] = [];
                let bodySize = 0;
                let bodyTooLarge = false;
                req.on('data', (chunk) => {
                    if (bodyTooLarge) return;
                    bodySize += chunk.length;
                    if (bodySize > MAX_BODY_BYTES) {
                        bodyTooLarge = true;
                        bodyChunks = [];
                        return;
                    }
                    bodyChunks.push(chunk);
                });

                req.on('end', async () => {
                    if (bodyTooLarge) {
                        res.writeHead(413, { 'Content-Type': 'text/plain' });
                        return res.end('Payload Too Large');
                    }

                    const rawBody = Buffer.concat(bodyChunks);

                    const signatureHex = req.headers['x-signature-ed25519'] as string;
                    const timestamp = req.headers['x-signature-timestamp'] as string;

                    const publicKeyBase64 =
                        'MCowBQYDK2VwAyEAjSICb9pp0kHizGQtdG8ySWsDChfGqi+gyFCttigBNOA=';

                    if (!signatureHex || !timestamp || !publicKeyBase64) {
                        res.writeHead(401, { 'Content-Type': 'text/plain' });
                        return res.end('Missing verification headers or public key config');
                    }

                    const timestampSeconds = Number(timestamp);
                    const tolerance = this.client.options.webhook?.timestampTolerance ?? 300;
                    if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > tolerance) {
                        res.writeHead(401, { 'Content-Type': 'text/plain' });
                        return res.end('Invalid Signature');
                    }

                    try {
                        const timestampBuffer = Buffer.from(timestamp, 'utf-8');
                        const messageBuffer = Buffer.concat([timestampBuffer, rawBody]);

                        const signatureBuffer = Buffer.from(signatureHex, 'hex');
                        const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');

                        const cryptoKey = await globalThis.crypto.subtle.importKey(
                            'spki',
                            publicKeyBuffer,
                            { name: 'Ed25519', namedCurve: 'Ed25519' },
                            false,
                            ['verify'],
                        );

                        const isValid = await globalThis.crypto.subtle.verify(
                            'Ed25519',
                            cryptoKey,
                            signatureBuffer,
                            messageBuffer,
                        );

                        if (!isValid) {
                            res.writeHead(401, { 'Content-Type': 'text/plain' });
                            return res.end('Invalid Signature');
                        }

                        const payload = JSON.parse(rawBody.toString('utf-8'));
                        this.handleGatewayEvent(payload).catch((err) => this.client._emitError(err));

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ received: true }));
                    } catch {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Malformed Payload or Verification Error');
                    }
                });
            } else {
                res.writeHead(404).end();
            }
        });
        this.server.on('error', (err) => this.client._emitError(err));
    }

    /**
     * Starts listening for incoming webhook events.
     */
    public listen() {
        const port = this.client.options.webhook?.port ?? 3000;
        this.server.listen(port, () => {});
    }

    /**
     * Internally processes gateway event payload.
     * @param payload - Raw JSON payload received.
     */
    private async handleGatewayEvent(payload: any) {
        const server = this.resolveServer(payload?.server ?? payload?.Server);
        if (!server) return;

        const events = Array.isArray(payload?.events)
            ? payload.events
            : Array.isArray(payload?.Events)
              ? payload.Events
              : [];
        for (const event of events) {
            if (!event || typeof event !== 'object') continue;

            const eventName = event.event ?? event.Event;
            const data = event.data ?? event.Data ?? {};

            if (eventName === 'WebhookProbe') {
                this.client.emit(ERLCEvents.webhookProbe, server);
            } else if (eventName === 'EmergencyCallStarted') {
                server.emergencyCalls.addCall(data);
            } else if (eventName === 'EmergencyCallEnded') {
                server.emergencyCalls.removeCall(data);
            } else if (eventName === 'CustomCommand') {
                let command = (data.command ?? data.Command ?? '').trim();
                if (!command) continue;
                if (command.startsWith(';')) command = command.slice(1);

                const playerId = resolveOriginId(event.origin ?? event.Origin);
                if (playerId === undefined) continue;

                const args = parseArgs(data.argument ?? data.Argument ?? '');
                let player = server.players.cache.get(playerId);

                if (!player) {
                    // Webhooks can arrive before the first poll or for a player
                    // who joined between polls. Refresh the player cache instead
                    // of dropping the command when polling is disabled.
                    try {
                        await server.players.fetchAll();
                    } catch (err) {
                        this.client._emitError(err);
                    }
                    player = server.players.cache.get(playerId);
                }

                if (!player) {
                    // The API may lag behind the game; give the next poll a chance.
                    try {
                        await server.waitFor(ERLCEvents.poll, 5000);
                    } catch {
                        // The command is dropped below if the player never appears.
                    }
                    player = server.players.cache.get(playerId);
                }

                if (!player) continue;
                this.client.emit(
                    ERLCEvents.customCommand,
                    player,
                    command,
                    args,
                );
            }
        }
    }

    /**
     * Resolves a server by the webhook payload's server field.
     */
    private resolveServer(serverId: string | number): Server | undefined {
        const server = this.client.servers.resolve(serverId);
        if (!server) {
            this.client._emitError(new ServerNotConfiguredError(String(serverId)));
            return undefined;
        }
        return server;
    }

    /** Closes the webhook server. */
    public close() {
        this.server.close();
    }
}
