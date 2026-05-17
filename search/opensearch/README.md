# OpenSearch Search Performance Experiment

This experiment benchmarks OpenSearch performance for log-style data, similar to the SQLite, DuckDB, and Typesense experiments.

## Setup

1.  Ensure Docker and Docker Compose are installed.
2.  Run the experiment:
    ```bash
    docker compose up --build
    ```

## Experiment Details

- **Data Structure**: `id`, `label` (Text with Keyword sub-field), `label_unindexed` (Keyword, not indexed).
- **Target Rows**: 2,000,000 (configurable via `TARGET_ROWS` env var).
- **Queries**:
    - Prefix search on `label.keyword`.
    - `match_phrase` on `label`.
    - `wildcard` search on `label.keyword`.

## Configuration

You can customize the experiment using environment variables in `docker-compose.yml`:

- `TARGET_ROWS`: Total number of rows to index (default: 2,000,000).
- `BATCH_SIZE`: Number of rows per bulk request (default: 5,000).
- `OPENSEARCH_JAVA_OPTS`: JVM heap settings for OpenSearch.
