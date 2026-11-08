import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapType } from './enums.js';
import { fetchMap, fetchRobloxHeadshots } from './util.js';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('fetchMap', () => {
    it('throws when the API responds with an error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' }));

        await expect(fetchMap(MapType.fall)).rejects.toThrow('404: Not Found');
    });

    it('returns the response body when the request succeeds', async () => {
        const buffer = new ArrayBuffer(4);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            arrayBuffer: async () => buffer,
        }));

        await expect(fetchMap(MapType.fall)).resolves.toBe(buffer);
    });
});

describe('fetchRobloxHeadshots', () => {
    it('returns an empty map without calling the API for no users', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const headshots = await fetchRobloxHeadshots([]);

        expect(headshots.size).toBe(0);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ignores entries without an image url', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
                data: [
                    { targetId: 1, imageUrl: 'https://example.com/1.png' },
                    { targetId: 2, imageUrl: '' },
                ],
            }),
        }));

        const headshots = await fetchRobloxHeadshots([1, 2]);

        expect(headshots.get(1)).toBe('https://example.com/1.png');
        expect(headshots.has(2)).toBe(false);
    });
});
