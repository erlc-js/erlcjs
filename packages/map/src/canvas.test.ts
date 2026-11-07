import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { Client } from '@erlcjs/core';
import { drawMap } from './canvas.js';

afterEach(() => {
    vi.unstubAllGlobals();
});

function rawPlayer(name: string, id: number): any {
    return {
        Player: `${name}:${id}`,
        Permission: 'Normal',
        Team: 'Police',
        Callsign: '',
        Location: { LocationX: 100, LocationZ: 100, PostalCode: '0', StreetName: '', BuildingNumber: '' },
        WantedStars: 0,
    };
}

describe('drawMap', () => {
    it('still renders when a headshot cannot be downloaded', async () => {
        vi.stubGlobal('fetch', vi.fn(async (input: any) => {
            if (String(input).includes('thumbnails.roblox.com')) {
                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    json: async () => ({
                        data: [{ targetId: 1, imageUrl: 'https://example.com/headshot.png' }],
                    }),
                };
            }
            throw new Error('network failure');
        }));

        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        server.players.updateCache([rawPlayer('Alex', 1)]);
        const player = server.players.cache.get(1)!;

        const base = await sharp({
            create: { width: 200, height: 200, channels: 4, background: '#ffffff' },
        })
            .png()
            .toBuffer();

        const result = await drawMap({ players: [player], map: base, showModCalls: false });

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        client.destroy();
    });
});
