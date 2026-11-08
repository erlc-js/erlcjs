import { describe, expect, it } from 'vitest';
import {
    ERLCAPIError,
    MultipleServersUnauthenticatedError,
    NoPlayersInServerError,
    UnauthorizedError,
} from './index.js';

describe('errors', () => {
    it('keeps command ids on command errors for troubleshooting', () => {
        expect(new NoPlayersInServerError('no players', 'cmd_123').commandId).toBe('cmd_123');
        expect(new ERLCAPIError('request failed', 'cmd_456').commandId).toBe('cmd_456');
    });

    it('links UnauthorizedError to the current docs route', () => {
        expect(new UnauthorizedError().message).toContain(
            'https://erlcjs.xyz/docs/api/core/unauthorizederror/',
        );
    });

    it('identifies the multi-server authentication error', () => {
        expect(new MultipleServersUnauthenticatedError().name).toBe(
            'MultipleServersUnauthenticatedError',
        );
    });
});
