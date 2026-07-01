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
import type { Staff } from '../structures/staff.js';
import { StaffManager } from '../managers/staffmanager.js';

/**
 * Event names emitted by the ERLCApi Client.
 * @public
 */
export enum ERLCEvents {
    /** Emitted when the first poll is complete and the client is ready. */
    ready = 'READY',
    /** Emitted when a periodic server poll finishes. */
    poll = 'POLL',
    /** Emitted when server details are updated. */
    serverUpdate = 'SERVER_UPDATE',
    /** Emitted when server details are first loaded. */
    serverCreate = 'SERVER_CREATE',
    /** Emitted when a player joins the server. */
    playerJoin = 'PLAYER_JOIN',
    /** Emitted when a player's data (e.g. location, team) updates. */
    playerUpdate = 'PLAYER_UPDATE',
    /** Emitted when a player leaves the server. */
    playerLeave = 'PLAYER_LEAVE',
    /** Emitted when a vehicle is spawned. */
    vehicleAdd = 'VEHICLE_ADD',
    /** Emitted when a vehicle is despawned. */
    vehicleRemove = 'VEHICLE_REMOVE',
    /** Emitted when a vehicle's data updates. */
    vehicleUpdate = 'VEHICLE_UPDATE',
    /** Emitted when a server command is run. */
    command = 'COMMAND',
    /** Emitted when a player requests moderator assistance. */
    modCall = 'MOD_CALL',
    /** Emitted when a player is killed. */
    kill = 'KILL',
    /** Emitted when an emergency call is created. */
    emergencyCallAdd = 'EMERGENCY_CALL_ADD',
    /** Emitted when an emergency call is cleared. */
    emergencyCallRemove = 'EMERGENCY_CALL_REMOVE',
    /** Emitted when an emergency call is updated. */
    emergencyCallUpdate = 'EMERGENCY_CALL_UPDATE',
    /** Emitted when a staff member is added */
    staffAdd = 'STAFF_ADD',
    /** Emitted when a staff member is removed */
    staffRemove = 'STAFF_REMOVE',
    /** Emitted when a custom command is executed in-game */
    customCommand = 'CUSTOM_COMMAND',
    /** Emitted when a user enters the webhook in-game */
    webhookProbe = 'WEBHOOK_PROBE',
}

/**
 * Interface mapping client event names to their callback parameters.
 * @public
 */
export interface ClientEvents {
    /** Emitted when the first poll is complete and the client is ready. */
    [ERLCEvents.ready]: [];
    /** Emitted when a periodic server poll finishes. */
    [ERLCEvents.poll]: [server: RawServerData];
    /** Emitted when server details are updated. */
    [ERLCEvents.serverUpdate]: [oldServer: Server | null, newServer: Server];
    /** Emitted when server details are first loaded. */
    [ERLCEvents.serverCreate]: [server: Server];

    /** Emitted when a player joins the server. */
    [ERLCEvents.playerJoin]: [player: Player];
    /** Emitted when a player's data updates. */
    [ERLCEvents.playerUpdate]: [oldPlayer: Player | null, newPlayer: Player];
    /** Emitted when a player leaves the server. */
    [ERLCEvents.playerLeave]: [player: Player];

    /** Emitted when a vehicle is spawned. */
    [ERLCEvents.vehicleAdd]: [vehicle: Vehicle];
    /** Emitted when a vehicle is despawned. */
    [ERLCEvents.vehicleRemove]: [vehicle: Vehicle];
    /** Emitted when a vehicle's data updates. */
    [ERLCEvents.vehicleUpdate]: [oldVehicle: Vehicle | null, newVehicle: Vehicle];

    /** Emitted when a server command is run. */
    [ERLCEvents.command]: [log: CommandLog];
    /** Emitted when a player requests moderator assistance. */
    [ERLCEvents.modCall]: [call: ModCall];
    /** Emitted when a player is killed. */
    [ERLCEvents.kill]: [kill: KillLog];

