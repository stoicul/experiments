import { Client } from 'typesense';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const STATS_FILE = process.env.STATS_FILE ?? 'data/statistics.json';

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
    let targetRows = readPositiveIntegerEnv('TARGET_ROWS', 8_000_000);
    let batchSize = readPositiveIntegerEnv('BATCH_SIZE', 10_000); // Typesense imports are typically batched much smaller than SQLite
    let forceImport = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--rows' && i + 1 < args.length) {
            const val = parseInt(args[i + 1], 10);
            if (!Number.isFinite(val) || val <= 0) throw new Error(`--rows must be a positive integer`);
            targetRows = val;
            i++;
        } else if (args[i] === '--batch' && i + 1 < args.length) {
            const val = parseInt(args[i + 1], 10);
            if (!Number.isFinite(val) || val <= 0) throw new Error(`--batch must be a positive integer`);
            batchSize = val;
            i++;
        } else if (args[i] === '--force-import') {
            forceImport = true;
        }
    }
    return { targetRows, batchSize, forceImport };
}

const { targetRows: TARGET_ROWS, batchSize: BATCH_SIZE, forceImport: FORCE_IMPORT } = parseArgs();

function readPositiveIntegerEnv(name: string, defaultValue: number) {
    const rawValue = process.env[name];
    if (!rawValue) return defaultValue;
    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
    return value;
}

const client = new Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST ?? 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT ?? '8108', 10),
        protocol: 'http'
    }],
    apiKey: process.env.TYPESENSE_API_KEY ?? 'test-api-key',
    connectionTimeoutSeconds: 300, // allow up to 5 minutes for massive batches
    retryIntervalSeconds: 5,
    numRetries: 60 // wait up to 5 minutes for db to become ready
});

async function generateDatabase() {
    const startImportTime = performance.now();
    let rowsInserted = 0;

    mkdirSync(dirname(STATS_FILE), { recursive: true });

    console.log(`Target rows: ${TARGET_ROWS.toLocaleString()}`);
    console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);

    // Check if collection exists
    let collectionExists = false;
    try {
        await client.collections('events').retrieve();
        collectionExists = true;
    } catch (e) {
        // Collection doesn't exist
    }

    if (collectionExists && FORCE_IMPORT) {
        console.log("Force import specified. Deleting existing collection...");
        await client.collections('events').delete();
        collectionExists = false;
    }

    if (!collectionExists) {
        console.log("Creating collection 'events'...");
        await client.collections().create({
            name: 'events',
            enable_nested_fields: false,
            fields: [
                { name: 'id', type: 'string' },
                { name: 'label', type: 'string', infix: true },
                { name: 'label_unindexed', type: 'string', index: false },
                { name: 'level', type: 'string', facet: true },
                { name: 'module', type: 'string', facet: true },
                { name: 'status_code', type: 'int32', facet: true },
                { name: 'timestamp', type: 'int64' },
                { name: 'tags', type: 'string[]', facet: true },
                { name: 'message', type: 'string', infix: true }
            ]
        });
    }

    // Get current count
    const searchResult = await client.collections('events').documents().search({ q: '*', per_page: 0 });
    const currentRowCount = searchResult.found;
    console.log(`Current row count: ${currentRowCount}`);

    if (currentRowCount < TARGET_ROWS) {
        const rowsToInsert = TARGET_ROWS - currentRowCount;
        console.log(`Need to insert ${rowsToInsert} rows...`);

        const numBatches = Math.ceil(rowsToInsert / BATCH_SIZE);
        const startTime = performance.now();

        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(BATCH_SIZE, rowsToInsert - batch * BATCH_SIZE);
            const offset = currentRowCount + batch * BATCH_SIZE;

            const documents = [];
            for (let i = 0; i < currentBatchSize; i++) {
                const idx = offset + i;
                const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE'];
                const level = levels[idx % levels.length];
                const module = `module-xyz-${idx % 100}`;
                const statusCode = [200, 201, 400, 401, 403, 404, 500, 502, 503][idx % 9];
                const timestamp = Date.now() - (idx * 1000);
                const tags = [`tag${idx % 10}`, `env-${idx % 3 === 0 ? 'prod' : 'dev'}`, `region-${idx % 5}`];

                const message = `System log entry - ${module} processed request ${idx} with status code ${statusCode}. Message details: User authentication ${idx % 2 === 0 ? 'successful' : 'failed'} for session ${idx % 5000}. Context: { "userId": "usr_${idx % 1000}", "action": "login", "ip": "192.168.${idx % 255}.${Math.floor((idx / 255) % 255)}" }`;
                const complexString = `[${level}] ${message}`;

                documents.push({
                    id: `evt_${idx}`,
                    label: complexString,
                    label_unindexed: complexString,
                    level,
                    module,
                    status_code: statusCode,
                    timestamp,
                    tags,
                    message
                });
            }

            try {
                await client.collections('events').documents().import(documents, { action: 'upsert' });
                rowsInserted += currentBatchSize;
            } catch (err) {
                console.error("Error importing batch", err);
                throw err;
            }

            if ((batch + 1) % 10 === 0 || batch === numBatches - 1) {
                const elapsed = (performance.now() - startTime) / 1000;
                const rate = rowsInserted / elapsed;
                console.log(`Inserted ${rowsInserted.toLocaleString()} / ${rowsToInsert.toLocaleString()} rows... (${Math.round(rate).toLocaleString()} rows/sec)`);
            }
        }
        console.log('Insert complete.');
    }

    stats.import.timeMs = performance.now() - startImportTime;
    stats.import.memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    stats.import.totalRowsInserted = rowsInserted;
}

