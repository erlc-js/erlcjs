import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';
import { KillLogManager } from './killlogmanager.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

describe('KillLogManager', () => {
    it('does not re-emit kills that were evicted by the cache limit', () => {
        const server = makeServer();
        const kills: string[] = [];
        server.client.on(ERLCEvents.kill, (log) => kills.push(log.killedUsername));

        const manager = new KillLogManager(server, 1);
        const raw = [
            { Killer: 'Alex:1', Killed: 'Bob:2', Timestamp: 1 },
            { Killer: 'Alex:1', Killed: 'Casey:3', Timestamp: 2 },
        ];

        manager.updateCache(raw);
        manager.updateCache(raw);

        expect(kills).toEqual(['Bob', 'Casey']);
        expect(manager.cache.size).toBe(1);
        server.client.destroy();
    });

    it('evicts the oldest logs by timestamp regardless of insertion order', () => {
        const server = makeServer();
        const manager = new KillLogManager(server, 2);

        manager.updateCache([
            { Killer: 'Alex:1', Killed: 'Bob:2', Timestamp: 3 },
            { Killer: 'Alex:1', Killed: 'Bob:2', Timestamp: 1 },
            { Killer: 'Alex:1', Killed: 'Bob:2', Timestamp: 2 },
        ]);

        expect(manager.cache.size).toBe(2);
        expect(Array.from(manager.cache.values()).map((log) => log.timestamp).sort()).toEqual([2, 3]);
        server.client.destroy();
    });
});
