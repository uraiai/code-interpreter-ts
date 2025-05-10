import { EventSource } from "eventsource";
import fetch from 'node-fetch';

export class ThiriClient {
    apiKey: string;
    thiriBaseUrl: string;
    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.thiriBaseUrl = process.env.THIRI_API_BASE || 'https://admin.thiri.dev/api';
    }
    urlFor(path: string) {
        return `${this.thiriBaseUrl}${path}`;
    }
    // This method is kept for API compatibility but not used internally
    async makeRequest(path: string, options: fetch.RequestInit = {}) {
        const url = this.urlFor(path);
        console.log(`Making request to ${url} with options: ${JSON.stringify(options)}`);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'X-THIRI-KEY': this.apiKey,
                    ...(options.headers as Record<string, string>),
                }
            });
            
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error making request to ${url}:`, error);
            throw error;
        }
    }
    async createSandbox() {
        console.log("Creating sandbox");
        const response = await fetch(this.urlFor('/vms'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-THIRI-KEY': this.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create sandbox: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`Sandbox creation response: ${JSON.stringify(result)}`);
        console.log(`Sandbox created with ID: ${result.id}`);
        
        // Wait a moment for the sandbox to initialize
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
        
        return new Sandbox(result.id, this);
    }
}

export class Sandbox {
    id: string
    client: ThiriClient
    execution: Execution | null = null;
    constructor(id: string, client: ThiriClient) {
        this.id = id;
        this.client = client;
    }
    // run code in the sandbox
    async runCode(code: string) {
        let code64 = Buffer.from(code).toString('base64');
        
        const response = await fetch(this.client.urlFor(`/vms/${this.id}/gateway/execute`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-THIRI-KEY': this.client.apiKey
            },
            body: JSON.stringify({
                code: code64
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to run code: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Execution data: ${JSON.stringify(data)}`);

        // Handle SSE for stdout and std err
        const execution = new Execution(data.execution_id, this);
        this.execution = execution;
        try {
            const es = new EventSource(this.client.urlFor(`/vms/${this.id}/gateway/executions/${data.execution_id}/events`));
            es.addEventListener('stdout', (event) => {
                this.execution?.logs.stdout.push(event.data);
            });
            es.addEventListener('stderr', (event) => {
                this.execution?.logs.stderr.push(event.data);
            });
        } catch (error) {
            console.error("Error setting up event source:", error);
        }
        return execution;
    }
}

type Logs = {
    stdout: string[];
    stderr: string[];
}

export class Execution {
    public logs: Logs;
    public id: string;
    public sandbox: Sandbox;
    constructor(id: string, sandbox: Sandbox) {
        this.id = id
        this.sandbox = sandbox;
        this.logs = {
            stdout: [],
            stderr: []
        }
    }

    // Returns file content as base64
    public async downloadFile(path: string) {
        const url = this.sandbox.client.urlFor(`/vms/${this.sandbox.id}/gateway/executions/${this.id}/download/${path}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-THIRI-KEY': this.sandbox.client.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        
        const respContent = await response.json();
        return respContent.content;
    }

}
