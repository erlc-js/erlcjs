import { Base } from './base.js';
import { Client } from '../client/client.js';
import { type RawPlayerData } from '../types/index.js';

export class Player extends Base {
    public id!: number;
    public username!: string;
    public team!: string;
    public callsign?: string;
    public location!: { x: number, y: number, postalCode: string, streetName: string, buildingNumber: string };
    public permission!: 'Normal' | 'Server Administrator' | 'Server Owner' | 'Server Moderator';
    public wantedLevel!: number;

    constructor(client: Client, data: RawPlayerData) {
        super(client);
        this._patch(data);
    }

    public _patch(data: RawPlayerData): this {
        const splitPlayer = data.Player.split(':');
        this.id = Number(splitPlayer[1]);
        this.username = splitPlayer[0]!;
        this.team = data.Team;
        this.callsign = data.Callsign;
        this.location = { 
            x: data.Location.LocationX, 
            y: data.Location.LocationY, 
            postalCode: data.Location.PostalCode, 
            streetName: data.Location.StreetName, 
            buildingNumber: data.Location.BuildingNumber,
        };
        this.permission = data.Permission ?? 'Normal';
        this.wantedLevel = data.WantedStars ?? 0;
        return this;
    }

    public async kick(reason: string = "Kicked by API"): Promise<void> {
        await this.client.commands.execute(`:kick ${this.username} ${reason}`);
    }

    public async kill(): Promise<void> {
        await this.client.commands.execute(`:kill ${this.username}`);
    }

    public async message(text: string): Promise<void> {
        await this.client.commands.execute(`:pm ${this.username} ${text}`);
    }

    public toJSON(): RawPlayerData {
        return {
            Player: `${this.username}:${this.id}`,
            Permission: this.permission,
            Team: this.team,
            Callsign: this.callsign!,
            WantedStars: this.wantedLevel,
            Location: { LocationX: this.location.x, LocationY: this.location.y, PostalCode: this.location.postalCode, StreetName: this.location.streetName, BuildingNumber: this.location.buildingNumber }
        }
    }
}