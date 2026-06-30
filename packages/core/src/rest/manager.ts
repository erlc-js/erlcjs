import { type ClientOptions } from '../types/index.js';
import { InvalidServerKeyError } from '../errors/index.js';

/**
 * Handles communication with the ER:LC HTTP API, managing rate limits and request queuing.
 * @public
 */
export class RestManager {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private rateLimitReset = 0;
    private baseUrl = 'https://api.erlc.gg';

    /**
     * Creates an instance of RestManager.
     * @param options - The ClientOptions configuration.
     */
    constructor(private options: ClientOptions) {}

    /**
     * Enqueues and sends an HTTP request to the ER:LC API.
     * @param method - The HTTP method to use ('GET' or 'POST').
     * @param endpoint - The API endpoint path.
     * @param body - The optional request body payload.
     * @returns A promise resolving to the API response data.
     * @throws {@link InvalidServerKeyError} if the server API key is invalid (403).
     * @throws Error - for other HTTP error codes.
     */
    public async request(method: 'GET' | 'POST', endpoint: string, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    if (Date.now() < this.rateLimitReset) {
                        const waitTime = this.rateLimitReset - Date.now();
                        await new Promise((res) => setTimeout(res, waitTime));
                    }

                    const response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method,
                        headers: {
                            'Server-Key': this.options.serverKey,
                            'Content-Type': 'application/json',
                            ...(this.options.globalKey && {
                                Authorization: `Bearer ${this.options.globalKey}`,
                            }),
                        },
                        body: body ? JSON.stringify(body) : undefined,
                    });

                    const resetHeader = response.headers.get('x-ratelimit-reset');
                    if (resetHeader) {
                        this.rateLimitReset = Date.now() + parseInt(resetHeader) * 1000;
                    }

                    if (response.status === 403) {
                        throw new InvalidServerKeyError();
                    }

                    if (response.status === 429) {
                        this.queue.unshift(() =>
                            this.request(method, endpoint, body).then(resolve).catch(reject),
                        );
                        return;
                    }

                    if (!response.ok) {
                        throw new Error(
                            `[ERLC API Error] ${response.status}: ${response.statusText}`,
                        );
                    }

                    const data = await response.json();
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            });

            this.processQueue();
        });
    }

    /**
     * Processes the request queue sequentially.
     */
    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const executeTask = this.queue.shift();
            if (executeTask) await executeTask();
        }

        this.processing = false;
    }
}
