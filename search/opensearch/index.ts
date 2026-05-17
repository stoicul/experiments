import { Client } from '@opensearch-project/opensearch';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const STATS_FILE = process.env.STATS_FILE ?? 'data/statistics.json';
const INDEX_NAME = 'events';

interface BenchmarkStats {
    import: {
        totalRowsInserted: number;
        timeMs: number;
        memoryMb: number;
    };
    queries: Array<{
        name: string;
        timeMs: number;
        memoryMb: number;
        resultCount: number;
    }>;
}

const stats: BenchmarkStats = {
    import: { totalRowsInserted: 0, timeMs: 0, memoryMb: 0 },
    queries: []
};

function parseArgs() {
    const args = process.argv.slice(2);
    let targetRows = parseInt(process.env.TARGET_ROWS ?? '2000000', 10); // Default to 2M for OpenSearch locally
    let batchSize = parseInt(process.env.BATCH_SIZE ?? '5000', 10);
    let forceImport = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--rows' && i + 1 < args.length) {
            targetRows = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === '--batch' && i + 1 < args.length) {
            batchSize = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === '--force-import') {
            forceImport = true;
        }
    }
    return { targetRows, batchSize, forceImport };
}

const { targetRows: TARGET_ROWS, batchSize: BATCH_SIZE, forceImport: FORCE_IMPORT } = parseArgs();

const client = new Client({
    node: `http://${process.env.OPENSEARCH_HOST ?? 'localhost'}:${process.env.OPENSEARCH_PORT ?? '9200'}`,
});

async function waitForOpenSearch() {
    console.log('Waiting for OpenSearch to be ready...');
    let attempts = 0;
    while (attempts < 30) {
        try {
            await client.info();
            console.log('OpenSearch is ready!');
            return;
        } catch (e) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error('OpenSearch did not become ready in time');
}

async function setupIndex() {
    try {
        console.log(`Checking if index exists: ${INDEX_NAME}`);
        const existsRes = await client.indices.exists({ index: INDEX_NAME }) as any;
        // In v2/v3, exists returns a boolean or a response with a body that is a boolean
        const exists = typeof existsRes === 'boolean' ? existsRes : existsRes.body;
        console.log(`Index exists: ${exists}`);
        
        if (exists && FORCE_IMPORT) {
            console.log(`Deleting existing index: ${INDEX_NAME}`);
            await client.indices.delete({ index: INDEX_NAME });
        }

        if (!exists || FORCE_IMPORT) {
            console.log(`Creating index: ${INDEX_NAME}`);
            await client.indices.create({
                index: INDEX_NAME,
                body: {
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 0,
                        refresh_interval: '-1'
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            label: { 
                                type: 'text',
                                fields: {
                                    keyword: { type: 'keyword', ignore_above: 256 }
                                }
                            },
                            label_unindexed: { type: 'keyword', index: false }
                        }
                    }
                }
            });
        }
    } catch (e: any) {
        console.error('Error in setupIndex:', JSON.stringify(e, null, 2));
        throw e;
    }
}

