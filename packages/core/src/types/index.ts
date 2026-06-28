export interface ClientOptions {
    serverKey: string;
    globalKey?: string;
    webhook?: {
        enabled: boolean;
        port: number;
        path?: string;
        secret?: string;
    };
    polling?: boolean;
}

export interface RawPlayerData {
    Player: string;
    Permission: 'Normal' | 'Server Administrator' | 'Server Owner' | 'Server Moderator';
    Team: string;
    Callsign: string;
    Location: {
        LocationX: number;
        LocationY: number;
        PostalCode: string;
        StreetName: string;
        BuildingNumber: string;
    }
    WantedStars: number;
}

export interface RawStaffData {
    Admins: Record<string, string>;
    Mods: Record<string, string>;
    Helpers: Record<string, string>;
}

export interface RawJoinLog {
    Join: boolean;
    Timestamp: number;
    Player: string;
}

export interface RawKillLog {
    Killed: string;
    Timestamp: number;
    Killer: string;
}

export interface RawCommandLog {
    Player: string;
    Timestamp: number;
    Command: string;
}

export interface RawModCall {
    Caller: string;
    Moderator?: string;
    Timestamp: number;
}

export interface RawEmergencyCall {
    Team: string;
    Caller: number;
    Players: number[];
    Position: number[];
    StartedAt: number;
    CallNumber: number;
    Description: string;
    PositionDescriptor: string;
}

export interface RawVehicle {
    Name: string;
    Owner: string;
    Plate: string;
    Texture?: string;
    ColorHex: string;
    ColorName: string;
}

export interface RawServerData {
    Name: string;
    OwnerId: number;
    CoOwnerIds: number[];
    CurrentPlayers: number;
    MaxPlayers: number;
    JoinKey: string;
    AccVerifiedReq: 'Disabled' | 'Email' | 'Phone/ID';
    TeamBalance: boolean;
    Players?: RawPlayerData[];
    Staff?: RawStaffData[];
    JoinLogs?: RawJoinLog[];
    Queue?: number[];
    KillLogs?: RawKillLog[];
    CommandLogs?: RawCommandLog[];
    ModCalls?: RawModCall[];
    EmergencyCalls?: RawEmergencyCall[];
    Vehicles?: RawVehicle[];
}