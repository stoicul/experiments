# Data Experiments

This repository is a collection of various Data experiments, proof-of-concepts, and tools.

## Structure

Each subdirectory within this repository is a self-contained experiment. Experiments are built using different programming languages and frameworks, depending on what best suits the task.

### Current Experiments

- **[sql search](./sql%20search/)**: A Node.js/TypeScript benchmark testing SQLite search performance on 100M rows, comparing standard B-tree indexes against FTS5 Trigram indexes for exact matches and `LIKE` substring queries.
