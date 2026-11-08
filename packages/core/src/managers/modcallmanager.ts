import type { Server } from '../client/server.js';
import { ERLCEvents } from '../client/events.js';
import { Collection } from '../util/collection.js';
import { ModCall } from '../structures/modcall.js';
import { type RawModCall, type RawServerData } from '../types/index.js';

/** Maximum number of evicted keys remembered to avoid re-emitting old calls. */
const MAX_SEEN_KEYS = 10_000;

/**
 * Manager responsible for fetching, caching, and updating ModCall structures.
 * @public
 */
export class ModCallManager {
    /**
     * Collection cache of logged moderator calls, keyed by a composite `Caller:Timestamp` key.
     */
    public cache = new Collection<string, ModCall>();
    private readonly seenKeys = new Set<string>();

    /**
     * Creates an instance of ModCallManager.
     * @param server - The server this manager belongs to.
     * @param maxCacheSize - The maximum number of kill logs to hold in cache.
     */
    constructor(private readonly server: Server, private readonly maxCacheSize?: number) {}

    /**
     * Fetches all moderator calls from the game server.
     * Updates the moderator call cache.
     * @returns A promise resolving to a Collection of ModCalls.
     */
    public async fetchAll(): Promise<Collection<string, ModCall>> {
        const rawServer: RawServerData = await this.server.rest.request(
            'GET',
            '/v2/server?ModCalls=true',
        );
        const rawModCalls: RawModCall[] = rawServer.ModCalls ?? [];

        return this.updateCache(rawModCalls);
    }

    /**
     * Re-synchronizes the cache with the raw moderator calls.
     * Emits a modCall event for new calls.
     * @param rawModCalls - Raw moderator calls payload.
     * @returns The updated ModCall cache Collection.
     */
    public updateCache(rawModCalls: RawModCall[]) {
        for (const rawData of rawModCalls) {
            const key = `${rawData.Caller}:${rawData.Timestamp}`;
            const cachedCall = this.cache.get(key);

            if (!cachedCall) {
                if (this.maxCacheSize && this.maxCacheSize > 0) {
                    if (this.seenKeys.has(key)) continue;
                    this.rememberKey(key);
                }

                const newCall = new ModCall(this.server, rawData);
                this.cache.set(key, newCall);
                this.server.client.emit(ERLCEvents.modCall, newCall);
                if (rawData.Moderator) {
                    this.server.client.emit(ERLCEvents.modCallAnswered, newCall);
                }
            } else {
                const hadModerator = Boolean(cachedCall.moderatorId);
                cachedCall._patch(rawData);
                if (!hadModerator && cachedCall.moderatorId) {
                    this.server.client.emit(ERLCEvents.modCallAnswered, cachedCall);
                }
            }
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

        for (const [key, call] of this.cache) {
            if (call.timestamp < oldestTimestamp) {
                oldestTimestamp = call.timestamp;
                oldestKey = key;
            }
        }

        return oldestKey;
    }
}
