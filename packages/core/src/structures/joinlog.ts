import type { Server } from '../client/server.js';
import { Base } from './base.js';
import type { RawJoinLog } from '../types/index.js';
import { Player } from './player.js';

/**
 * Represents a server join or leave log entry.
 * @public
 */
export class JoinLog extends Base {
    /**
     * The Player instance representing the player, if they are still cached.
     */
    public player?: Player;
    /**
     * The UserId of the player.
     */
    public playerId!: number;
    /**
     * The Roblox username of the player.
     */
    public playerUsername!: string;
    /**
     * Whether the player joined (true) or left (false).
     */
    public joined!: boolean;
    /**
     * Unix timestamp of when the event occurred.
     */
    public timestamp!: number;

    /**
     * Creates an instance of JoinLog.
     * @param server - The server the event happened in.
     * @param data - The raw join log data to initialize.
     */
    constructor(server: Server, data: RawJoinLog) {
        super(server);
        this._patch(data);
    }

    /**
     * Patches the JoinLog structure with new raw data.
     * @param data - The new raw join log data.
     * @returns This join log instance.
     */
    public _patch(data: RawJoinLog): this {
        const splitPlayer = data.Player.split(':');
        this.playerId = Number(splitPlayer[1]);
        this.playerUsername = splitPlayer[0]!;
        this.player = this.server.players.cache.get(this.playerId);
        this.joined = data.Join;
        this.timestamp = data.Timestamp;
        return this;
    }

    /**
     * Converts this JoinLog instance to raw JSON representation.
     * @returns The raw join log data.
     */
    public toJSON(): RawJoinLog {
        return {
            Join: this.joined,
            Timestamp: this.timestamp,
            Player: `${this.playerUsername}:${this.playerId}`,
        };
    }
}
