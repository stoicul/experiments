# Python Language Construct Performance



<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (1,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under Python with **1,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | 20,797 ms | 19,790 ms | 28,155 ms | 21,751 ms |
| **Memory Used (Heap)** | 1,741 MB (~1.7 GB) | 1,741 MB (~1.7 GB) | 1,077 MB (~1.1 GB) | 833 MB (~0.8 GB) |
| **Traversal Time** | 51 ms | 47 ms | 48 ms | 51 ms |
| **Property Access Time** | 318 ms | 340 ms | 248 ms | 149 ms |
| **Filtering Time** | 251 ms | 203 ms | 261 ms | 64 ms |
| **Mutation Time** | 301 ms | 248 ms | 246 ms | 59 ms |
| **Delete Property Time** | 126 ms | 120 ms | 100 ms | 40 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | 13,426 ms | 13,261 ms | 20,520 ms | 17,961 ms |
| **Memory Used (Heap)** | 1,157 MB (~1.1 GB) | 1,157 MB (~1.1 GB) | 768 MB (~0.8 GB) | 638 MB (~0.6 GB) |
| **Traversal Time** | 107 ms | 86 ms | 85 ms | 36 ms |
| **Property Access Time** | 177 ms | 165 ms | 141 ms | 119 ms |
| **Filtering Time** | 149 ms | 169 ms | 145 ms | 60 ms |
| **Mutation Time** | 201 ms | 231 ms | 158 ms | 55 ms |
| **Delete Property Time** | 149 ms | 145 ms | 112 ms | 40 ms |

<!-- BENCHMARK_RESULTS_END -->