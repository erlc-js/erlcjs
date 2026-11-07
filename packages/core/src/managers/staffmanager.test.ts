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

describe('StaffManager', () => {
    it('emits staffAdd and staffRemove, keeping staff grouped by role', () => {
        const server = makeServer();
        const client = server.client;
        const added: Array<[string, string]> = [];
        const removed: Array<[string, string]> = [];

        client.on(ERLCEvents.staffAdd, (staff, type) => added.push([staff.username, type]));
        client.on(ERLCEvents.staffRemove, (staff, type) => removed.push([staff.username, type]));

        server.staff.updateCache({ Admins: { '1': 'Alex' }, Mods: {}, Helpers: {} });
        expect(added).toEqual([['Alex', 'Admin']]);
        expect(server.staff.admins.size).toBe(1);

        server.staff.updateCache({ Admins: {}, Mods: { '2': 'Bob' }, Helpers: {} });
        expect(removed).toEqual([['Alex', 'Admin']]);
        expect(added).toEqual([['Alex', 'Admin'], ['Bob', 'Mod']]);
        expect(server.staff.admins.size).toBe(0);
        expect(server.staff.mods.size).toBe(1);

        client.destroy();
    });

    it('refreshes online state and usernames for cached staff members', () => {
        const server = makeServer();
        server.staff.updateCache({ Admins: { '1': 'Alex' }, Mods: {}, Helpers: {} });
        const staff = server.staff.admins.get(1)!;
        expect(staff.online).toBe(false);

        server.players.updateCache([rawPlayer('Alex', 1)]);
        server.staff.updateCache({ Admins: { '1': 'Alexandra' }, Mods: {}, Helpers: {} });
        expect(staff.username).toBe('Alexandra');
        expect(staff.online).toBe(true);
        expect(staff.player?.id).toBe(1);

        server.players.clear();
        server.staff.updateCache({ Admins: { '1': 'Alexandra' }, Mods: {}, Helpers: {} });
        expect(staff.online).toBe(false);
        expect(staff.player).toBeUndefined();
        server.client.destroy();
    });

    it('treats missing role lists as empty', () => {
        const server = makeServer();
        server.staff.updateCache({ Admins: { '1': 'Alex' }, Mods: {}, Helpers: {} });
        expect(server.staff.admins.size).toBe(1);

        expect(() => server.staff.updateCache({} as any)).not.toThrow();
        expect(server.staff.admins.size).toBe(0);
        expect(server.staff.mods.size).toBe(0);
        expect(server.staff.helpers.size).toBe(0);
        server.client.destroy();
    });
});
