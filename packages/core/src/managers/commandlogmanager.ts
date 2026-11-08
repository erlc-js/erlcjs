import type { Server } from '../client/server.js';
import { ERLCEvents } from '../client/events.js';
import { CommandLog } from '../structures/commandlog.js';
import { type RawCommandLog, type RawServerData } from '../types/index.js';
import { Collection } from '../util/collection.js';

/** Maximum number of evicted keys remembered to avoid re-emitting old logs. */
const MAX_SEEN_KEYS = 10_000;

/**
 * Manager responsible for fetching, caching, and updating CommandLog structures.
 * @public
 */
export class CommandLogManager {
    /**
     * Collection cache of logged commands, keyed by a composite `Player:Timestamp:Command` key.
     */
    public cache = new Collection<string, CommandLog>();
    private readonly seenKeys = new Set<string>();

    /**
     * Creates an instance of CommandLogManager.
     * @param server - The server this manager belongs to.
     * @param maxCacheSize - The maximum number of command logs to hold in cache.
     */
    constructor(private readonly server: Server, private readonly maxCacheSize?: number) {}

    /**
     * Fetches all command logs from the game server.
     * Updates the command log cache.
     * @returns A promise resolving to a Collection of CommandLogs.
     */
    public async fetchAll(): Promise<Collection<string, CommandLog>> {
        const rawServer: RawServerData = await this.server.rest.request(
            'GET',
            '/v2/server?CommandLogs=true',
        );
        const rawCommands: RawCommandLog[] = rawServer.CommandLogs ?? [];

        return this.updateCache(rawCommands);
    }

    /**
     * Re-synchronizes the cache with the raw command logs.
     * Emits command event for new logs.
     * @param rawCommands - Raw command logs payload.
     * @returns The updated CommandLog cache Collection.
     */
    public updateCache(rawCommands: RawCommandLog[]) {
        for (const rawData of rawCommands) {
            const key = `${rawData.Player}:${rawData.Timestamp}:${rawData.Command}`;
            if (this.cache.has(key)) continue;

            // Polls return a rolling window of logs. Remember keys that were
            // evicted so old logs are not re-added and re-emitted every poll.
            if (this.maxCacheSize && this.maxCacheSize > 0) {
                if (this.seenKeys.has(key)) continue;
                this.rememberKey(key);
            }

            const newCommand = new CommandLog(this.server, rawData);
            this.cache.set(key, newCommand);
            this.server.client.emit(ERLCEvents.command, newCommand);
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
