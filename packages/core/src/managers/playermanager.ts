import { Client } from '../client/client.js';
import { Player } from '../structures/player.js';
import { type RawPlayerData, type RawServerData } from '../types/index.js';

export class PlayerManager {
    public cache = new Map<number, Player>();

    constructor(private readonly client: Client) {}

    public async fetchAll(): Promise<Map<number, Player>> {
        const rawServer: RawServerData = await this.client.rest.request('GET', '/v2/server?Players=true');
        const rawPlayers: RawPlayerData[] = rawServer.Players ?? [];
        
        return this.updateCache(rawPlayers);
    }

    public updateCache(rawPlayers: RawPlayerData[]) {
        const activeIds = new Set<number>();

        for (const rawData of rawPlayers) {
            const userId = Number(rawData.Player.split(':')[1])
            activeIds.add(userId);
            const cachedPlayer = this.cache.get(userId);

            if (cachedPlayer) {
                cachedPlayer._patch(rawData);
            } else {
                const newPlayer = new Player(this.client, rawData);
                this.cache.set(newPlayer.id, newPlayer);
            }
        }

        for (const cachedId of this.cache.keys()) {
            if (!activeIds.has(cachedId)) this.cache.delete(cachedId);
        }

        return this.cache;
    }
}