import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';
import { ERLCEvents } from '../client/events.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

function rawCall(overrides: Record<string, unknown> = {}) {
    return {
        Team: 'Police',
        Caller: 1,
        Players: [1],
        Position: [10, 20],
        StartedAt: 100,
        CallNumber: 42,
        Description: 'Officer needs backup',
        PositionDescriptor: 'Mission Row',
        ...overrides,
    };
}

describe('EmergencyCallManager', () => {
    it('only emits updates when call data actually changes', () => {
        const server = makeServer();
        const client = server.client;
        const added: number[] = [];
        const updated: number[] = [];
        const removed: number[] = [];

        client.on(ERLCEvents.emergencyCallAdd, (call) => added.push(call.callNumber));
        client.on(ERLCEvents.emergencyCallUpdate, (_old, next) => updated.push(next.playerIds.length));
        client.on(ERLCEvents.emergencyCallRemove, (call) => removed.push(call.callNumber));

        server.emergencyCalls.updateCache([rawCall()]);
        server.emergencyCalls.updateCache([rawCall()]);
        expect(added).toEqual([42]);
        expect(updated).toEqual([]);

        server.emergencyCalls.updateCache([rawCall({ Players: [1, 2] })]);
        expect(updated).toEqual([2]);

        server.emergencyCalls.updateCache([]);
        expect(removed).toEqual([42]);

        client.destroy();
    });

    it('handles camelCase and PascalCase webhook call payloads', () => {
        const server = makeServer();
        const client = server.client;
        const added: number[] = [];
        const removed: number[] = [];

        client.on(ERLCEvents.emergencyCallAdd, (call) => added.push(call.callNumber));
        client.on(ERLCEvents.emergencyCallRemove, (call) => removed.push(call.callNumber));

        const camelCaseCall = {
            team: 'Police',
            caller: 1,
            players: [1],
            position: [10, 20],
            startedAt: 100,
            callNumber: 7,
            description: 'Officer needs backup',
            positionDescriptor: 'Mission Row',
        };

        server.emergencyCalls.addCall(camelCaseCall as any);
        expect(added).toEqual([7]);

        server.emergencyCalls.addCall(camelCaseCall as any);
        expect(added).toEqual([7]);

        server.emergencyCalls.removeCall({
            Team: 'Police',
            Caller: 1,
            Players: [1],
            Position: [10, 20],
            StartedAt: 100,
            CallNumber: 7,
            Description: 'Officer needs backup',
            PositionDescriptor: 'Mission Row',
        } as any);
        expect(removed).toEqual([7]);

        client.destroy();
    });
});
