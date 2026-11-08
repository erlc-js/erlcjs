import type { Server } from '../client/server.js';
import { ERLCEvents } from '../client/events.js';
import { JoinLog } from '../structures/joinlog.js';
import { type RawJoinLog, type RawServerData } from '../types/index.js';
import { Collection } from '../util/collection.js';

/**
 * Manager responsible for fetching, caching, and updating JoinLog structures.
 * @public
 */
export class JoinLogManager {
    /**
     * Collection cache of join and leave logs, keyed by a composite
     * `Player:Timestamp:Join` key.
     */
    public cache = new Collection<string, JoinLog>();

    /**
     * Creates an instance of JoinLogManager.
     * @param server - The server this manager belongs to.
     * @param maxCacheSize - The maximum number of join logs to hold in cache.
     */
    constructor(private readonly server: Server, private readonly maxCacheSize?: number) {}

    /**
     * Fetches all join logs from the game server.
     * Updates the join log cache.
     * @returns A promise resolving to a Collection of JoinLogs.
     */
    public async fetchAll(): Promise<Collection<string, JoinLog>> {
        const rawServer: RawServerData = await this.server.rest.request(
            'GET',
            '/v2/server?JoinLogs=true',
        );
        const rawJoinLogs: RawJoinLog[] = rawServer.JoinLogs ?? [];

        return this.updateCache(rawJoinLogs);
    }

    /**
     * Re-synchronizes the cache with the raw join logs.
     * Emits a joinLog event for new logs.
     * @param rawJoinLogs - Raw join logs payload.
     * @returns The updated JoinLog cache Collection.
     */
    public updateCache(rawJoinLogs: RawJoinLog[]) {
        for (const rawData of rawJoinLogs) {
            const key = `${rawData.Player}:${rawData.Timestamp}:${rawData.Join}`;
            if (this.cache.has(key)) continue;

            const log = new JoinLog(this.server, rawData);
            this.cache.set(key, log);
            this.server.client.emit(ERLCEvents.joinLog, log);
        }

        if (this.maxCacheSize && this.maxCacheSize > 0) {
            while (this.cache.size > this.maxCacheSize) {
                const oldestKey = this.findOldestKey();
                if (oldestKey === undefined) break;
                this.cache.delete(oldestKey);
            }
        }

        return this.cache;
    }

    private findOldestKey(): string | undefined {
        let oldestKey: string | undefined;
        let oldestTimestamp = Number.POSITIVE_INFINITY;

        for (const [key, log] of this.cache) {
            if (log.timestamp < oldestTimestamp) {
                oldestTimestamp = log.timestamp;
                oldestKey = key;
            }
        }

        return oldestKey;
    }
}
