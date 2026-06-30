import { Client } from '../client/client.js';

/**
 * Represents the base class for all ER:LC structures.
 * @public
 */
export class Base {
    /**
     * Creates an instance of the Base class.
     * @param client - The ERLCApi client instance.
     */
    constructor(public readonly client: Client) {}
}
