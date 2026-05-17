import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
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

type SqliteDatabase = InstanceType<typeof Database>;

const DB_FILE = process.env.DB_FILE ?? 'data/events.db';

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

const { targetRows: TARGET_ROWS, batchSize: BATCH_SIZE, forceImport: FORCE_IMPORT } = parseArgs();

function readPositiveIntegerEnv(name: string, defaultValue: number) {
    const rawValue = process.env[name];

    if (!rawValue) {
        return defaultValue;
    }

    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
    }

    return value;
}

function generateDatabase() {
    const startImportTime = performance.now();
    let rowsInserted = 0;
    console.log(`Opening database: ${DB_FILE}`);
    console.log(`Target rows: ${TARGET_ROWS.toLocaleString()}`);
    console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);
    mkdirSync(dirname(DB_FILE), { recursive: true });

    if (FORCE_IMPORT) {
        console.log("Force import specified. Deleting existing database...");
        try {
            if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
            if (existsSync(`${DB_FILE}-wal`)) unlinkSync(`${DB_FILE}-wal`);
            if (existsSync(`${DB_FILE}-shm`)) unlinkSync(`${DB_FILE}-shm`);
        } catch (e) {
            console.error("Could not delete existing DB files:", e);
        }
    }

    const db = new Database(DB_FILE);

    // Optimize settings for massive bulk inserts
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -20000');
    db.pragma('temp_store = MEMORY');

    console.log("Creating table if it doesn't exist...");
    db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            label TEXT,
            label_unindexed TEXT
        )
    `);

    const countRow = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
    const currentRowCount = countRow.count;
    console.log(`Current row count: ${currentRowCount}`);

    if (currentRowCount === 0) {
        const rowsToInsert = TARGET_ROWS;
        console.log(`Need to insert ${rowsToInsert} rows...`);
        rowsInserted += rowsToInsert;

        const insert = db.prepare('INSERT INTO events (id, label, label_unindexed) VALUES (?, ?, ?)');

        const insertMany = db.transaction((batchSize: number, offset: number) => {
            for (let i = 0; i < batchSize; i++) {
                const id = `evt_${offset + i}`;
                const complexString = `[INFO] System log entry - module-xyz-${(offset + i) % 100} processed request ${offset + i} with status code 200. Message details: User authentication successful for session ${(offset + i) % 5000}.`;
                insert.run(id, complexString, complexString);
            }
        });

        const numBatches = Math.ceil(rowsToInsert / BATCH_SIZE);
        const startTime = performance.now();

        for (let batch = 0; batch < numBatches; batch++) {
            const currentBatchSize = Math.min(BATCH_SIZE, rowsToInsert - batch * BATCH_SIZE);
            const offset = currentRowCount + batch * BATCH_SIZE;

            insertMany(currentBatchSize, offset);

            if ((batch + 1) % 10 === 0) {
                const elapsed = (performance.now() - startTime) / 1000;
                const rowsDone = (batch + 1) * BATCH_SIZE;
                const rate = rowsDone / elapsed;
                console.log(`Inserted ${rowsDone.toLocaleString()} / ${rowsToInsert.toLocaleString()} rows... (${Math.round(rate).toLocaleString()} rows/sec)`);
            }
        }
        console.log('Insert complete.');
    }

    console.log("Creating index on label (if not exists)...");
    db.exec('CREATE INDEX IF NOT EXISTS idx_label ON events(label COLLATE NOCASE)');

    console.log("Creating FTS Trigram index (if not exists)...");
    db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
            id UNINDEXED,
            label,
            label_unindexed UNINDEXED,
            tokenize='trigram'
        )
    `);

    // Sync existing data to FTS if needed
    const finalRowCount = (db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }).count;
    const countFtsRow = db.prepare('SELECT COUNT(*) as count FROM events_fts').get() as { count: number };
    if (countFtsRow.count < finalRowCount) {
        console.log('Populating FTS trigram index from existing events (this may take a while)...');
        db.exec('INSERT INTO events_fts (id, label, label_unindexed) SELECT id, label, label_unindexed FROM events WHERE rowid > (SELECT IFNULL(MAX(rowid), 0) FROM events_fts)');
        console.log('FTS population complete.');
    }

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS after_event_insert
        AFTER INSERT ON events
        BEGIN
            INSERT INTO events_fts (id, label, label_unindexed)
            VALUES (new.id, new.label, new.label_unindexed);
        END;
    `);

    stats.import.timeMs = performance.now() - startImportTime;
    stats.import.memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    stats.import.totalRowsInserted = rowsInserted;

    return db;
}

function measureQuery(name: string, fn: () => { count: number }) {
    console.log(`\n${name}`);
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const timeMs = end - start;
    const memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    
    console.log(`Result:`, result);
    console.log(`Time: ${timeMs.toFixed(2)} ms`);
    console.log(`Memory: ${memoryMb.toFixed(2)} MB`);
    
    stats.queries.push({ name, timeMs, memoryMb, resultCount: result.count });
}

function runTests(db: SqliteDatabase) {
    console.log('\n--- Running Search Tests ---');

    console.log('\n--- Testing UNINDEXED field (Full Table Scan) ---');
    measureQuery('Test 1: LIKE search (Starts with, No Index) - label_unindexed', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?').get('[INFO] System log entry - module-xyz-50%') as { count: number };
    });

    measureQuery('Test 2: LIKE search (Contains Common, No Index) - label_unindexed', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?').get('%status code 200%') as { count: number };
    });

    measureQuery('Test 3: LIKE search (Contains Frequent, No Index) - label_unindexed', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?').get('%module-xyz-50 p%') as { count: number };
    });

    measureQuery('Test 4: LIKE search (Contains Rare, No Index) - label_unindexed', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label_unindexed LIKE ?').get('%request 42 with%') as { count: number };
    });

    console.log('\n--- Testing INDEXED field (B-Tree Index) ---');
    measureQuery('Test 5: LIKE search (Starts with, Indexed) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?').get('[INFO] System log entry - module-xyz-50%') as { count: number };
    });

    measureQuery('Test 6: LIKE search (Contains Common, Indexed) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?').get('%status code 200%') as { count: number };
    });

    measureQuery('Test 7: LIKE search (Contains Frequent, Indexed) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?').get('%module-xyz-50 p%') as { count: number };
    });

    measureQuery('Test 8: LIKE search (Contains Rare, Indexed) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?').get('%request 42 with%') as { count: number };
    });

    console.log('\n--- Testing FTS TRIGRAM INDEX field ---');
    measureQuery('Test 9: MATCH search (Contains Common, FTS) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events_fts WHERE events_fts MATCH ?').get('label:"status code 200"') as { count: number };
    });

    measureQuery('Test 10: MATCH search (Contains Frequent, FTS) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events_fts WHERE events_fts MATCH ?').get('label:"module-xyz-50 p"') as { count: number };
    });

    measureQuery('Test 11: MATCH search (Contains Rare, FTS) - label', () => {
        return db.prepare('SELECT COUNT(*) as count FROM events_fts WHERE events_fts MATCH ?').get('label:"request 42 with"') as { count: number };
    });

    db.close();
}

function main() {
    const db = generateDatabase();
    runTests(db);
    
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    console.log(`\nStatistics saved to ${STATS_FILE}`);
}

main();
