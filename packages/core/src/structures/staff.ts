import { Client } from '../client/client.js';
import { Base } from './base.js';
import type { RawKillLog } from '../types/index.js';
import { Player } from './player.js';

/**
 * Represents a staff member.
 * @public
 */
export class Staff extends Base {
    /**
     * The staff members user id.
     */
    id!: number;
    /**
     * The staff members username.
     */
    username!: string;
    /**
     * Whether or not the staff member is online.
     */
    online!: boolean;
    /**
     * The player instance of the staff member if they are online.
     */
    player?: Player;

    /**
     * Creates an instance of Staff.
     * @param client - The ERLCApi client.
     * @param userId - The user id.
     * @param username - The username.
     */
    constructor(client: Client, userId: string, username: string) {
        super(client);
        this._patch(userId, username);
    }

    /**
     * Patches the Staff structure with new raw data.
     * @param userId - The user id.
     * @param username - The username.
     * @returns This staff instance.
     */
    public _patch(userId: string, username: string): this {
        this.id = Number(userId);
        this.username = username;
        this.online = this.client.players.cache.has(this.id);
        this.player = undefined;
        if (this.online === true) this.player = this.client.players.cache.get(this.id);
        return this;
    }
}
