import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

type SqliteDatabase = InstanceType<typeof Database>;

const DB_FILE = process.env.DB_FILE ?? 'data/events.db';
const TARGET_ROWS = readPositiveIntegerEnv('TARGET_ROWS', 1_000_000);
const BATCH_SIZE = readPositiveIntegerEnv('BATCH_SIZE', 100_000);

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
    console.log(`Opening database: ${DB_FILE}`);
    console.log(`Target rows: ${TARGET_ROWS.toLocaleString()}`);
    console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);
    mkdirSync(dirname(DB_FILE), { recursive: true });
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
            provider TEXT
        )
    `);

    console.log("Creating FTS Trigram index if it doesn't exist...");
    db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
            id UNINDEXED,
            label,
            provider UNINDEXED,
            tokenize='trigram'
        )
    `);

    db.exec(`
        CREATE TRIGGER IF NOT EXISTS after_event_insert
        AFTER INSERT ON events
        BEGIN
            INSERT INTO events_fts (id, label, provider)
            VALUES (new.id, new.label, new.provider);
        END;
    `);
    const countRow = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
    const currentRowCount = countRow.count;
    console.log(`Current row count: ${currentRowCount}`);

    // Sync existing data to FTS if needed
    const countFtsRow = db.prepare('SELECT COUNT(*) as count FROM events_fts').get() as { count: number };
    if (countFtsRow.count < currentRowCount) {
        console.log('Populating FTS trigram index from existing events (this may take a while)...');
        db.exec('INSERT INTO events_fts (id, label, provider) SELECT id, label, provider FROM events WHERE rowid > (SELECT IFNULL(MAX(rowid), 0) FROM events_fts)');
        console.log('FTS population complete.');
    }

    if (currentRowCount < TARGET_ROWS) {
        const rowsToInsert = TARGET_ROWS - currentRowCount;
        console.log(`Need to insert ${rowsToInsert} rows...`);

        const insert = db.prepare('INSERT INTO events (id, label, provider) VALUES (?, ?, ?)');

        const insertMany = db.transaction((batchSize: number, offset: number) => {
            for (let i = 0; i < batchSize; i++) {
                const id = `evt_${offset + i}`;
                const label = `Event Label ${(offset + i) % 1000}`;
                const provider = `Provider ${(offset + i) % 50}`;
                insert.run(id, label, provider);
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

    return db;
}

function runTests(db: SqliteDatabase) {
    console.log('\n--- Running Search Tests ---');

    // Test 1: Exact match on provider
    console.log('\nTest 1: Exact match (No Index) - Provider');
    let start = performance.now();
    let stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE provider = ?');
    let result = stmt.get('Provider 42');
    let end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    // Test 2: LIKE search on label (Starts with)
    console.log('\nTest 2: LIKE search (Starts with, No Index) - Label');
    start = performance.now();
    stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?');
    result = stmt.get('Event Label 50%');
    end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    // Test 3: LIKE search (Contains, No Index) - Label
    console.log('\nTest 3: LIKE search (Contains, No Index) - Label');
    start = performance.now();
    stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?');
    result = stmt.get('%Label 50%');
    end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    // Creating Index
    console.log('\n--- Creating Indexes ---');
    console.log('Creating index on provider...');
    start = performance.now();
    db.exec('CREATE INDEX IF NOT EXISTS idx_provider ON events(provider)');
    end = performance.now();
    console.log(`Index on provider created in ${(end - start).toFixed(2)} ms`);

    console.log('Creating index on label...');
    start = performance.now();
    db.exec('CREATE INDEX IF NOT EXISTS idx_label ON events(label COLLATE NOCASE)');
    end = performance.now();
    console.log(`Index on label created in ${(end - start).toFixed(2)} ms`);

    console.log('\n--- Running Search Tests (WITH INDEX) ---');

    // Test 1: Exact match on provider
    console.log('\nTest 1: Exact match (Indexed) - Provider');
    start = performance.now();
    stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE provider = ?');
    result = stmt.get('Provider 42');
    end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    // Test 2: LIKE search on label (Starts with)
    console.log('\nTest 2: LIKE search (Starts with, Indexed) - Label');
    start = performance.now();
    stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?');
    result = stmt.get('Event Label 50%');
    end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    // Test 3: LIKE search (Contains, Indexed) - Label
    console.log('\nTest 3: LIKE search (Contains, Indexed) - Label');
    start = performance.now();
    stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE label LIKE ?');
    result = stmt.get('%Label 50%');
    end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    console.log('\n--- Running Search Tests (FTS TRIGRAM INDEX) ---');
    console.log('\nTest 3: LIKE search (Contains, FTS Trigram) - Label');
    start = performance.now();
    stmt = db.prepare('SELECT COUNT(*) as count FROM events_fts WHERE label LIKE ?');
    result = stmt.get('%Label 50%');
    end = performance.now();
    console.log(`Result:`, result);
    console.log(`Time: ${(end - start).toFixed(2)} ms`);

    db.close();
}

function main() {
    const db = generateDatabase();
    runTests(db);
}

main();
