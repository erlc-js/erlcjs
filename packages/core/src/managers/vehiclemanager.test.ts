import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';

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

describe('VehicleManager', () => {
    it('emits vehicleAdd for spawned vehicles and resolves the owner from the player cache', () => {
        const server = makeServer();
        const client = server.client;
        server.players.updateCache([rawPlayer('Alex', 7)]);

        const added: string[] = [];
        client.on(ERLCEvents.vehicleAdd, (v) => added.push(v.plate));

        server.vehicles.updateCache([
            { Name: 'Chevlon Captain 1992', Owner: 'Alex', Plate: 'ABC123', ColorHex: '#fff', ColorName: 'White' },
        ]);

        const vehicle = server.vehicles.cache.get('ABC123');
        expect(added).toEqual(['ABC123']);
        expect(vehicle?.ownerId).toBe(7);
        expect(vehicle?.owner?.username).toBe('Alex');
        expect(vehicle?.server).toBe(server);

        client.destroy();
    });

    it('only emits updates when vehicle data actually changes', () => {
        const server = makeServer();
        const client = server.client;
        const updates: string[] = [];
        const added: string[] = [];
        const removed: string[] = [];

        client.on(ERLCEvents.vehicleUpdate, (_old, next) => updates.push(next.colorName));
        client.on(ERLCEvents.vehicleAdd, (vehicle) => added.push(vehicle.name));
        client.on(ERLCEvents.vehicleRemove, (vehicle) => removed.push(vehicle.name));

        const base = {
            Name: 'Chevlon Captain 1992',
            Owner: 'Alex',
            Plate: 'ABC123',
            ColorHex: '#fff',
            ColorName: 'White',
        };

        server.vehicles.updateCache([base]);
        server.vehicles.updateCache([{ ...base }]);
        expect(updates).toEqual([]);

        server.vehicles.updateCache([{ ...base, ColorHex: '#000', ColorName: 'Black' }]);
        expect(updates).toEqual(['Black']);

        server.vehicles.updateCache([{ ...base, Name: 'Chevlon Captain 2009' }]);
        expect(removed).toEqual(['Chevlon Captain 1992']);
        expect(added).toEqual(['Chevlon Captain 1992', 'Chevlon Captain 2009']);

        client.destroy();
    });
});
