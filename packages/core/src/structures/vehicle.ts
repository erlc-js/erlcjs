import { Client } from "../client/client.js";
import { Base } from "./base.js";
import type { RawVehicle } from "../types/index.js";
import { Player } from "./player.js";

export class Vehicle extends Base {
    name!: string;
    ownerId!: number;
    ownerUsername!: string;
    owner!: Player;
    plate!: string;
    texture?: string;
    colorHex!: string;
    colorName!: string;
    
    constructor(client: Client, data: RawVehicle) {
        super(client);
        this._patch(data);
    }

    public _patch(data: RawVehicle): this {
        this.name = data.Name;
        this.ownerUsername = data.Owner
        this.ownerId = this.client.players.getIdFromName(this.ownerUsername)!;
        this.owner = this.client.players.cache.get(this.ownerId)!;
        this.plate = data.Plate;
        this.texture = data.Texture;
        this.colorHex = data.ColorHex;
        this.colorName = data.ColorName;
        return this;
    }
}