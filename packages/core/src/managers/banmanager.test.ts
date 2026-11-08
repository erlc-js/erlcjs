import { describe, expect, it, vi } from 'vitest';
import { Client } from '../client/client.js';

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

describe('BanManager', () => {
    it('fetches the ban list and resolves cached players', async () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 1)]);
        const request = vi.spyOn(server.rest, 'request').mockResolvedValue({
            '1': 'Alex',
            '2': null,
        });

        const bans = await server.bans.fetchAll();

        expect(request).toHaveBeenCalledWith('GET', '/v1/server/bans');
        expect(bans.size).toBe(2);
        expect(bans.get(1)?.username).toBe('Alex');
        expect(bans.get(1)?.player?.username).toBe('Alex');
        expect(bans.get(2)?.username).toBeUndefined();
        expect(bans.get(2)?.player).toBeUndefined();

        server.client.destroy();
    });

    it('replaces stale entries and skips invalid user ids', () => {
        const server = makeServer();

        server.bans.updateCache({ '1': 'Alex', '2': 'Bob' });
        server.bans.updateCache({ '1': 'Alex', 'not-a-user': 'Ghost' });

        expect(server.bans.cache.size).toBe(1);
        expect(server.bans.cache.has(1)).toBe(true);
        expect(server.bans.cache.has(2)).toBe(false);

        server.client.destroy();
    });
});
