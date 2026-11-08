import type { Server } from '../client/server.js';
import type { CommandResponse } from '../types/index.js';

/**
 * Manager responsible for executing custom console commands in the ER:LC server.
 * @public
 */
export class CommandManager {
    /**
     * Creates an instance of CommandManager.
     * @param server - The server this manager belongs to.
     */
    constructor(private readonly server: Server) {}

    /**
     * Executes a server command via the ER:LC API.
     * @param command - The full command string to execute (e.g. `:pm alex hello`).
     * @returns A promise resolving to the API command response.
     */
    public async execute(command: string): Promise<CommandResponse> {
        return this.server.rest.request('POST', '/v2/server/command', {
            command,
        });
    }
}
