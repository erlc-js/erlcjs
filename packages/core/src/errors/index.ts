/**
 * Error thrown when an invalid ER:LC Server API Key is provided.
 * @public
 */
export class InvalidServerKeyError extends Error {
    /**
     * Creates an instance of InvalidServerKeyError.
     * @param message - The error message. Defaults to 'Invalid Server API Key.'.
     */
    constructor(message: string = 'Invalid Server API Key.') {
        super(message);
        this.name = 'InvalidServerKeyError';
    }
}
