import { Client, ERLCEvents } from '../client/client.js';
import { Staff } from '../structures/staff.js';
import type { RawServerData, RawStaffData, RawVehicle } from '../types/index.js';

/**
 * Manager responsible for fetching, caching, and updating Vehicle structures.
 * @public
 */
export class StaffManager {
    /**
     * Map cache of admins, keyed by their userId.
     */
    public admins = new Map<number, Staff>();

    /**
     * Map cache of mods, keyed by their userId.
     */
    public mods = new Map<number, Staff>();

    /**
     * Map cache of helpers, keyed by their userId.
     */
    public helpers = new Map<number, Staff>();

    /**
     * Creates an instance of StaffManager.
     * @param client - The ERLCApi client.
     */
    constructor(private readonly client: Client) {}

    /**
     * Fetches all staff members.
     * Updates the staff cache.
     * @returns A promise resolving to a Map of active Vehicles.
     */
    public async fetchAll(): Promise<Map<string, Map<number, Staff>>> {
        const rawServer: RawServerData = await this.client.rest.request(
            'GET',
            '/v2/server?Staff=true',
        );
        const rawVehicles: RawStaffData = rawServer.Staff!;

        return this.updateCache(rawVehicles);
    }

    /**
     * Re-synchronizes the cache with the raw staff list from the API.
     * Emits staffAdd and staffRemove events.
     * @param rawStaff - Raw staff list payload.
     * @returns The updated staff cache Map.
     */
    public updateCache(rawStaff: RawStaffData) {
        this._updateCache(rawStaff.Admins, 'Admin');
        this._updateCache(rawStaff.Mods, 'Mod');
        this._updateCache(rawStaff.Helpers, 'Helper');

        return new Map<string, Map<number, Staff>>()
            .set('Admins', this.admins)
            .set('Mods', this.mods)
            .set('Helpers', this.helpers);
    }

    private _updateCache(data: Record<string, string>, type: 'Admin' | 'Mod' | 'Helper') {
        const activeUserIds = new Set<number>();
        const types = `${type}s`;
        let cache: Map<number, Staff>;
        if (type === 'Admin') cache = this.admins;
        else if (type === 'Mod') cache = this.mods;
        else cache = this.helpers;

        for (const [userId, username] of Object.entries(data)) {
            activeUserIds.add(Number(userId));
            const cachedUser = cache.get(Number(userId));

            if (cachedUser) return;
            const newStaff = new Staff(this.client, userId, username);
            cache.set(Number(userId), newStaff);
            this.client.emit(ERLCEvents.staffAdd, newStaff, type);
        }

        for (const cachedId of this.admins.keys()) {
            if (!activeUserIds.has(cachedId)) {
                this.client.emit(ERLCEvents.staffRemove, cache.get(cachedId)!, type);
                cache.delete(cachedId);
            }
        }
    }
}
