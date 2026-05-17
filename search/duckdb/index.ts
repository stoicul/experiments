import { DuckDBInstance } from '@duckdb/node-api';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

const STATS_FILE = process.env.STATS_FILE ?? 'data/statistics.json';
const DB_FILE = process.env.DB_FILE ?? 'data/events.duckdb';

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
    let targetRows = readPositiveIntegerEnv('TARGET_ROWS', 2_000_000);
    let batchSize = readPositiveIntegerEnv('BATCH_SIZE', 100_000);
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

function readPositiveIntegerEnv(name: string, defaultValue: number) {
    const rawValue = process.env[name];
    if (!rawValue) return defaultValue;
    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
    return value;
}

const { targetRows: TARGET_ROWS, batchSize: BATCH_SIZE, forceImport: FORCE_IMPORT } = parseArgs();

async function generateDatabase() {
    const startImportTime = performance.now();
    let rowsInserted = 0;
    console.log(`Opening DuckDB: ${DB_FILE}`);
    console.log(`Target rows: ${TARGET_ROWS.toLocaleString()}`);
    console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);
    mkdirSync(dirname(DB_FILE), { recursive: true });

    if (FORCE_IMPORT) {
        console.log("Force import specified. Deleting existing database...");
        try {
            if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
            // Delete wal file if it exists (usually events.duckdb.wal)
            const walFile = `${DB_FILE}.wal`;
            if (existsSync(walFile)) unlinkSync(walFile);
        } catch (e) {
            console.error("Could not delete existing DB files:", e);
        }
    }

    const instance = await DuckDBInstance.create(DB_FILE);
    const connection = await instance.connect();

    console.log("Installing and loading FTS extension...");
    await connection.run("INSTALL fts; LOAD fts;");

    console.log("Creating table if it doesn't exist...");
    await connection.run(`
        CREATE TABLE IF NOT EXISTS events (
            id VARCHAR PRIMARY KEY,
            label VARCHAR,
            label_unindexed VARCHAR
        )
    `);

    const countRes = await connection.runAndReadAll('SELECT COUNT(*) as count FROM events');
    const currentRowCount = Number(countRes.getRows()[0][0]);
    console.log(`Current row count: ${currentRowCount}`);

    if (currentRowCount === 0) {
        const rowsToInsert = TARGET_ROWS;
        console.log(`Need to insert ${rowsToInsert} rows...`);
        
        // Using the Appender for fast ingestion
        const appender = await connection.createAppender('events');
        
        const startTime = performance.now();
        const numBatches = Math.ceil(rowsToInsert / BATCH_SIZE);

        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(BATCH_SIZE, rowsToInsert - batch * BATCH_SIZE);
            const offset = batch * BATCH_SIZE;

            for (let i = 0; i < currentBatchSize; i++) {
                const id = `evt_${offset + i}`;
                const freqTag = (offset + i) % 100 === 50 ? 'TAG_FREQUENT' : 'TAG_COMMON';
                const rareTag = (offset + i) === 42 ? 'TAG_RARE' : '';
                const complexString = `[INFO] System log entry - module-xyz-${(offset + i) % 100} processed request ${offset + i} with status code 200. Message details: User authentication successful for session ${(offset + i) % 5000}. ${freqTag} ${rareTag}`;
                
                appender.appendVarchar(id);
                appender.appendVarchar(complexString);
                appender.appendVarchar(complexString);
                appender.endRow();
            }

            if ((batch + 1) % 10 === 0) {
                const elapsed = (performance.now() - startTime) / 1000;
                const rowsDone = (batch + 1) * BATCH_SIZE;
                const rate = rowsDone / elapsed;
                console.log(`Inserted ${rowsDone.toLocaleString()} / ${rowsToInsert.toLocaleString()} rows... (${Math.round(rate).toLocaleString()} rows/sec)`);
            }
        }
        
        appender.closeSync();
        rowsInserted = rowsToInsert;
        console.log('Insert complete.');
    }

    console.log("Creating index on label (if not exists)...");
    await connection.run('CREATE INDEX IF NOT EXISTS idx_label ON events(label)');

    console.log("Creating FTS index (if not exists)...");
    try {
        await connection.run("PRAGMA create_fts_index('events', 'id', 'label')");
        console.log('FTS index created.');
    } catch (e: any) {
        if (e.toString().includes('already exists')) {
            console.log('FTS index already exists.');
        } else {
            console.error('Error creating FTS index:', e);
        }
    }

    stats.import.timeMs = performance.now() - startImportTime;
    stats.import.memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    stats.import.totalRowsInserted = rowsInserted;

    return connection;
}

