# Data Experiments

This repository is a collection of various Data experiments, proof-of-concepts, and tools.

## Structure

Each subdirectory within this repository is a self-contained experiment. Experiments are built using different programming languages and frameworks, depending on what best suits the task.

### Current Experiments

The following search-related experiments are located in the `search/` directory:

- **[sqlite](./search/sqlite/)**: A Node.js/TypeScript benchmark testing SQLite search performance on 100M rows, comparing standard B-tree indexes against FTS5 Trigram indexes.
- **[typesense](./search/typesense/)**: A Node.js/TypeScript benchmark testing Typesense search performance on 100M rows via Docker, comparing exact match, prefix, and infix string queries.
- **[duckdb](./search/duckdb/)**: A Node.js/TypeScript benchmark testing DuckDB search performance using the modern `@duckdb/node-api` (Neo) client, evaluating columnar scans and FTS extension.
- **[opensearch](./search/opensearch/)**: A Node.js/TypeScript benchmark testing OpenSearch performance via Docker, evaluating prefix, match phrase, and wildcard searches on log-style data.