async function measureQuery(name: string, fn: () => Promise<{ found: number }>) {
    console.log(`\n${name}`);
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const timeMs = end - start;
    const memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;

    console.log(`Result count:`, result.found);
    console.log(`Time: ${timeMs.toFixed(2)} ms`);
    console.log(`Memory: ${memoryMb.toFixed(2)} MB`);

    stats.queries.push({ name, timeMs, memoryMb, resultCount: result.found });
}

async function runTests() {
    console.log('\n--- Running Search Tests (TYPESENSE) ---');

    await measureQuery('Test 1: Prefix search (Indexed) - label', async () => {
        return await client.collections('events').documents().search({
            q: '[INFO] System log entry - module-xyz-50',
            query_by: 'label',
            prefix: true
        });
    });

    await measureQuery('Test 2: Contains search (Common, Infix) - label', async () => {
        return await client.collections('events').documents().search({
            q: 'status code 200',
            query_by: 'label',
            infix: 'always'
        });
    });

    await measureQuery('Test 3: Contains search (Frequent, Infix) - label', async () => {
        return await client.collections('events').documents().search({
            q: 'module-xyz-50 p',
            query_by: 'label',
            infix: 'always'
        });
    });

    await measureQuery('Test 4: Contains search (Rare, Infix) - label', async () => {
        return await client.collections('events').documents().search({
            q: 'request 42 with',
            query_by: 'label',
            infix: 'always'
        });
    });

    await measureQuery('Test 5: Facet Search - level and module', async () => {
        return await client.collections('events').documents().search({
            q: '*',
            query_by: 'label',
            facet_by: 'level,module'
        });
    });

    await measureQuery('Test 6: Filter Search - specific status code', async () => {
        return await client.collections('events').documents().search({
            q: '*',
            query_by: 'label',
            filter_by: 'status_code:>=400 && tags:env-prod'
        });
    });

    await measureQuery('Test 7: Multi-field Search - label, message', async () => {
        return await client.collections('events').documents().search({
            q: 'login failed',
            query_by: 'label,message',
            infix: 'always'
        });
    });
}

async function main() {
    await generateDatabase();
    await runTests();

    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    console.log(`\nStatistics saved to ${STATS_FILE}`);
}

main().catch(console.error);
