import { Client } from "../client/client.js";
import type { RawServerData } from "../types/index.js";
import { Server } from "../structures/server.js";

export class ServerManager {
    public cache?: Server;

    constructor(private readonly client: Client) {};
    
    public async fetch() {
        const rawServerData: RawServerData = await this.client.rest.request('GET', '/v2/server?Players=true&Vehicles=true');

        this.cache = new Server(this.client, rawServerData);

        return rawServerData;
    }
}