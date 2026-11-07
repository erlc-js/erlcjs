import { afterEach, describe, expect, it, vi } from 'vitest';
import { Client } from './client.js';

afterEach(() => {
    vi.useRealTimers();
});

describe('Server polling', () => {
    it('does not start overlapping loops when restarted during the first poll', async () => {
        vi.useFakeTimers();
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        const poll = vi.spyOn(server as any, 'poll').mockResolvedValue(undefined);

        server.startPolling(1000);
        server.startPolling(1000);
        await vi.advanceTimersByTimeAsync(0);
        expect(poll).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(1000);
        expect(poll).toHaveBeenCalledTimes(3);

        server.stopPolling();
        await vi.advanceTimersByTimeAsync(5000);
        expect(poll).toHaveBeenCalledTimes(3);

        client.destroy();
    });
});
