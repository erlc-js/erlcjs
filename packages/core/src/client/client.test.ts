import { afterEach, describe, expect, it } from 'vitest';
import { Client } from './client.js';
import { ERLCEvents } from './events.js';
import { Player } from '../structures/player.js';
import { DuplicateServerError, CustomCommandError } from '../errors/index.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

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

describe('Client', () => {
    it('parses server ids and registers servers keyed by id', () => {
        const client = new Client({ servers: ['PRC-111111111-key', 'PRC-222222222-key'] });
        expect(client.servers.size).toBe(2);
        expect(client.servers.get('111111111')?.id).toBe('111111111');
        expect(client.servers.get('222222222')?.id).toBe('222222222');
        expect(client.servers.resolve(111111111)?.id).toBe('111111111');
        client.destroy();
    });

    it('trims whitespace from global app ids', () => {
        const client = new Client({ servers: ['PRC-111111111-key'], globalAppId: ' 123 ' });
        expect(client.globalAppId).toBe('123');
        client.destroy();
    });

    it('throws DuplicateServerError for keys resolving to the same server id', () => {
        expect(() => new Client({ servers: ['PRC-111111111-key', 'PRC-111111111-other'] })).toThrow(DuplicateServerError);
    });

    it('emits ready immediately and resolves onceReady when polling is disabled', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        await expect(client.onceReady()).resolves.toBe(client);
        client.destroy();
    });

    it('emits ready after every server completes its first poll', async () => {
        globalThis.fetch = (async () => {
            return {
                status: 200,
                statusText: 'OK',
                ok: true,
                headers: new Headers({
                    'x-ratelimit-bucket': 'global',
                    'x-ratelimit-limit': '35',
                    'x-ratelimit-remaining': '34',
                    'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
                }),
                json: async () => rawServer(),
            } as unknown as Response;
        }) as any;

        const client = new Client({
            servers: ['PRC-111111111-key', 'PRC-222222222-key'],
            polling: { enabled: true, pollingRateMs: 500 },
        });

        const ready = await Promise.race([
            client.onceReady().then(() => 'ready'),
            new Promise((r) => setTimeout(() => r('timeout'), 3000)),
        ]);
        expect(ready).toBe('ready');
        client.destroy();
    });

    it('dispatches global and server-scoped custom commands', () => {
        const client = new Client({ servers: ['PRC-111111111-key', 'PRC-222222222-key'] });
        const a = client.servers.get('111111111')!;
        const b = client.servers.get('222222222')!;

        const ran: string[] = [];
        client.registerCommand({ name: 'global', execute: () => { ran.push('global'); } });
        a.registerCommand({ name: 'local', execute: () => { ran.push('local'); } });

        const p1 = new Player(a, rawPlayer('Alex', 1));
        const p2 = new Player(b, rawPlayer('Bob', 2));

        client.emit(ERLCEvents.customCommand, p1, 'global', []);
        client.emit(ERLCEvents.customCommand, p2, 'global', []);
        client.emit(ERLCEvents.customCommand, p1, 'local', []);
        client.emit(ERLCEvents.customCommand, p2, 'local', []);

        expect(ran).toEqual(['global', 'global', 'local']);
        client.destroy();
    });

    it('adds and removes servers at runtime', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.addServer('PRC-333333333-key');
        expect(client.servers.get('333333333')).toBe(server);
        expect(client.removeServer('333333333')).toBe(true);
        expect(client.servers.get('333333333')).toBeUndefined();
        expect(client.removeServer('does-not-exist')).toBe(false);
        client.destroy();
    });

    it('does not throw when emitting errors with no listeners', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        expect(() => client._emitError(new Error('boom'))).not.toThrow();
        client.destroy();
    });

    it('routes errors to listeners when present', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const received: unknown[] = [];
        client.on('error', (err) => received.push(err));
        const err = new Error('boom');
        client._emitError(err);
        expect(received).toEqual([err]);
        client.destroy();
    });

    it('routes synchronous and asynchronous custom command failures to error listeners', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        const errors: string[] = [];
        client.on('error', (err) => errors.push((err as Error).message));

        client.registerCommand({
            name: 'sync',
            execute: () => {
                throw new Error('sync failure');
            },
        });
        client.registerCommand({
            name: 'async',
            execute: async () => {
                throw new Error('async failure');
            },
        });

        const player = new Player(server, rawPlayer('Alex', 1));
        client.emit(ERLCEvents.customCommand, player, 'sync', []);
        client.emit(ERLCEvents.customCommand, player, 'async', []);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(errors).toEqual(['sync failure', 'async failure']);
        client.destroy();
    });

    it('does not crash on asynchronous custom command failures without an error listener', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        client.registerCommand({
            name: 'fail',
            execute: async () => {
                throw new Error('boom');
            },
        });

        const player = new Player(client.servers.get('111111111')!, rawPlayer('Alex', 1));
        expect(() => client.emit(ERLCEvents.customCommand, player, 'fail', [])).not.toThrow();
        await new Promise((resolve) => setTimeout(resolve, 0));
        client.destroy();
    });

    it('does not register aliases when a command is invalid', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });

        expect(() =>
            client.registerCommand({
                name: 'invalid',
                aliases: ['invalid-alias'],
                // @ts-expect-error deliberately invalid command
                execute: undefined,
            }),
        ).toThrow(CustomCommandError);
        expect(() =>
            client.registerCommand({ name: 'invalid', aliases: ['invalid-alias'], execute: () => {} }),
        ).not.toThrow();
        client.destroy();
    });

    it('does not partially register a command whose alias is a duplicate', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        client.registerCommand({ name: 'existing', execute: () => {} });

        expect(() =>
            client.registerCommand({ name: 'fresh', aliases: ['existing'], execute: () => {} }),
        ).toThrow(CustomCommandError);
        expect(() => client.registerCommand({ name: 'fresh', execute: () => {} })).not.toThrow();
        client.destroy();
    });

    it('rejects empty aliases', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });

        expect(() =>
            client.registerCommand({ name: 'empty', aliases: [';'], execute: () => {} }),
        ).toThrow(CustomCommandError);
        client.destroy();
    });

    it('unregisters a command and all of its aliases', () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        const ran: string[] = [];

        client.registerCommand({
            name: 'main',
            aliases: ['alias', 'other'],
            execute: () => { ran.push('main'); },
        });
        client.unregisterCommand(';MAIN');

        const player = new Player(server, rawPlayer('Alex', 1));
        client.emit(ERLCEvents.customCommand, player, 'main', []);
        client.emit(ERLCEvents.customCommand, player, 'alias', []);
        client.emit(ERLCEvents.customCommand, player, 'other', []);

        expect(ran).toEqual([]);
        client.destroy();
    });
});