    /** Emitted when an emergency call is created. */
    [ERLCEvents.emergencyCallAdd]: [call: EmergencyCall];
    /** Emitted when an emergency call is cleared. */
    [ERLCEvents.emergencyCallRemove]: [call: EmergencyCall];
    /** Emitted when an emergency call is updated. */
    [ERLCEvents.emergencyCallUpdate]: [oldCall: EmergencyCall | null, newCall: EmergencyCall];

    /** Emitted when a player is given a staff role. */
    [ERLCEvents.staffAdd]: [staff: Staff, type: 'Admin' | 'Mod' | 'Helper'];
    /** Emitted when a player is removed from a staff role. */
    [ERLCEvents.staffRemove]: [staff: Staff, type: 'Admin' | 'Mod' | 'Helper'];

    /** Emitted when a custom command is executed in-game. */
    [ERLCEvents.customCommand]: [player: Player | string, command: string, args: string[]];

    /** Emitted when a player enters the webhook in-game. */
    [ERLCEvents.webhookProbe]: [];

    /** Emitted when an error is caught during polling or gateway operations. */
    error: [error: unknown];
}

/**
 * The main client for interacting with the ER:LC API and gateway.
 * @public
 */
export class Client extends EventEmitter<ClientEvents> {
    /** REST Manager for sending manual requests to the ER:LC API. */
    public rest: RestManager;
    /** Manager for fetching and caching general server configuration. */
    public server: ServerManager;
    /** Manager for player caching, joining, and management actions. */
    public players: PlayerManager;
    /** Manager for executing server-side console commands. */
    public commands: CommandManager;
    /** Manager for spawned vehicles cache and events. */
    public vehicles: VehicleManager;
    /** Manager for command execution log events. */
    public commandLogs: CommandLogManager;
    /** Manager for active emergency calls. */
    public emergencyCalls: EmergencyCallManager;
    /** Manager for kill logs. */
    public killLogs: KillLogManager;
    /** Manager for moderator call logs. */
    public modCalls: ModCallManager;
    /** Manager for staff members. */
    public staff: StaffManager;
    /** Webhook Gateway server instance, if enabled. */
    private readonly gateway?: WebhookServer;

    /**
     * Creates an instance of Client.
     * @param options - The ClientOptions configuration.
     */
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
        this.staff = new StaffManager(this);

        if (options.webhook?.enabled) {
            this.gateway = new WebhookServer(this);
            this.gateway.listen();
        }

        if (options.polling) {
            this.startPolling();
        }

        this.emit(ERLCEvents.ready);
    }

    /**
     * Starts the periodic api-polling loop if enabled.
     */
    private async startPolling() {
        await this.poll();
        setInterval(async () => {
            await this.poll();
        }, 5000);
    }

    private async poll() {
        try {
            const server = await this.server.fetch();
            this.emit(ERLCEvents.poll, server);
            if (server.Players) this.players.updateCache(server.Players);
            if (server.Vehicles) this.vehicles.updateCache(server.Vehicles);
            if (server.CommandLogs) this.commandLogs.updateCache(server.CommandLogs);
            if (server.EmergencyCalls) this.emergencyCalls.updateCache(server.EmergencyCalls);
            if (server.KillLogs) this.killLogs.updateCache(server.KillLogs);
            if (server.ModCalls) this.modCalls.updateCache(server.ModCalls);
            if (server.Staff) this.staff.updateCache(server.Staff);
        } catch (err) {
            this.emit('error', err);
        }
    }

    waitFor<K extends keyof ClientEvents>(
        event: K,
        timeoutMs: number = 0,
    ): Promise<ClientEvents[K]> {
        return new Promise((resolve, reject) => {
            let timeout: NodeJS.Timeout | undefined;

            const listener = (...args: ClientEvents[K]) => {
                if (timeout) clearTimeout(timeout);
                resolve(args);
            };

            this.once(event, listener as any);

            if (timeoutMs > 0) {
                timeout = setTimeout(() => {
                    this.off(event, listener as any);
                    reject(new Error(`Timeout waiting for event: "${event}" after ${timeoutMs}ms`));
                }, timeoutMs);
            }
        });
    }
}
