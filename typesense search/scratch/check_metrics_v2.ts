import { Client } from 'typesense';

const client = new Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST ?? 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT ?? '8108', 10),
        protocol: 'http'
    }],
    apiKey: process.env.TYPESENSE_API_KEY ?? 'test-api-key'
});

async function check() {
    try {
        // @ts-ignore
        const metrics = await client.metrics.retrieve();
        console.log('Metrics:', JSON.stringify(metrics, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
