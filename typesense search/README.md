# Typesense Search Benchmark

A TypeScript benchmark testing Typesense search capabilities and import performance over synthetic event data.

- Bulk batch imports
- Exact-match filtering
- Prefix searches
- Infix (contains) searches

The script creates a Typesense collection, generates rows, indexes them, and measures time and memory consumption for queries.

## Run via Docker

The recommended way to run this benchmark is via Docker Compose, which spins up a Typesense server and the benchmark runner.

```bash
# Build the images and run the default test (10,000,000 rows)
docker-compose up --build
```

You can customize the execution by passing parameters to the runner:

```bash
docker-compose run --rm benchmark --rows 100000 --batch 10000
```

To wipe the existing collection and force a fresh data import:
```bash
docker-compose run --rm benchmark --force-import
```

## Generated Files

The database uses the `data/typesense-data` volume mount. 
After execution, results are stored in `data/statistics.json`.
