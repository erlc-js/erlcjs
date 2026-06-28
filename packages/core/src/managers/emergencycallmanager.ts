import { Client, ERLCEvents } from '../client/client.js';
import { EmergencyCall } from '../structures/emergencycall.js';
import { type RawEmergencyCall, type RawServerData } from '../types/index.js';

export class EmergencyCallManager {
    public cache = new Map<number, EmergencyCall>();

    constructor(private readonly client: Client) {}

    public async fetchAll(): Promise<Map<number, EmergencyCall>> {
        const rawServer: RawServerData = await this.client.rest.request('GET', '/v2/server?EmergencyCalls=true');
        const rawEmergencyCalls: RawEmergencyCall[] = rawServer.EmergencyCalls ?? [];
        
        return this.updateCache(rawEmergencyCalls);
    }

    public updateCache(rawCalls: RawEmergencyCall[]) {
            const activeCalls = new Set<number>();
    
            for (const rawData of rawCalls) {
                const callNum = rawData.CallNumber
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