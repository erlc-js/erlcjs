import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client, Player, Vehicle, CommandLog, KillLog, ServerInfo } from '@erlcjs/core';
import { welcomePlayer, banKickRejoin } from './player.js';
import { banVehicles, banLiveries, VehiclePunishments } from './vehicle.js';
import { RDM } from './kill.js';
import { banCommand, CommandPunishments } from './command.js';
import { autoHint, autoCommand } from './auto.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

function rawPlayer(name: string, id: number): any {
    return {
        Player: `${name}:${id}`,
        Permission: 'Normal',
        Team: 'Civilian',
        Callsign: '',
        Location: { LocationX: 0, LocationZ: 0, PostalCode: '0', StreetName: '', BuildingNumber: '' },
        WantedStars: 0,
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('welcomePlayer', () => {
    it('messages the player with the server name by default', async () => {
        const server = makeServer();
        server.info = new ServerInfo(server, {
            Name: 'Cool Server',
            OwnerId: 1,
            CoOwnerIds: [],
            CurrentPlayers: 1,
            MaxPlayers: 10,
            JoinKey: 'x',
            AccVerifiedReq: 'Disabled',
            TeamBalance: false,
        } as any);

        const player = new Player(server, rawPlayer('Alex', 1));
        const message = vi.spyOn(player, 'message').mockResolvedValue(undefined);

        welcomePlayer()(player);
        await vi.waitFor(() => expect(message).toHaveBeenCalledWith('Welcome to Cool Server!'));

        const custom = vi.spyOn(player, 'message').mockResolvedValue(undefined);
        welcomePlayer('Hey!')!(player);
        await vi.waitFor(() => expect(custom).toHaveBeenCalledWith('Hey!'));
        server.client.destroy();
    });

    it('reports message failures instead of throwing', async () => {
        const server = makeServer();
        const player = new Player(server, rawPlayer('Alex', 1));
        const err = new Error('nope');
        vi.spyOn(player, 'message').mockRejectedValue(err);
        const emit = vi.spyOn(server.client, '_emitError').mockImplementation(() => {});

        welcomePlayer()(player);
        await vi.waitFor(() => expect(emit).toHaveBeenCalledWith(err));
        server.client.destroy();
    });
});

describe('banKickRejoin', () => {
    it('bans a player who rejoins shortly after being kicked', async () => {
        const server = makeServer();
        server.commandLogs.updateCache([
            { Player: 'Alex:1', Timestamp: Math.floor(Date.now() / 1000), Command: ':kick Alex by API' },
        ]);

        const player = new Player(server, rawPlayer('Alex', 1));
        const ban = vi.spyOn(player, 'ban').mockResolvedValue(undefined);

        banKickRejoin(1800)(player);
        expect(ban).toHaveBeenCalledTimes(1);
        server.client.destroy();
    });

    it('does not ban players with no recent kick', () => {
        const server = makeServer();
        const player = new Player(server, rawPlayer('Alex', 1));
        const ban = vi.spyOn(player, 'ban').mockResolvedValue(undefined);
        banKickRejoin(1800)(player);
        expect(ban).not.toHaveBeenCalled();
        server.client.destroy();
    });

    it('does not treat a kick of a similarly named player as a match', () => {
        const server = makeServer();
        server.commandLogs.updateCache([
            { Player: 'Alex:1', Timestamp: Math.floor(Date.now() / 1000), Command: ':kick Alex by API' },
        ]);

        const player = new Player(server, rawPlayer('Alexander', 2));
        const ban = vi.spyOn(player, 'ban').mockResolvedValue(undefined);
        banKickRejoin(1800)(player);
        expect(ban).not.toHaveBeenCalled();
        server.client.destroy();
    });
});

describe('banVehicles', () => {
    it('invokes the action for banned vehicles and skips allowlisted owners', () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 7)]);
        const vehicle = new Vehicle(server, {
            Name: 'Chevlon Captain 1992',
            Owner: 'Alex',
            Plate: 'ABC123',
            ColorHex: '#fff',
            ColorName: 'White',
        } as any);

        const action = vi.fn();
        banVehicles(['Chevlon Captain 1992'], action)(vehicle);
        expect(action).toHaveBeenCalledWith(vehicle);

        const allowed = vi.fn();
        banVehicles(['Chevlon Captain 1992'], allowed, [7])(vehicle);
        expect(allowed).not.toHaveBeenCalled();
        server.client.destroy();
    });

    it('does not throw when the vehicle owner is not cached', () => {
        const server = makeServer();
        const vehicle = new Vehicle(server, {
            Name: 'Chevlon Captain 1992',
            Owner: 'Ghost',
            Plate: 'ABC123',
            ColorHex: '#fff',
            ColorName: 'White',
        } as any);

        const action = vi.fn();
        expect(() => banVehicles(['Chevlon Captain 1992'], action)(vehicle)).not.toThrow();
        expect(action).toHaveBeenCalledWith(vehicle);
        expect(() => VehiclePunishments.warnThenKick()(vehicle)).not.toThrow();

        server.client.destroy();
    });

    it('stops quietly when waiting for the next poll times out', async () => {
        vi.useFakeTimers();
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 7)]);
        const owner = server.players.cache.get(7)!;
        vi.spyOn(owner, 'message').mockResolvedValue(undefined);
        vi.spyOn(server, 'waitFor').mockRejectedValue(new Error('timeout'));

        const vehicle = new Vehicle(server, {
            Name: 'Chevlon Captain 1992',
            Owner: 'Alex',
            Plate: 'ABC123',
            ColorHex: '#fff',
            ColorName: 'White',
        } as any);
        server.vehicles.cache.set(vehicle.plate, vehicle);

        VehiclePunishments.warnThenKick(10)(vehicle);
        await vi.advanceTimersByTimeAsync(10000);

        server.client.destroy();
    });
});

