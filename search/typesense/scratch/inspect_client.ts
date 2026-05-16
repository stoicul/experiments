import { Client } from 'typesense';

const client = new Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST ?? 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT ?? '8108', 10),
        protocol: 'http'
    }],
    apiKey: process.env.TYPESENSE_API_KEY ?? 'test-api-key'
});

console.log('Client keys:', Object.keys(client));
// @ts-ignore
if (client._apiCall) {
    // @ts-ignore
    console.log('client._apiCall keys:', Object.keys(client._apiCall));
}
