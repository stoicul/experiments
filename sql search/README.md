# SQL Search Benchmark

A small TypeScript benchmark for comparing SQLite search strategies over synthetic event data:

- exact-match filtering on a regular table
- `LIKE` prefix and contains searches before indexing
- B-tree indexes on `provider` and `label`
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

By default, the benchmark writes to `data/events.db` and targets `1,000,000` rows in batches of `100,000`. You can override these using CLI arguments or environment variables.

### CLI Arguments

```bash
npm start -- --rows 100000 --batch 50000
```

With Docker:

```bash
docker-compose run --rm sql-search --rows 100000 --batch 50000
```

### Environment Variables

```bash
TARGET_ROWS=10000000 BATCH_SIZE=250000 DB_FILE=data/events.db npm start
```

PowerShell example:

```powershell
$env:TARGET_ROWS = "10000000"
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
