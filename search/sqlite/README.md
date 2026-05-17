# SQLite Search Benchmark

A small TypeScript benchmark for comparing SQLite search strategies over synthetic event data:

- exact-match and `LIKE` prefix/contains searches before indexing
- B-tree indexes on the `label` column
- SQLite FTS5 with the `trigram` tokenizer for contains-style searches

The script creates a local SQLite database, fills it with generated rows, builds indexes, and prints timing results for each query style.

## Requirements

- Node.js 20 or newer
- npm

`better-sqlite3` uses native bindings, so installing dependencies may require a working compiler toolchain if a prebuilt binary is not available for your platform.

## Install

```bash
npm install
```

## Run

You can run the benchmark natively with Node or via Docker Compose.

### Natively

```bash
npm start
```

### Docker

```bash
# Build and run the default container
docker-compose up --build
```

## Configuration

By default, the benchmark writes to `data/events.db` and targets `2,000,000` rows in batches of `100,000`. You can override these using CLI arguments or environment variables.

### CLI Arguments

```bash
npm start -- --rows 100000 --batch 50000
```

To wipe the existing database and force a fresh import:

```bash
npm start -- --force-import
```

With Docker:

```bash
docker-compose run --rm sqlite-search --rows 100000 --batch 50000 --force-import
```

## Statistics Example (100,000 Rows)

Below are sample results from querying a 100,000-row database on the `label` column (indexed) and `label_unindexed` column (full table scan), comparing SQLite's B-Tree vs FTS5 Trigram performance.

| Test | Query Type | Match Frequency | Index Type | Query Time (ms) |
| --- | --- | --- | --- | --- |
| 1 | Starts With | Frequent (1,000) | No Index | 1,093 ms |
| 2 | Contains | Common (100,000) | No Index | 1,133 ms |
| 3 | Contains | Frequent (1,000) | No Index | 1,116 ms |
| 4 | Contains | Rare (1) | No Index | 1,064 ms |
| 5 | Starts With | Frequent (1,000) | B-Tree Index | 7 ms |
| 6 | Contains | Common (100,000) | B-Tree Index | 603 ms |
| 7 | Contains | Frequent (1,000) | B-Tree Index | 14 ms |
| 8 | Contains | Rare (1) | B-Tree Index | 16 ms |
| 9 | MATCH (Contains) | Common (100,000) | FTS5 Trigram | 283 ms |
| 10 | MATCH (Contains) | Frequent (1,000) | FTS5 Trigram | 213 ms |
| 11 | MATCH (Contains) | Rare (1) | FTS5 Trigram | 25 ms |

### Environment Variables

```bash
TARGET_ROWS=2000000 BATCH_SIZE=250000 DB_FILE=data/events.db npm start
```

PowerShell example:

```powershell
$env:TARGET_ROWS = "2000000"
$env:BATCH_SIZE = "250000"
$env:DB_FILE = "data/events.db"
npm start
```

## Scripts

- `npm start` runs the benchmark with `tsx`.
- `npm run typecheck` runs TypeScript without emitting build output.

## Generated Files

The benchmark creates SQLite database files locally under `data/`:

- `data/events.db`
- `data/events.db-shm`
- `data/events.db-wal`

The `data/` directory is ignored by git, along with `node_modules/`.
