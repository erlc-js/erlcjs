import { EventEmitter } from 'node:events';
import { type ClientOptions } from '../types/index.js';
import { RestManager } from '../rest/manager.js';
import { ServerManager } from '../managers/servermanager.js';
import { PlayerManager } from '../managers/playermanager.js';
import { CommandManager } from '../managers/commandmanager.js';
import { WebhookServer } from '../gateway/webhookserver.js';
import { VehicleManager } from '../managers/vehiclemanager.js';

export enum ERLCEvents {
    playerJoin = 'PLAYER_JOIN',
    playerLeave = 'PLAYER_LEAVE',
    vehicleAdd = 'VEHICLE_ADD',
    vehicleRemove = 'VEHICLE_REMOVE'
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
                const oldIds = new Set(this.players.cache.keys());
                const oldPlates = new Set(this.vehicles.cache.keys());
                const server = await this.server.fetch();
                console.log('fetch')
                if (server.Players) this.players.updateCache(server.Players);
                if (server.Vehicles) this.vehicles.updateCache(server.Vehicles);
                
                for (const [id, player] of this.players.cache) {
                    if (!oldIds.has(id)) this.emit(ERLCEvents.playerJoin, player);
                }
                for (const id of oldIds) {
                    if (!this.players.cache.has(id)) this.emit(ERLCEvents.playerLeave, id);
                }
                for (const [plate, vehicle] of this.vehicles.cache) {
                    if (!oldPlates.has(plate)) this.emit(ERLCEvents.vehicleAdd, vehicle);
                }
                for (const plate of oldPlates) {
                    if (!this.vehicles.cache.has(plate)) this.emit(ERLCEvents.vehicleRemove, plate);
                }
            } catch (err) {
                this.emit('error', err);
            }
        }, 5000);
    }
}