import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from './client.js';
import { ERLCEvents } from './events.js';

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

    it('is not full before server information has loaded', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;

        expect(server.isFull).toBe(false);
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
