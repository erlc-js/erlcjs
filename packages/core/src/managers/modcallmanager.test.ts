import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

describe('ModCallManager', () => {
    it('emits modCallAnswered once even when the moderator is not cached', () => {
        const server = makeServer();
        let answered = 0;
        server.client.on(ERLCEvents.modCallAnswered, () => answered++);

        server.modCalls.updateCache([{ Caller: 'Alex:1', Timestamp: 1 }]);
        expect(answered).toBe(0);

        const answeredCall = { Caller: 'Alex:1', Moderator: 'Moderator:2', Timestamp: 1 };
        server.modCalls.updateCache([answeredCall]);
        expect(answered).toBe(1);

        server.modCalls.updateCache([answeredCall]);
        expect(answered).toBe(1);

        server.client.destroy();
    });

    it('clears moderator fields when a call no longer has a moderator', () => {
        const server = makeServer();
        let answered = 0;
        server.client.on(ERLCEvents.modCallAnswered, () => answered++);

        server.modCalls.updateCache([{ Caller: 'Alex:1', Moderator: 'Moderator:2', Timestamp: 3 }]);
        const call = server.modCalls.cache.values().next().value!;
        expect(call.moderatorId).toBe(2);

        server.modCalls.updateCache([{ Caller: 'Alex:1', Moderator: null, Timestamp: 3 }]);
        expect(call.moderatorId).toBeUndefined();
        expect(call.moderatorUsername).toBeUndefined();
        expect(call.moderator).toBeUndefined();
        expect(answered).toBe(1);

        server.client.destroy();
    });

    it('emits modCallAnswered for a call first seen with a moderator', () => {
        const server = makeServer();
        let answered = 0;
        server.client.on(ERLCEvents.modCallAnswered, () => answered++);

        server.modCalls.updateCache([
            { Caller: 'Alex:1', Moderator: 'Moderator:2', Timestamp: 2 },
        ]);
        expect(answered).toBe(1);

        server.modCalls.updateCache([
            { Caller: 'Alex:1', Moderator: 'Moderator:2', Timestamp: 2 },
        ]);
        expect(answered).toBe(1);

        server.client.destroy();
    });
});
