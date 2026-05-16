import { Client } from 'typesense';

const client = new Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST ?? 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT ?? '8108', 10),
        protocol: 'http'
    }],
    apiKey: process.env.TYPESENSE_API_KEY ?? 'test-api-key',
    connectionTimeoutSeconds: 300
});

async function check() {
    try {
        const metrics = await client.request.get('/metrics.json');
        console.log(JSON.stringify(metrics, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
