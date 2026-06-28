import { Client } from "../client/client.js";
import { Vehicle } from "../structures/vehicle.js";
import type { RawServerData, RawVehicle } from "../types/index.js";

export class VehicleManager {
    public cache = new Map<string, Vehicle>();

    constructor(private readonly client: Client) {};

    public async fetchAll(): Promise<Map<string, Vehicle>> {
        const rawServer: RawServerData = await this.client.rest.request('GET', '/v2/server?Vehicles=true');
        const rawVehicles: RawVehicle[] = rawServer.Vehicles ?? [];
        
        return this.updateCache(rawVehicles);
    }

    public updateCache(rawPlayers: RawVehicle[]) {
        const activePlates = new Set<string>();

        for (const rawData of rawPlayers) {
            const plate = rawData.Plate
            activePlates.add(plate);
            const cachedVehicle = this.cache.get(plate);

            if (cachedVehicle) {
                cachedVehicle._patch(rawData);
            } else {
                const newPlayer = new Vehicle(this.client, rawData);
                this.cache.set(newPlayer.plate, newPlayer);
            }
        }

        for (const cachedPlate of this.cache.keys()) {
            if (!activePlates.has(cachedPlate)) this.cache.delete(cachedPlate);
        }

        return this.cache;
    }
}