import { Client } from '../client/client.js';

export class Base {
    constructor(public readonly client: Client) {}
}