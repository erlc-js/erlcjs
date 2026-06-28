import { EventEmitter } from 'node:events';
import { type ClientOptions, type RawServerData } from '../types/index.js';
import { RestManager } from '../rest/manager.js';
import { ServerManager } from '../managers/servermanager.js';
import { PlayerManager } from '../managers/playermanager.js';
import { CommandManager } from '../managers/commandmanager.js';
import { WebhookServer } from '../gateway/webhookserver.js';
import { VehicleManager } from '../managers/vehiclemanager.js';
import { CommandLogManager } from '../managers/commandlogmanager.js';
import { EmergencyCallManager } from '../managers/emergencycallmanager.js';
import { KillLogManager } from '../managers/killlogmanager.js';
import { ModCallManager } from '../managers/modcallmanager.js';
import { Server } from '../structures/server.js';
import { Player } from '../structures/player.js';
import { Vehicle } from '../structures/vehicle.js';
import { CommandLog } from '../structures/commandlog.js';
import { ModCall } from '../structures/modcall.js';
import { EmergencyCall } from '../structures/emergencycall.js';
import type { KillLog } from '../structures/killlog.js';

export enum ERLCEvents {
    poll = 'POLL',
    serverUpdate = 'SERVER_UPDATE',
    serverCreate = 'SERVER_CREATE',
    playerJoin = 'PLAYER_JOIN',
    playerUpdate = 'PLAYER_UPDATE',
    playerLeave = 'PLAYER_LEAVE',
    vehicleAdd = 'VEHICLE_ADD',
    vehicleRemove = 'VEHICLE_REMOVE',
    vehicleUpdate = 'VEHICLE_UPDATE',
    command = 'COMMAND',
    modCall = 'MOD_CALL',
    kill = 'KILL',
    emergencyCallAdd = 'EMERGENCY_CALL_ADD',
    emergencyCallRemove = 'EMERGENCY_CALL_REMOVE',
    emergencyCallUpdate = 'EMERGENCY_CALL_UPDATE',
}

export interface ClientEvents {
    [ERLCEvents.poll]: [server: RawServerData];
    [ERLCEvents.serverUpdate]: [oldServer: Server | null, newServer: Server];
    [ERLCEvents.serverCreate]: [server: Server];
    
    [ERLCEvents.playerJoin]: [player: Player];
    [ERLCEvents.playerUpdate]: [oldPlayer: Player | null, newPlayer: Player];
    [ERLCEvents.playerLeave]: [player: Player];
    
    [ERLCEvents.vehicleAdd]: [vehicle: Vehicle];
    [ERLCEvents.vehicleRemove]: [vehicle: Vehicle];
    [ERLCEvents.vehicleUpdate]: [oldVehicle: Vehicle | null, newVehicle: Vehicle];
    
    [ERLCEvents.command]: [log: CommandLog];
    [ERLCEvents.modCall]: [call: ModCall];
    [ERLCEvents.kill]: [kill: KillLog];
    
    [ERLCEvents.emergencyCallAdd]: [call: EmergencyCall];
    [ERLCEvents.emergencyCallRemove]: [call: EmergencyCall];
    [ERLCEvents.emergencyCallUpdate]: [oldCall: EmergencyCall | null, newCall: EmergencyCall];
    
    error: [error: unknown];
}

export class Client extends EventEmitter<ClientEvents> {
    public rest: RestManager;
    public server: ServerManager;
    public players: PlayerManager;
    public commands: CommandManager;
    public vehicles: VehicleManager;
    public commandLogs: CommandLogManager;
    public emergencyCalls: EmergencyCallManager;
    public killLogs: KillLogManager;
    public modCalls: ModCallManager;
    private readonly gateway?: WebhookServer;

    constructor(public options: ClientOptions) {
        super();
        this.rest = new RestManager(options);
        this.server = new ServerManager(this);
        this.players = new PlayerManager(this);
        this.commands = new CommandManager(this);
        this.vehicles = new VehicleManager(this);
        this.commandLogs = new CommandLogManager(this);
        this.emergencyCalls = new EmergencyCallManager(this);
        this.killLogs = new KillLogManager(this);
        this.modCalls = new ModCallManager(this);

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
                if (server.CommandLogs) this.commandLogs.updateCache(server.CommandLogs);
                if (server.EmergencyCalls) this.emergencyCalls.updateCache(server.EmergencyCalls);
                if (server.KillLogs) this.killLogs.updateCache(server.KillLogs);
                if (server.ModCalls) this.modCalls.updateCache(server.ModCalls);
            } catch (err) {
                this.emit('error', err);
            }
        }, 5000);
    }
}