# Rust Performance Benchmark

This directory contains the Rust implementation of the performance benchmarks.

## Running

You can run the benchmarks using Docker Compose:

```bash
docker compose up benchmark
```

<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (100 Entries)

Here are the actual measured results from running the isolated benchmark suite under Rust with **100 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 1 ms | 0 ms | 1 ms |
| **Memory Used (Heap)** | 1 MB (~0.0 GB) | 1 MB (~0.0 GB) | 1 MB (~0.0 GB) |
| **Traversal Time** | 0 ms | 0 ms | 0 ms |
| **Property Access Time** | 0 ms | 0 ms | 0 ms |
| **Filtering Time** | 0 ms | 0 ms | 0 ms |
| **Mutation Time** | 0 ms | 0 ms | 0 ms |
| **Delete Property Time** | 0 ms | 0 ms | 0 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 0 ms | 0 ms | 0 ms |
| **Memory Used (Heap)** | 1 MB (~0.0 GB) | 0 MB (~0.0 GB) | 1 MB (~0.0 GB) |
| **Traversal Time** | 0 ms | 0 ms | 0 ms |
| **Property Access Time** | 0 ms | 0 ms | 0 ms |
| **Filtering Time** | 0 ms | 0 ms | 0 ms |
| **Mutation Time** | 0 ms | 0 ms | 0 ms |
| **Delete Property Time** | 0 ms | 0 ms | 0 ms |

<!-- BENCHMARK_RESULTS_END -->