describe('banLiveries', () => {
    it('invokes the action for matching liveries', () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 7)]);
        const vehicle = new Vehicle(server, {
            Name: 'Chevlon Captain 1992',
            Owner: 'Alex',
            Plate: 'ABC123',
            ColorHex: '#fff',
            ColorName: 'White',
            Texture: 'Staff',
        } as any);

        const action = vi.fn();
        banLiveries(['Staff'], action)(vehicle);
        expect(action).toHaveBeenCalledWith(vehicle);
        server.client.destroy();
    });

    it('supports livery restrictions that apply to all vehicles', () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 7)]);
        const vehicle = new Vehicle(server, {
            Name: 'Chevlon Captain 1992',
            Owner: 'Alex',
            Plate: 'ABC123',
            ColorHex: '#fff',
            ColorName: 'White',
            Texture: 'Staff',
        } as any);

        const action = vi.fn();
        banLiveries([{ livery: 'Staff' }], action)(vehicle);
        expect(action).toHaveBeenCalledWith(vehicle);
        server.client.destroy();
    });
});

describe('RDM', () => {
    it('fires when a player exceeds the kill threshold in the timespan', () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Killer', 1), rawPlayer('Victim', 2)]);
        const now = Math.floor(Date.now() / 1000);
        server.killLogs.updateCache([
            { Killer: 'Killer:1', Killed: 'Victim:2', Timestamp: now - 2 },
            { Killer: 'Killer:1', Killed: 'Victim:2', Timestamp: now - 1 },
        ]);

        const log = new KillLog(server, { Killer: 'Killer:1', Killed: 'Victim:2', Timestamp: now });
        const action = vi.fn();
        RDM(action, [], 2, 30)(log);
        expect(action).toHaveBeenCalledTimes(1);
        server.client.destroy();
    });

    it('does not throw when the killer is not cached', () => {
        const server = makeServer();
        const log = new KillLog(server, {
            Killer: 'Ghost:99',
            Killed: 'Victim:2',
            Timestamp: Math.floor(Date.now() / 1000),
        });

        const action = vi.fn();
        expect(() => RDM(action)(log)).not.toThrow();
        expect(action).not.toHaveBeenCalled();

        server.client.destroy();
    });
});

describe('banCommand', () => {
    it('kicks the sender of a banned command', () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 1)]);
        const log = new CommandLog(server, { Player: 'Alex:1', Timestamp: 123, Command: ':admin x' });

        let kicked = false;
        banCommand([':admin'], () => { kicked = true; })(log);
        expect(kicked).toBe(true);
        server.client.destroy();
    });

    it('does not throw when the command sender is not cached', () => {
        const server = makeServer();
        const log = new CommandLog(server, { Player: 'Ghost:99', Timestamp: 123, Command: ':admin x' });
        const action = vi.fn();

        expect(() => banCommand([':admin'], action, true, ['Server Owner'])(log)).not.toThrow();
        expect(action).not.toHaveBeenCalled();
        expect(() => CommandPunishments.kick()(log)).not.toThrow();

        server.client.destroy();
    });
});

describe('auto helpers', () => {
    it('sends hints on an interval', () => {
        vi.useFakeTimers();
        const server = makeServer();
        const execute = vi.spyOn(server.commands, 'execute').mockResolvedValue('ok');
        const interval = autoHint(server, 'Welcome!', 1000);
        vi.advanceTimersByTime(3000);
        expect(execute).toHaveBeenCalledWith(':h Welcome!');
        clearInterval(interval);
        server.client.destroy();
    });

    it('sends commands on an interval', () => {
        vi.useFakeTimers();
        const server = makeServer();
        const execute = vi.spyOn(server.commands, 'execute').mockResolvedValue('ok');
        const interval = autoCommand(server, ':m hi', 1000);
        vi.advanceTimersByTime(2000);
        expect(execute).toHaveBeenCalledWith(':m hi');
        clearInterval(interval);
        server.client.destroy();
    });

    it('reports command failures instead of throwing', async () => {
        vi.useFakeTimers();
        const server = makeServer();
        const err = new Error('nope');
        vi.spyOn(server.commands, 'execute').mockRejectedValue(err);
        const emit = vi.spyOn(server.client, '_emitError').mockImplementation(() => {});

        const interval = autoHint(server, 'Welcome!', 1000);
        vi.advanceTimersByTime(1000);
        await vi.waitFor(() => expect(emit).toHaveBeenCalledWith(err));
        clearInterval(interval);
        server.client.destroy();
    });
});
