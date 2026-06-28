import { Client, ERLCEvents } from '../client/client.js';
import { Player } from '../structures/player.js';
import { type RawPlayerData, type RawServerData } from '../types/index.js';

export class PlayerManager {
    public cache = new Map<number, Player>();
    private nameToId = new Map<string, number>();

    constructor(private readonly client: Client) {}

    public async fetchAll(): Promise<Map<number, Player>> {
        const rawServer: RawServerData = await this.client.rest.request('GET', '/v2/server?Players=true');
        const rawPlayers: RawPlayerData[] = rawServer.Players ?? [];
        
        return this.updateCache(rawPlayers);
    }

    public updateCache(rawPlayers: RawPlayerData[]) {
        const activeIds = new Set<number>();
        const activeUsers = new Set<string>();

        for (const rawData of rawPlayers) {
            const userId = Number(rawData.Player.split(':')[1]);
            const username = rawData.Player.split(':')[0]!;
            activeIds.add(userId);
            activeUsers.add(username);
            this.nameToId.set(username, userId);
            const cachedPlayer = this.cache.get(userId);

            if (cachedPlayer) {
                const oldPlayer = new Player(this.client, cachedPlayer.toJSON());
                cachedPlayer._patch(rawData);
                this.client.emit(ERLCEvents.playerUpdate, oldPlayer, cachedPlayer);
            } else {
                const newPlayer = new Player(this.client, rawData);
                this.cache.set(newPlayer.id, newPlayer);
                this.client.emit(ERLCEvents.playerJoin, newPlayer);
            }
        }

        for (const cachedId of this.cache.keys()) {
            if (!activeIds.has(cachedId)) {
                this.client.emit(ERLCEvents.playerLeave, this.cache.get(cachedId)!);
                this.cache.delete(cachedId);
            }
        }

        for (const cachedUser of this.nameToId.keys()) {
            if (!activeUsers.has(cachedUser)) this.nameToId.delete(cachedUser);
        }

        return this.cache;
    }

    public getIdFromName(name: string) {
        if (this.nameToId.has(name)) return this.nameToId.get(name);
        this.fetchAll().then(() => {
            return this.nameToId.get(name);
        })
    }
}