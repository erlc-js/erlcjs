import type { Server } from '../client/server.js';
import { Ban } from '../structures/ban.js';
import { type RawBanList } from '../types/index.js';
import { Collection } from '../util/collection.js';

/**
 * Manager responsible for fetching and caching the server's ban list.
 * @public
 */
export class BanManager {
    /**
     * Collection cache of banned players, keyed by their UserId.
     */
    public cache = new Collection<number, Ban>();

    /**
     * Creates an instance of BanManager.
     * @param server - The server this manager belongs to.
     */
    constructor(private readonly server: Server) {}

    /**
     * Fetches the server's ban list from the ER:LC API.
     * Replaces the current cache.
     * @returns A promise resolving to a Collection of banned players.
     */
    public async fetchAll(): Promise<Collection<number, Ban>> {
        const rawBans: RawBanList = await this.server.rest.request('GET', '/v1/server/bans');
        return this.updateCache(rawBans);
    }

    /**
     * Re-synchronizes the cache with a raw ban list.
     * @param rawBans - Map of banned UserIds to usernames.
     * @returns The updated ban cache Collection.
     */
    public updateCache(rawBans: RawBanList) {
        this.cache.clear();

        for (const [playerId, username] of Object.entries(rawBans ?? {})) {
            const id = Number(playerId);
            if (!Number.isFinite(id)) continue;

            this.cache.set(id, new Ban(this.server, id, username));
        }

        return this.cache;
    }
}
