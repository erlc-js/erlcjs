import { type ClientOptions } from "../types/index.js";

export class RestManager {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private rateLimitReset = 0;
    private baseUrl = 'https://api.erlc.gg';

    constructor(private options: ClientOptions) {};

    public async request(method: 'GET' | 'POST', endpoint: string, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    if (Date.now() < this.rateLimitReset) {
                        const waitTime = this.rateLimitReset - Date.now();
                        await new Promise(res => setTimeout(res, waitTime));
                    }

                    const response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method,
                        headers: {
                            'Server-Key': this.options.serverKey,
                            'Content-Type': 'application/json',
                            ...(this.options.globalKey && { 'Authorization': `Bearer ${this.options.globalKey}` })
                        },
                        body: body ? JSON.stringify(body) : undefined
                    });

                    const resetHeader = response.headers.get('x-ratelimit-reset');
                    if (resetHeader) {
                        this.rateLimitReset = Date.now() + (parseInt(resetHeader) * 1000);
                    }

                    if (response.status === 429) {
                        this.queue.unshift(() => this.request(method, endpoint, body).then(resolve).catch(reject));
                        return;
                    }

                    if (!response.ok) {
                        throw new Error(`[ERLC API Error] ${response.status}: ${response.statusText}`);
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