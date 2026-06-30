import { Client, ERLCEvents } from '../client/client.js';
import { EmergencyCall } from '../structures/emergencycall.js';
import { type RawEmergencyCall, type RawServerData } from '../types/index.js';

/**
 * Manager responsible for fetching, caching, and updating active EmergencyCall structures.
 * @public
 */
export class EmergencyCallManager {
    /**
     * Map cache of active emergency calls, keyed by call number.
     */
    public cache = new Map<number, EmergencyCall>();

    /**
     * Creates an instance of EmergencyCallManager.
     * @param client - The ERLCApi client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Fetches all active emergency calls from the game server.
     * Updates the emergency call cache.
     * @returns A promise resolving to a Map of active EmergencyCalls.
     */
    public async fetchAll(): Promise<Map<number, EmergencyCall>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?EmergencyCalls=true',
        );
        const rawEmergencyCalls: RawEmergencyCall[] = rawServer.EmergencyCalls ?? [];

        return this.updateCache(rawEmergencyCalls);
    }

    /**
     * Re-synchronizes the cache with the raw emergency calls payload.
     * Emits emergencyCallAdd, emergencyCallRemove, and emergencyCallUpdate events.
     * @param rawCalls - Raw active emergency calls payload.
     * @returns The updated EmergencyCall cache Map.
     */
    public updateCache(rawCalls: RawEmergencyCall[]) {
        const activeCalls = new Set<number>();

        for (const rawData of rawCalls) {
            const callNum = rawData.CallNumber;
            activeCalls.add(callNum);
            const cachedCall = this.cache.get(callNum);

            if (cachedCall) {
                const oldCall = new EmergencyCall(this.client, cachedCall.toJSON());
                cachedCall._patch(rawData);
                this.client.emit(ERLCEvents.emergencyCallUpdate, oldCall, cachedCall);
            } else {
                const newCall = new EmergencyCall(this.client, rawData);
                this.cache.set(newCall.callNumber, newCall);
                this.client.emit(ERLCEvents.emergencyCallAdd, newCall);
            }
        }

        for (const cachedCall of this.cache.keys()) {
            if (!activeCalls.has(cachedCall)) {
                this.client.emit(ERLCEvents.emergencyCallRemove, this.cache.get(cachedCall)!);
                this.cache.delete(cachedCall);
            }
        }

        return this.cache;
    }
}
