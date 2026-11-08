import type { Server } from '../client/server.js';
import { ERLCEvents } from '../client/events.js';
import { Collection } from '../util/collection.js';
import { KillLog } from '../structures/killlog.js';
import { type RawKillLog, type RawServerData } from '../types/index.js';

/** Maximum number of evicted keys remembered to avoid re-emitting old logs. */
const MAX_SEEN_KEYS = 10_000;

/**
 * Manager responsible for fetching, caching, and updating KillLog structures.
 * @public
 */
export class KillLogManager {
    /**
     * Collection cache of logged kills, keyed by a composite `Killer:Killed:Timestamp` key.
     */
    public cache = new Collection<string, KillLog>();
    private readonly seenKeys = new Set<string>();

    /**
     * Creates an instance of KillLogManager.
     * @param server - The server this manager belongs to.
     * @param maxCacheSize - The maximum number of kill logs to hold in cache.
     */
    constructor(private readonly server: Server, private readonly maxCacheSize?: number) {}

    /**
     * Fetches all kill logs from the game server.
     * Updates the kill log cache.
     * @returns A promise resolving to a Collection of KillLogs.
     */
    public async fetchAll(): Promise<Collection<string, KillLog>> {
        const rawServer: RawServerData = await this.server.rest.request(
            'GET',
            '/v2/server?KillLogs=true',
        );
        const rawKillLogs: RawKillLog[] = rawServer.KillLogs ?? [];

        return this.updateCache(rawKillLogs);
    }

    /**
     * Re-synchronizes the cache with the raw kill logs.
     * Emits a kill event for new logs.
     * @param rawCommands - Raw kill logs payload.
     * @returns The updated KillLog cache Collection.
     */
    public updateCache(rawCommands: RawKillLog[]) {
        for (const rawData of rawCommands) {
            const key = `${rawData.Killer}:${rawData.Killed}:${rawData.Timestamp}`;
            if (this.cache.has(key)) continue;

            if (this.maxCacheSize && this.maxCacheSize > 0) {
                if (this.seenKeys.has(key)) continue;
                this.rememberKey(key);
            }

            const newKill = new KillLog(this.server, rawData);
            this.cache.set(key, newKill);
            this.server.client.emit(ERLCEvents.kill, newKill);
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

    private rememberKey(key: string) {
        this.seenKeys.add(key);
        if (this.seenKeys.size <= MAX_SEEN_KEYS) return;

        const oldest = this.seenKeys.values().next().value;
        if (oldest !== undefined) this.seenKeys.delete(oldest);
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
