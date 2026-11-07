import { describe, expect, it, vi } from 'vitest';
import { Client } from '../client/client.js';
import { Player } from './player.js';

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

describe('Player', () => {
    it('filters related caches by ids even when players are no longer cached', () => {
        const server = makeServer();
        server.players.updateCache([rawPlayer('Alex', 1)]);
        const alex = server.players.cache.get(1)!;

        server.commandLogs.updateCache([{ Player: 'Alex:1', Timestamp: 1, Command: ':admin Bob' }]);
        server.killLogs.updateCache([{ Killer: 'Alex:1', Killed: 'Bob:2', Timestamp: 1 }]);
        server.vehicles.updateCache([
            { Name: 'Chevlon Captain 1992', Owner: 'Alex', Plate: 'ABC123', ColorHex: '#fff', ColorName: 'White' },
        ]);

        expect(alex.commandLogs).toHaveLength(1);
        expect(alex.kills).toHaveLength(1);
        expect(alex.deaths).toHaveLength(0);
        expect(alex.vehicles).toHaveLength(1);

        const bob = new Player(server, rawPlayer('Bob', 2));
        expect(bob.deaths).toHaveLength(1);
        expect(bob.kills).toHaveLength(0);

        server.client.destroy();
    });

    it('serializes a missing callsign as an empty string', () => {
        const server = makeServer();
        const player = new Player(server, { ...rawPlayer('Alex', 1), Callsign: undefined } as any);

        expect(player.toJSON().Callsign).toBe('');
        server.client.destroy();
    });

    it('teleports using the target player id', async () => {
        const server = makeServer();
        const alex = new Player(server, rawPlayer('Alex', 1));
        const bob = new Player(server, rawPlayer('Bob', 2));
        const execute = vi.spyOn(server.commands, 'execute').mockResolvedValue('ok');

        await alex.tp(bob);
        await alex.tp(3);

        expect(execute).toHaveBeenNthCalledWith(1, ':tp Alex 2');
        expect(execute).toHaveBeenNthCalledWith(2, ':tp Alex 3');
        server.client.destroy();
    });
});
