import { DuckDBInstance } from '@duckdb/node-api';

async function main() {
    const instance = await DuckDBInstance.create();
    const connection = await instance.connect();

    await connection.run("INSTALL fts; LOAD fts;");
    await connection.run("CREATE TABLE docs (id VARCHAR, content VARCHAR)");
    await connection.run("INSERT INTO docs VALUES ('1', 'hello world'), ('2', 'hello'), ('3', 'world')");
    await connection.run("PRAGMA create_fts_index('docs', 'id', 'content')");

    const res1 = await connection.runAndReadAll("SELECT id, fts_main_docs.match_bm25(id, 'hello') as score FROM docs");
    console.log('Query: hello');
    console.log(res1.getRows());

    const res2 = await connection.runAndReadAll("SELECT id, fts_main_docs.match_bm25(id, 'world') as score FROM docs");
    console.log('Query: world');
    console.log(res2.getRows());

    const res3 = await connection.runAndReadAll("SELECT id, fts_main_docs.match_bm25(id, 'nonexistent') as score FROM docs");
    console.log('Query: nonexistent');
    console.log(res3.getRows());
}

main();