async function generateData() {
    try {
        const startImportTime = performance.now();
        
        console.log('Counting existing documents...');
        const countRes = await client.count({ index: INDEX_NAME }) as any;
        const currentRowCount = countRes.count ?? countRes.body?.count ?? 0;
        console.log(`Current row count: ${currentRowCount}`);

        if (currentRowCount < TARGET_ROWS) {
            const rowsToInsert = TARGET_ROWS - currentRowCount;
            console.log(`Inserting ${rowsToInsert.toLocaleString()} rows...`);

        const numBatches = Math.ceil(rowsToInsert / BATCH_SIZE);
        const startTime = performance.now();

        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(BATCH_SIZE, rowsToInsert - batch * BATCH_SIZE);
            const offset = currentRowCount + batch * BATCH_SIZE;
            
            const body = [];
            for (let i = 0; i < currentBatchSize; i++) {
                const id = `evt_${offset + i}`;
                const complexString = `[INFO] System log entry - module-xyz-${(offset + i) % 100} processed request ${offset + i} with status code 200. Message details: User authentication successful for session ${(offset + i) % 5000}.`;
                body.push({ index: { _index: INDEX_NAME, _id: id } });
                body.push({
                    id,
                    label: complexString,
                    label_unindexed: complexString
                });
            }

            await client.bulk({ body });

            if ((batch + 1) % 10 === 0 || batch === numBatches - 1) {
                const elapsed = (performance.now() - startTime) / 1000;
                const rowsDone = (batch + 1) * BATCH_SIZE;
                const rate = rowsDone / elapsed;
                console.log(`Inserted ${Math.min(rowsDone, rowsToInsert).toLocaleString()} / ${rowsToInsert.toLocaleString()} rows... (${Math.round(rate).toLocaleString()} rows/sec)`);
            }
        }
        
        console.log('Enabling refresh and flushing...');
        await client.indices.putSettings({
            index: INDEX_NAME,
            body: { refresh_interval: '1s' }
        });
        await client.indices.refresh({ index: INDEX_NAME });
        console.log('Data generation complete.');
        }

        stats.import.timeMs = performance.now() - startImportTime;
        stats.import.memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
        stats.import.totalRowsInserted = TARGET_ROWS;
    } catch (e: any) {
        console.error('Error in generateData:', JSON.stringify(e, null, 2));
        throw e;
    }
}

async function measureQuery(name: string, query: any) {
    console.log(`\n${name}`);
    const start = performance.now();
    const result = await client.search({
        index: INDEX_NAME,
        body: query,
        size: 0,
        track_total_hits: true
    }) as any;
    const end = performance.now();
    const timeMs = end - start;
    const memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const total = result.hits?.total;
    const count = typeof total === 'number' ? total : (total?.value ?? 0);
    console.log(`Result: { count: ${count} }`);
    console.log(`Time: ${timeMs.toFixed(2)} ms`);
    console.log(`Memory: ${memoryMb.toFixed(2)} MB`);
    
    stats.queries.push({ name, timeMs, memoryMb, resultCount: count });
}

async function runTests() {
    console.log('\n--- Running Search Tests ---');

    // Note: OpenSearch doesn't have a direct "LIKE" equivalent that is exactly like SQL, 
    // but 'wildcard' or 'match_phrase' are comparable for benchmarking.
    
    console.log('\n--- Testing Full Text / Wildcard searches ---');

    await measureQuery('Test 1: Prefix search (Starts with) - label', {
        query: { prefix: { "label.keyword": "[INFO] System log entry - module-xyz-50" } }
    });

    await measureQuery('Test 2: Match Phrase (Contains Common) - label', {
        query: { match_phrase: { label: "status code 200" } }
    });

    await measureQuery('Test 3: Match Phrase (Contains Frequent) - label', {
        query: { match_phrase: { label: "module-xyz-50 p" } }
    });

    await measureQuery('Test 4: Match Phrase (Contains Rare) - label', {
        query: { match_phrase: { label: "request 42 with" } }
    });

    console.log('\n--- Testing Wildcard searches (more expensive) ---');

    await measureQuery('Test 5: Wildcard search (Contains Common) - label', {
        query: { wildcard: { "label.keyword": "*status code 200*" } }
    });

    await measureQuery('Test 6: Wildcard search (Contains Rare) - label', {
        query: { wildcard: { "label.keyword": "*request 42 with*" } }
    });
}

async function main() {
    try {
        await waitForOpenSearch();
        await setupIndex();
        await generateData();
        await runTests();
        
        mkdirSync(dirname(STATS_FILE), { recursive: true });
        writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
        console.log(`\nStatistics saved to ${STATS_FILE}`);
    } catch (error) {
        console.error('Benchmark failed:', error);
        process.exit(1);
    }
}

main();
