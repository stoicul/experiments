# DuckDB Search Benchmark

A TypeScript benchmark for comparing DuckDB search strategies over synthetic event data:

- Columnar `LIKE` searches (starts with, contains)
- ART (Adaptive Radix Tree) indexes
- DuckDB FTS extension (BM25 ranking)

DuckDB is a columnar database designed for analytical queries. This benchmark evaluates how its columnar storage and built-in full-text search compare to traditional row-oriented databases like SQLite.

## Requirements

- Node.js 20 or newer
- npm

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

# Run with specific parameters
docker-compose run --rm duckdb-search --rows 100000 --batch 50000 --force-import
```

### Configuration

By default, the benchmark targets `100,000,000` rows in batches of `100,000`. You can override these using CLI arguments or environment variables.

#### CLI Arguments

```bash
npm start -- --rows 100000 --batch 50000
```

To wipe the existing database and force a fresh import:

```bash
npm start -- --force-import
```

#### Environment Variables

```bash
TARGET_ROWS=10000000 BATCH_SIZE=250000 DB_FILE=data/events.duckdb npm start
```

## Scripts

- `npm start` runs the benchmark with `tsx`.
- `npm run typecheck` runs TypeScript without emitting build output.

## Statistics

Results are saved to `data/statistics.json` after each run.

| Test | Query Type | Match Frequency | Index Type | Query Time (ms) |
| --- | --- | --- | --- | --- |
| 1 | Starts With | Frequent | No Index | - |
| 2 | Contains | Common | No Index | - |
| 3 | Contains | Frequent | No Index | - |
| 4 | Contains | Rare | No Index | - |
| 5 | Starts With | Frequent | ART Index | - |
| 6 | Contains | Common | ART Index | - |
| 7 | FTS (BM25) | Common | FTS Index | - |
| 8 | FTS (BM25) | Frequent | FTS Index | - |
| 9 | FTS (BM25) | Rare | FTS Index | - |
