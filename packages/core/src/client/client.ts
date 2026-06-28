import { EventEmitter } from 'node:events';
import { type ClientOptions } from '../types/index.js';
import { RestManager } from '../rest/manager.js';
import { ServerManager } from '../managers/servermanager.js';
import { PlayerManager } from '../managers/playermanager.js';
import { CommandManager } from '../managers/commandmanager.js';
import { WebhookServer } from '../gateway/webhookserver.js';
import { VehicleManager } from '../managers/vehiclemanager.js';

export enum ERLCEvents {
    poll = 'POLL',
    playerJoin = 'PLAYER_JOIN',
    playerUpdate = 'PLAYER_UPDATE',
    playerLeave = 'PLAYER_LEAVE',
    vehicleAdd = 'VEHICLE_ADD',
    vehicleRemove = 'VEHICLE_REMOVE',
    vehicleUpdate = 'VEHICLE_UPDATE',
}

export class Client extends EventEmitter {
    public rest: RestManager;
    public server: ServerManager;
    public players: PlayerManager;
    public commands: CommandManager;
    public vehicles: VehicleManager;
    private readonly gateway?: WebhookServer;

    constructor(public options: ClientOptions) {
        super();
        this.rest = new RestManager(options);
        this.server = new ServerManager(this);
        this.players = new PlayerManager(this);
        this.commands = new CommandManager(this);
        this.vehicles = new VehicleManager(this);

        if (options.webhook?.enabled) {
            this.gateway = new WebhookServer(this);
            this.gateway.listen();
        }

        if (options.polling) {
            this.startPolling();
        }
    }

    private startPolling() {
        console.log('begin polling')
        setInterval(async () => {
            try {
                const server = await this.server.fetch();
                this.emit(ERLCEvents.poll, server);
                console.log('fetch')
                if (server.Players) this.players.updateCache(server.Players);
                if (server.Vehicles) this.vehicles.updateCache(server.Vehicles);
            } catch (err) {
                this.emit('error', err);
            }
        }, 5000);
    }
}