import type { Server } from '../client/server.js';
import { Base } from './base.js';
import { Player } from './player.js';

/**
 * Represents a player banned from an ER:LC server.
 * @public
 */
export class Ban extends Base {
    /**
     * The UserId of the banned player.
     */
    public playerId!: number;
    /**
     * The Roblox username of the banned player, if known.
     */
    public username?: string;
    /**
     * The Player instance representing the banned player, if they are online.
     */
    public player?: Player;

    /**
     * Creates an instance of Ban.
     * @param server - The server the player is banned from.
     * @param playerId - The UserId of the banned player.
     * @param username - The Roblox username of the banned player, if known.
     */
    constructor(server: Server, playerId: string | number, username?: string | null) {
        super(server);
        this._patch(playerId, username);
    }

    /**
     * Patches the Ban structure with new raw data.
     * @param playerId - The UserId of the banned player.
     * @param username - The Roblox username of the banned player, if known.
     * @returns This ban instance.
     */
    public _patch(playerId: string | number, username?: string | null): this {
        this.playerId = Number(playerId);
        this.username = username ?? undefined;
        this.player = this.server.players.cache.get(this.playerId);
        return this;
    }
}
