import { describe, expect, it } from 'vitest';
import { Client } from '../client/client.js';
import { ServerInfo } from './serverinfo.js';

function makeServer() {
    const client = new Client({ servers: ['PRC-111111111-key'] });
    return client.servers.get('111111111')!;
}

function rawServerData(overrides: Record<string, unknown> = {}) {
    return {
        Name: 'Test Server',
        OwnerId: 1,
        CoOwnerIds: [],
        CurrentPlayers: 2,
        MaxPlayers: 10,
        JoinKey: 'abc',
        AccVerifiedReq: 'Disabled',
        TeamBalance: false,
        ...overrides,
    };
}

describe('ServerInfo', () => {
    it('treats missing optional queue and co-owner fields as empty', () => {
        const server = makeServer();
        const raw = rawServerData({ CoOwnerIds: undefined, Queue: undefined });
        const info = new ServerInfo(server, raw as any);

        expect(info.queue).toEqual([]);
        expect(info.compare(raw as any)).toBe(true);
        server.client.destroy();
    });

    it('detects queue changes', () => {
        const server = makeServer();
        const info = new ServerInfo(server, rawServerData() as any);

        expect(info.compare(rawServerData({ Queue: [123] }) as any)).toBe(false);
        server.client.destroy();
    });
});
