import { Client } from "../client/client.js";
import { Base } from "./base.js";
import type { RawServerData } from "../types/index.js";

export class Server extends Base {
    name!: string;
    ownerId!: number;
    coOwnerIds!: number[];
    currentPlayers!: number;
    joinKey!: string;
    accVerifiedReq!: 'Disabled' | 'Email' | 'Phone/ID';
    teamBalance!: boolean;

    constructor(client: Client, data: RawServerData) {
        super(client);
        this._patch(data);
    }

    public _patch(data: RawServerData): this {
        this.name = data.Name;
        this.ownerId = data.OwnerId;
        this.coOwnerIds = data.CoOwnerIds;
        this.currentPlayers = data.CurrentPlayers;
        this.joinKey = data.JoinKey;
        this.accVerifiedReq = data.AccVerifiedReq;
        this.teamBalance = data.TeamBalance;
        return this;
    }
}