import { describe, expect, it, vi } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';
import { JoinLogManager } from './joinlogmanager.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

describe('JoinLogManager', () => {
    it('emits joinLog for new entries and ignores duplicates from later polls', () => {
        const server = makeServer();
        const logs: string[] = [];
        server.client.on(ERLCEvents.joinLog, (log) => {
            logs.push(`${log.playerUsername}:${log.joined}:${log.timestamp}`);
        });

        const raw = [
            { Join: true, Timestamp: 100, Player: 'Alex:1' },
            { Join: false, Timestamp: 101, Player: 'Alex:1' },
        ];

        server.joinLogs.updateCache(raw);
        server.joinLogs.updateCache(raw);

        expect(logs).toEqual(['Alex:true:100', 'Alex:false:101']);
        expect(server.joinLogs.cache.size).toBe(2);

        server.client.destroy();
    });

    it('evicts the oldest logs by timestamp regardless of insertion order', () => {
        const server = makeServer();
        const manager = new JoinLogManager(server, 2);

        manager.updateCache([
            { Join: true, Timestamp: 300, Player: 'Alex:1' },
            { Join: true, Timestamp: 100, Player: 'Bob:2' },
            { Join: false, Timestamp: 200, Player: 'Alex:1' },
        ]);

        expect(manager.cache.size).toBe(2);
        expect(Array.from(manager.cache.values()).map((log) => log.timestamp).sort()).toEqual([200, 300]);

        server.client.destroy();
    });

    it('fetches join logs with the documented query parameter', async () => {
        const server = makeServer();
        const request = vi.spyOn(server.rest, 'request').mockResolvedValue({
            JoinLogs: [{ Join: true, Timestamp: 1, Player: 'Alex:1' }],
        });

        const logs = await server.joinLogs.fetchAll();

        expect(request).toHaveBeenCalledWith('GET', '/v2/server?JoinLogs=true');
        expect(logs.size).toBe(1);

        server.client.destroy();
    });
});
