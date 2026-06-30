import { Server, createServer } from 'node:http';
import { Client } from '../client/client.js';
import { Player } from '../structures/player.js';

/**
 * Webhook Server for handling real-time gateway events pushed by ER:LC.
 * @alpha
 */
export class WebhookServer {
    private server: Server;

    /**
     * Creates an instance of WebhookServer.
     * @param client - The ERLCApi client.
     */
    constructor(private client: Client) {
        this.server = createServer((req, res) => {
            const configPath = this.client.options.webhook?.path || '/';

            if (req.method === 'POST' && req.url === configPath) {
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => {
                    try {
                        const payload = JSON.parse(body);
                        this.handleGatewayEvent(payload);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ received: true }));
                    } catch (err) {
                        res.writeHead(400).end('Malformed Payload');
                    }
                });
            } else {
                res.writeHead(404).end();
            }
        });
    }

    /**
     * Starts listening for incoming webhook events.
     */
    public listen() {
        const port = this.client.options.webhook?.port || 3000;
        this.server.listen(port, () => {});
    }

    /**
     * Internally processes gateway event payload.
     * @param payload - Raw JSON payload received.
     */
    private handleGatewayEvent(payload: any) {
        // TODO
    }
}
