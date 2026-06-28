import { Client, ERLCEvents } from '../client/client.js';
import { KillLog } from '../structures/killlog.js';
import { type RawKillLog, type RawServerData } from '../types/index.js';

export class KillLogManager {
    public cache = new Map<string, KillLog>();

    constructor(private readonly client: Client) {}

    public async fetchAll(): Promise<Map<string, KillLog>> {
        const rawServer: RawServerData = await this.client.rest.request('GET', '/v2/server?KillLogs=true');
        const rawKillLogs: RawKillLog[] = rawServer.KillLogs ?? [];
        
        return this.updateCache(rawKillLogs);
    }

    public updateCache(rawCommands: RawKillLog[]) {
        for (const rawData of rawCommands) {
            const key = `${rawData.Killer}:${rawData.Killed}:${rawData.Timestamp}`
            const cachedPlayer = this.cache.get(key);

            if (!cachedPlayer) {
                const newKill = new KillLog(this.client, rawData);
                this.cache.set(key, newKill);
                this.client.emit(ERLCEvents.kill, newKill);
            }
        }

        return this.cache;
    }
}