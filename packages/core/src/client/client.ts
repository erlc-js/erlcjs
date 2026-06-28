import { EventEmitter } from 'node:events';
import { type ClientOptions } from '../types/index.js';
import { RestManager } from '../rest/manager.js';
import { PlayerManager } from '../managers/playermanager.js';
import { WebhookServer } from '../gateway/webhookserver.js';

export class Client extends EventEmitter {
    public rest: RestManager;
    public players: PlayerManager;
    private readonly gateway?: WebhookServer;

    constructor(public options: ClientOptions) {
        super();
        this.rest = new RestManager(options);
        this.players = new PlayerManager(this);

        if (options.webhook?.enabled) {
            this.gateway = new WebhookServer(this);
            this.gateway.listen();
        }

        if (options.polling) {
            this.startPolling();
        }
    }

    private startPolling() {
        setInterval(async () => {
            try {
                const oldIds = new Set(this.players.cache.keys());
                await this.players.fetchAll();
                
                for (const [id, player] of this.players.cache) {
                    if (!oldIds.has(id)) this.emit('playerJoin', player);
                }
                for (const id of oldIds) {
                    if (!this.players.cache.has(id)) this.emit('playerLeave', id);
                }
            } catch (err) {
                this.emit('error', err);
            }
        }, 15000);
    }
}