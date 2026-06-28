import { Client } from "../client/client.js";

export class CommandManager {
    constructor(private readonly client: Client) {};

    public async execute(command: string): Promise<string> {
        const res: string = await this.client.rest.request('POST', '/v2/server/command', { command });

        return res;
    }
}