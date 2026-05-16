import { Client } from 'pg';
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

function readPositiveIntegerEnv(name: string, defaultValue: number) {
    const rawValue = process.env[name];
    if (!rawValue) return defaultValue;
    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
    }
    return value;
}

const TARGET_ROWS = readPositiveIntegerEnv('TARGET_ROWS', 1_000_000);
const BATCH_SIZE = readPositiveIntegerEnv('BATCH_SIZE', 10_000);
const FORCE_IMPORT = process.env.FORCE_IMPORT === 'true';

async function generateDatabase() {
    const client = new Client();
    await client.connect();

    const startImportTime = performance.now();
    let rowsInserted = 0;

    console.log(`Connected to PostgreSQL`);
    console.log(`Target rows: ${TARGET_ROWS.toLocaleString()}`);
    console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);

    if (FORCE_IMPORT) {
        console.log("Force import specified. Dropping existing table...");
        await client.query('DROP TABLE IF EXISTS events');
    }

    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await client.query(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            label TEXT,
            label_unindexed TEXT
        )
    `);

    const countRes = await client.query('SELECT COUNT(*) as count FROM events');
    const currentRowCount = parseInt(countRes.rows[0].count, 10);
    console.log(`Current row count: ${currentRowCount}`);

    if (currentRowCount < TARGET_ROWS) {
        const rowsToInsert = TARGET_ROWS - currentRowCount;
        console.log(`Need to insert ${rowsToInsert.toLocaleString()} rows...`);

        const numBatches = Math.ceil(rowsToInsert / BATCH_SIZE);
        const startTime = performance.now();

        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(BATCH_SIZE, rowsToInsert - batch * BATCH_SIZE);
            const offset = currentRowCount + batch * BATCH_SIZE;

            const values: string[][] = [];
            for (let i = 0; i < currentBatchSize; i++) {
                const idx = offset + i;
                const complexString = `[INFO] System log entry - module-xyz-${idx % 100} processed request ${idx} with status code 200. Message details: User authentication successful for session ${idx % 5000}.`;
                values.push([`evt_${idx}`, complexString, complexString]);
            }

            // PostgreSQL bulk insert using unnest for performance
            const query = {
                text: 'INSERT INTO events (id, label, label_unindexed) SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[])',
                values: [
                    values.map(v => v[0]),
                    values.map(v => v[1]),
                    values.map(v => v[2])
                ]
            };
            await client.query(query);
            rowsInserted += currentBatchSize;

            if ((batch + 1) % 10 === 0 || batch === numBatches - 1) {
                const elapsed = (performance.now() - startTime) / 1000;
                const rowsDone = rowsInserted;
                const rate = rowsDone / elapsed;
                console.log(`Inserted ${rowsDone.toLocaleString()} / ${rowsToInsert.toLocaleString()} rows... (${Math.round(rate).toLocaleString()} rows/sec)`);
            }
        }
        console.log('Insert complete.');
    }

    console.log("Creating standard index on label (if not exists)...");
    // Use text_pattern_ops for better LIKE 'prefix%' support in non-C locales
    await client.query('CREATE INDEX IF NOT EXISTS idx_label ON events (label text_pattern_ops)');

    console.log("Creating GIN trigram index (if not exists)...");
    await client.query('CREATE INDEX IF NOT EXISTS idx_label_trgm ON events USING gin (label gin_trgm_ops)');

    stats.import.timeMs = performance.now() - startImportTime;
    stats.import.memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    stats.import.totalRowsInserted = rowsInserted;

    return client;
}

async function measureQuery(client: Client, name: string, sql: string, params: any[]) {
    console.log(`\n${name}`);
    const start = performance.now();
    const res = await client.query(`SELECT COUNT(*) as count FROM (${sql}) as sub`, params);
    const end = performance.now();
    const timeMs = end - start;
    const memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    const count = parseInt(res.rows[0].count, 10);

    console.log(`Result count: ${count}`);
    console.log(`Time: ${timeMs.toFixed(2)} ms`);
    console.log(`Memory: ${memoryMb.toFixed(2)} MB`);

    stats.queries.push({ name, timeMs, memoryMb, resultCount: count });
}

async function runTests(client: Client) {
    console.log('\n--- Running Search Tests ---');

    console.log('\n--- Testing UNINDEXED field (Full Table Scan) ---');
    await measureQuery(client, 'Test 1: LIKE search (Starts with, No Index) - label_unindexed', 
        'SELECT id FROM events WHERE label_unindexed LIKE $1', ['[INFO] System log entry - module-xyz-50%']);

    await measureQuery(client, 'Test 2: LIKE search (Contains Common, No Index) - label_unindexed', 
        'SELECT id FROM events WHERE label_unindexed LIKE $1', ['%status code 200%']);

    await measureQuery(client, 'Test 3: LIKE search (Contains Rare, No Index) - label_unindexed', 
        'SELECT id FROM events WHERE label_unindexed LIKE $1', ['%request 42 %']);

    console.log('\n--- Testing INDEXED field (B-Tree Index) ---');
    await measureQuery(client, 'Test 4: LIKE search (Starts with, Indexed) - label', 
        'SELECT id FROM events WHERE label LIKE $1', ['[INFO] System log entry - module-xyz-50%']);

    console.log('\n--- Testing GIN TRIGRAM INDEX field ---');
    await measureQuery(client, 'Test 5: LIKE search (Contains Common, Trigram) - label', 
        'SELECT id FROM events WHERE label LIKE $1', ['%status code 200%']);

    await measureQuery(client, 'Test 6: LIKE search (Contains Rare, Trigram) - label', 
        'SELECT id FROM events WHERE label LIKE $1', ['%request 42 %']);
        
    await measureQuery(client, 'Test 7: ILIKE search (Case Insensitive, Trigram) - label', 
        'SELECT id FROM events WHERE label ILIKE $1', ['%STATUS CODE 200%']);

    await client.end();
}

async function main() {
    try {
        const client = await generateDatabase();
        await runTests(client);

        mkdirSync(dirname(STATS_FILE), { recursive: true });
        writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
        console.log(`\nStatistics saved to ${STATS_FILE}`);
    } catch (err) {
        console.error('Benchmark failed:', err);
        process.exit(1);
    }
}

main();
