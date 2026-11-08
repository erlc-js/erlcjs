import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from './client.js';
import { ERLCEvents } from './events.js';
import { MissingGlobalAppIdError } from '../errors/index.js';

afterEach(() => {
    vi.useRealTimers();
});

function rawServer() {
    return {
        Name: 'Test Server',
        OwnerId: 1,
        CoOwnerIds: [],
        CurrentPlayers: 0,
        MaxPlayers: 10,
        JoinKey: 'abc',
        AccVerifiedReq: 'Disabled',
        TeamBalance: false,
        Players: [],
        Vehicles: [],
        CommandLogs: [],
        KillLogs: [],
        ModCalls: [],
        EmergencyCalls: [],
        Staff: { Admins: {}, Mods: {}, Helpers: {} },
    };
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

describe('Server polling', () => {
    it('does not start overlapping loops when restarted during the first poll', async () => {
        vi.useFakeTimers();
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        const poll = vi.spyOn(server as any, 'poll').mockResolvedValue(undefined);

        server.startPolling(1000);
        server.startPolling(1000);
        await vi.advanceTimersByTimeAsync(0);
        expect(poll).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(1000);
        expect(poll).toHaveBeenCalledTimes(3);

        server.stopPolling();
        await vi.advanceTimersByTimeAsync(5000);
        expect(poll).toHaveBeenCalledTimes(3);

        client.destroy();
    });

    it('clears the offline flag when a manual fetch succeeds', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        server.offline = true;

        vi.spyOn(server.rest, 'request').mockResolvedValue({ ...rawServer(), Players: [rawPlayer('Alex', 1)] });
        let online = 0;
        const counts: number[] = [];
        client.on(ERLCEvents.serverOnline, () => {
            online++;
            counts.push(server.players.cache.size);
        });

        await server.fetch();

        expect(server.offline).toBe(false);
        expect(online).toBe(1);
        expect(counts).toEqual([1]);
        client.destroy();
    });

    it('trims whitespace from configured server keys', () => {
        const client = new Client({ servers: ['  PRC-111111111-key\n'] });
        const server = client.servers.get('111111111')!;

        expect(server.key).toBe('PRC-111111111-key');
        client.destroy();
    });

    it('is not full before server information has loaded', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;

        expect(server.isFull).toBe(false);
        client.destroy();
    });

    it('clears per-poll caches when optional fields are missing', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        const request = vi.spyOn(server.rest, 'request');

        request.mockResolvedValueOnce({
            ...rawServer(),
            Players: [rawPlayer('Alex', 1)],
            Vehicles: [
                { Name: 'Chevlon Captain 1992', Owner: 'Alex', Plate: 'ABC123', ColorHex: '#fff', ColorName: 'White' },
            ],
            Staff: { Admins: { '1': 'Alex' }, Mods: {}, Helpers: {} },
            EmergencyCalls: [
                {
                    Team: 'Police',
                    Caller: 1,
                    Players: [1],
                    Position: [10, 20],
                    StartedAt: 100,
                    CallNumber: 42,
                    Description: 'Officer needs backup',
                    PositionDescriptor: 'Mission Row',
                },
            ],
        });

        await server.fetch();
        expect(server.players.cache.size).toBe(1);
        expect(server.vehicles.cache.size).toBe(1);
        expect(server.staff.admins.size).toBe(1);
        expect(server.emergencyCalls.cache.size).toBe(1);

        request.mockResolvedValueOnce({
            Name: 'Test Server',
            OwnerId: 1,
            CoOwnerIds: [],
            CurrentPlayers: 0,
            MaxPlayers: 10,
            JoinKey: 'abc',
            AccVerifiedReq: 'Disabled',
            TeamBalance: false,
        });

        await server.fetch();
        expect(server.players.cache.size).toBe(0);
        expect(server.vehicles.cache.size).toBe(0);
        expect(server.staff.admins.size).toBe(0);
        expect(server.emergencyCalls.cache.size).toBe(0);

        client.destroy();
    });

    it('populates join logs from the poll payload', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        vi.spyOn(server.rest, 'request').mockResolvedValue({
            ...rawServer(),
            JoinLogs: [{ Join: true, Timestamp: 100, Player: 'Alex:1' }],
        });

        const logs: string[] = [];
        client.on(ERLCEvents.joinLog, (log) => logs.push(`${log.playerUsername}:${log.joined}`));

        await server.fetch();

        expect(logs).toEqual(['Alex:true']);
        expect(server.joinLogs.cache.size).toBe(1);

        client.destroy();
    });

    it('throws MissingGlobalAppIdError when no app id is configured', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;

        expect(() => server.authorizationLink).toThrow(MissingGlobalAppIdError);
        client.destroy();
    });

    it('builds an authorization link from the app id', () => {
        const client = new Client({ servers: ['PRC-111111111-key'], globalAppId: 123 });
        const server = client.servers.get('111111111')!;

        expect(server.authorizationLink).toBe(
            'https://api.erlc.gg/server-owners/server/111111111/authorize/123',
        );
        client.destroy();
    });

    it('emits poll after the caches have been updated', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        vi.spyOn(server.rest, 'request').mockResolvedValue({
            ...rawServer(),
            Players: [rawPlayer('Alex', 1)],
        });

        const playerCounts: number[] = [];
        client.on(ERLCEvents.poll, () => playerCounts.push(server.players.cache.size));

        await server.fetch();

        expect(playerCounts).toEqual([1]);
        client.destroy();
    });
});
