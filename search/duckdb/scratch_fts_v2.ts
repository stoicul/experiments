import { DuckDBInstance } from '@duckdb/node-api';

async function main() {
    const instance = await DuckDBInstance.create();
    const connection = await instance.connect();

    await connection.run("INSTALL fts; LOAD fts;");
    await connection.run("CREATE TABLE docs (id VARCHAR, content VARCHAR)");
    const complexString = `[INFO] System log entry - module-xyz-50 processed request 50 with status code 200. Message details: User authentication successful for session 50.`;
    await connection.run("INSERT INTO docs VALUES ('1', ?)", [complexString]);
    await connection.run("PRAGMA create_fts_index('docs', 'id', 'content')");

    const queries = [
        'status',
        'code',
        '200',
        'status code',
        'status code 200',
        'module',
        'xyz',
        'module xyz',
        'authentication'
    ];

    for (const q of queries) {
        const res = await connection.runAndReadAll(`SELECT id, fts_main_docs.match_bm25(id, ?, conjunctive := 1) as score FROM docs`, [q]);
        console.log(`Query: ${q} -> Score: ${res.getRows()[0][1]}`);
    }
}

main();
