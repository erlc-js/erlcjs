import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';
import { CommandLogManager } from './commandlogmanager.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

describe('CommandLogManager', () => {
    it('keeps distinct commands a player runs within the same second', () => {
        const server = makeServer();
        const commands: string[] = [];
        server.client.on(ERLCEvents.command, (log) => commands.push(log.command));

        server.commandLogs.updateCache([
            { Player: 'Alex:1', Timestamp: 100, Command: ':admin Bob' },
            { Player: 'Alex:1', Timestamp: 100, Command: ':mod Bob' },
        ]);

        expect(commands).toEqual([':admin Bob', ':mod Bob']);
        expect(server.commandLogs.cache.size).toBe(2);

        server.client.destroy();
    });

    it('evicts the oldest logs by timestamp regardless of insertion order', () => {
        const server = makeServer();
        const manager = new CommandLogManager(server, 2);

        manager.updateCache([
            { Player: 'Alex:1', Timestamp: 3, Command: ':newest' },
            { Player: 'Alex:1', Timestamp: 1, Command: ':oldest' },
            { Player: 'Alex:1', Timestamp: 2, Command: ':middle' },
        ]);

        const timestamps = Array.from(manager.cache.values()).map((log) => log.timestamp);
        expect(timestamps.sort()).toEqual([2, 3]);
        server.client.destroy();
    });
});
