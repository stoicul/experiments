# PostgreSQL Search Experiment

Benchmarking PostgreSQL search performance using:
- Standard `LIKE` queries (Full Table Scan)
- B-Tree indexes (for prefix search)
- Trigram indexes via `pg_trgm` (for arbitrary `LIKE` and `ILIKE` queries)

## Setup

1. Make sure Docker is running.
2. Run the benchmark:
   ```bash
   docker compose up --build
   ```

## Configuration

Environment variables:
- `TARGET_ROWS`: Total number of rows to insert (default: 1,000,000)
- `BATCH_SIZE`: Number of rows per batch insert (default: 10,000)
- `FORCE_IMPORT`: Set to `true` to clear existing data and re-import.