async function measureQuery(connection: any, name: string, sql: string, params: any[] = []) {
    console.log(`\n${name}`);
    const start = performance.now();
    
    // In @duckdb/node-api, runAndReadAll is preferred for small results
    const result = await connection.runAndReadAll(sql, params);
    
    const end = performance.now();
    const timeMs = end - start;
    const memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const rows = result.getRows();
    const count = Number(rows[0] ? rows[0][0] : 0);
    console.log(`Result count:`, count);
    console.log(`Time: ${timeMs.toFixed(2)} ms`);
    console.log(`Memory: ${memoryMb.toFixed(2)} MB`);
    
    stats.queries.push({ name, timeMs, memoryMb, resultCount: count });
}

async function runTests(connection: any) {
    console.log('\n--- Running Search Tests ---');

    console.log('\n--- Testing UNINDEXED field (Columnar Scan) ---');
    await measureQuery(connection, 'Test 1: LIKE search (Starts with, No Index) - label_unindexed', 
        'SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?', ['[INFO] System log entry - module-xyz-50%']);

    await measureQuery(connection, 'Test 2: LIKE search (Contains Common, No Index) - label_unindexed', 
        'SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?', ['%TAG_COMMON%']);

    await measureQuery(connection, 'Test 3: LIKE search (Contains Frequent, No Index) - label_unindexed', 
        'SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?', ['%TAG_FREQUENT%']);

    await measureQuery(connection, 'Test 4: LIKE search (Contains Rare, No Index) - label_unindexed', 
        'SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?', ['%TAG_RARE%']);

    console.log('\n--- Testing INDEXED field (ART Index) ---');
    await measureQuery(connection, 'Test 5: LIKE search (Starts with, Indexed) - label', 
        'SELECT COUNT(*) as count FROM events WHERE label LIKE ?', ['[INFO] System log entry - module-xyz-50%']);

    await measureQuery(connection, 'Test 6: LIKE search (Contains Common, Indexed) - label', 
        'SELECT COUNT(*) as count FROM events WHERE label LIKE ?', ['%TAG_COMMON%']);

    console.log('\n--- Testing FTS INDEX field (match_bm25) ---');
    // FTS query needs to handle the score being returned
    await measureQuery(connection, 'Test 7: FTS search (Contains Common) - label', 
        "SELECT COUNT(*) as count FROM (SELECT fts_main_events.match_bm25(id, 'TAG_COMMON', conjunctive := 1) as score FROM events) WHERE score IS NOT NULL");

    await measureQuery(connection, 'Test 8: FTS search (Contains Frequent) - label', 
        "SELECT COUNT(*) as count FROM (SELECT fts_main_events.match_bm25(id, 'TAG_FREQUENT', conjunctive := 1) as score FROM events) WHERE score IS NOT NULL");

    await measureQuery(connection, 'Test 9: FTS search (Contains Rare) - label', 
        "SELECT COUNT(*) as count FROM (SELECT fts_main_events.match_bm25(id, 'TAG_RARE', conjunctive := 1) as score FROM events) WHERE score IS NOT NULL");
}

async function main() {
    try {
        const connection = await generateDatabase();
        await runTests(connection);
        
        writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
        console.log(`\nStatistics saved to ${STATS_FILE}`);
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

main();
