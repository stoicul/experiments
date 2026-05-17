import neo4j from 'neo4j-driver';
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

const TARGET_ROWS = readPositiveIntegerEnv('TARGET_ROWS', 2_000_000);
const BATCH_SIZE = readPositiveIntegerEnv('BATCH_SIZE', 10_000);
const FORCE_IMPORT = process.env.FORCE_IMPORT === 'true';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function generateDatabase() {
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    const session = driver.session();

    try {
        const startImportTime = performance.now();
        let rowsInserted = 0;

        console.log(`Connected to Neo4j`);
        console.log(`Target rows: ${TARGET_ROWS.toLocaleString()}`);
        console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}`);

        if (FORCE_IMPORT) {
            console.log("Force import specified. Deleting existing nodes...");
            // Use periodic commit for large deletions if needed, but for 1M simple delete is fine in chunks
            await session.run('MATCH (e:Event) DETACH DELETE e');
            // Drop indexes if they exist (will handle in create step with IF NOT EXISTS where possible)
        }

        // Create range index for STARTS WITH
        await session.run('CREATE INDEX event_label_range IF NOT EXISTS FOR (e:Event) ON (e.label)');
        
        // Create full-text index
        // Neo4j 5 syntax for full-text index
        try {
            await session.run(`
                CREATE FULLTEXT INDEX eventFullText IF NOT EXISTS 
                FOR (n:Event) ON EACH [n.label]
            `);
        } catch (e) {
            console.warn("Full-text index creation failed (might already exist):", e);
        }

        const countRes = await session.run('MATCH (e:Event) RETURN count(e) as count');
        const currentRowCount = countRes.records[0].get('count').toNumber();
        console.log(`Current node count: ${currentRowCount}`);

        if (currentRowCount < TARGET_ROWS) {
            const rowsToInsert = TARGET_ROWS - currentRowCount;
            console.log(`Need to insert ${rowsToInsert.toLocaleString()} nodes...`);

            const numBatches = Math.ceil(rowsToInsert / BATCH_SIZE);
            const startTime = performance.now();

            for (let batch = 0; batch < numBatches; batch++) {
                const currentBatchSize = Math.min(BATCH_SIZE, rowsToInsert - batch * BATCH_SIZE);
                const offset = currentRowCount + batch * BATCH_SIZE;

                const batchData: any[] = [];
                for (let i = 0; i < currentBatchSize; i++) {
                    const idx = offset + i;
                    const complexString = `[INFO] System log entry - module-xyz-${idx % 100} processed request ${idx} with status code 200. Message details: User authentication successful for session ${idx % 5000}.`;
                    batchData.push({
                        id: `evt_${idx}`,
                        label: complexString,
                        label_unindexed: complexString
                    });
                }

                // Neo4j bulk insert using UNWIND
                await session.run(`
                    UNWIND $batch as row
                    CREATE (e:Event {id: row.id, label: row.label, label_unindexed: row.label_unindexed})
                `, { batch: batchData });

                rowsInserted += currentBatchSize;

                if ((batch + 1) % 10 === 0 || batch === numBatches - 1) {
                    const elapsed = (performance.now() - startTime) / 1000;
                    const rowsDone = rowsInserted;
                    const rate = rowsDone / elapsed;
                    console.log(`Inserted ${rowsDone.toLocaleString()} / ${rowsToInsert.toLocaleString()} nodes... (${Math.round(rate).toLocaleString()} nodes/sec)`);
                }
            }
            console.log('Insert complete.');
        }

        // Wait for indexes to be online (optional but good for benchmarking)
        console.log("Waiting for indexes to be online...");
        await session.run('CALL db.awaitIndexes()');

        stats.import.timeMs = performance.now() - startImportTime;
        stats.import.memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
        stats.import.totalRowsInserted = rowsInserted;

        return { driver, session };
    } catch (err) {
        await session.close();
        await driver.close();
        throw err;
    }
}

async function measureQuery(session: any, name: string, cypher: string, params: any) {
    console.log(`\n${name}`);
    const start = performance.now();
    const res = await session.run(cypher, params);
    const end = performance.now();
    const timeMs = end - start;
    const memoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    
    // Most queries here are count-based or return records
    let count = 0;
    if (res.records.length > 0) {
        const firstRecord = res.records[0];
        if (firstRecord.has('count')) {
            count = firstRecord.get('count').toNumber();
        } else {
            count = res.records.length;
        }
    }

    console.log(`Result count: ${count}`);
    console.log(`Time: ${timeMs.toFixed(2)} ms`);
    console.log(`Memory: ${memoryMb.toFixed(2)} MB`);

    stats.queries.push({ name, timeMs, memoryMb, resultCount: count });
}

async function runTests({ driver, session }: { driver: any, session: any }) {
    console.log('\n--- Running Search Tests ---');

    console.log('\n--- Testing UNINDEXED field (Full Scan) ---');
    await measureQuery(session, 'Test 1: CONTAINS search (No Index) - label_unindexed', 
        'MATCH (e:Event) WHERE e.label_unindexed CONTAINS $pattern RETURN count(e) as count', 
        { pattern: 'module-xyz-50' });

    await measureQuery(session, 'Test 2: CONTAINS search (Contains Common, No Index)', 
        'MATCH (e:Event) WHERE e.label_unindexed CONTAINS $pattern RETURN count(e) as count', 
        { pattern: 'status code 200' });

    await measureQuery(session, 'Test 3: CONTAINS search (Contains Rare, No Index)', 
        'MATCH (e:Event) WHERE e.label_unindexed CONTAINS $pattern RETURN count(e) as count', 
        { pattern: 'request 42 ' });

    console.log('\n--- Testing INDEXED field (Range Index) ---');
    await measureQuery(session, 'Test 4: STARTS WITH search (Indexed) - label', 
        'MATCH (e:Event) WHERE e.label STARTS WITH $prefix RETURN count(e) as count', 
        { prefix: '[INFO] System log entry - module-xyz-50' });

    console.log('\n--- Testing FULL-TEXT INDEX field (Lucene) ---');
    // Full-text queries in Neo4j use Lucene syntax. 
    // "status code 200" becomes "status AND code AND 200" or similar depending on requirements.
    // For a direct "contains" equivalent, we use phrase search if possible.
    await measureQuery(session, 'Test 5: Full-Text search (Contains Common) - label', 
        'CALL db.index.fulltext.queryNodes("eventFullText", $query) YIELD node RETURN count(node) as count', 
        { query: '"status code 200"' });

    await measureQuery(session, 'Test 6: Full-Text search (Contains Rare) - label', 
        'CALL db.index.fulltext.queryNodes("eventFullText", $query) YIELD node RETURN count(node) as count', 
        { query: '"request 42 "' });
        
    await measureQuery(session, 'Test 7: Full-Text search (Fuzzy-ish / Multiple Terms)', 
        'CALL db.index.fulltext.queryNodes("eventFullText", $query) YIELD node RETURN count(node) as count', 
        { query: 'module-xyz-50 AND "authentication successful"' });

    await session.close();
    await driver.close();
}

async function main() {
    try {
        const connection = await generateDatabase();
        await runTests(connection);

        mkdirSync(dirname(STATS_FILE), { recursive: true });
        writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
        console.log(`\nStatistics saved to ${STATS_FILE}`);
    } catch (err) {
        console.error('Benchmark failed:', err);
        process.exit(1);
    }
}

main();
