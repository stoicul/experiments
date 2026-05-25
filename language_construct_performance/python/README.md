# Python Language Construct Performance



<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (1,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under Python with **1,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Memory Used (Heap)** | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) |
| **Traversal Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Property Access Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Filtering Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Mutation Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Delete Property Time** | 0 ms | 0 ms | 0 ms | 0 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Memory Used (Heap)** | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) |
| **Traversal Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Property Access Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Filtering Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Mutation Time** | 0 ms | 0 ms | 0 ms | 0 ms |
| **Delete Property Time** | 0 ms | 0 ms | 0 ms | 0 ms |

<!-- BENCHMARK_RESULTS_END -->