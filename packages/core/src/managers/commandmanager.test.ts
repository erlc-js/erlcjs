import { describe, expect, it, vi } from 'vitest';
import { Client } from '../client/client.js';

describe('CommandManager', () => {
    it('returns the API command response instead of pretending it is a string', async () => {
        const client = new Client({ servers: ['PRC-111111111-key'] });
        const server = client.servers.get('111111111')!;
        const response = { message: 'Command sent', commandId: 'cmd_123' };
        const request = vi.spyOn(server.rest, 'request').mockResolvedValue(response);

        await expect(server.commands.execute(':heal Alex')).resolves.toEqual(response);
        expect(request).toHaveBeenCalledWith('POST', '/v2/server/command', {
            command: ':heal Alex',
        });

        client.destroy();
    });
});
