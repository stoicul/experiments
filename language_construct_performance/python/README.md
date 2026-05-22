# Python Language Construct Performance



<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (1,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under Python with **1,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object (Dict) | Value Object (Dataclass) | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 22,420 ms | 22,707 ms | 23,596 ms |
| **Memory Used (Heap)** | 1,741 MB (~1.7 GB) | 833 MB (~0.8 GB) | 1,634 MB (~1.6 GB) |
| **Traversal Time** | 53 ms | 39 ms | 50 ms |
| **Property Access Time** | 367 ms | 142 ms | 386 ms |
| **Filtering Time** | 218 ms | 54 ms | 122 ms |
| **Mutation Time** | 256 ms | 61 ms | 105 ms |
| **Delete Property Time** | 142 ms | 42 ms | 89 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object (Dict) | Value Object (Dataclass) | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 13,325 ms | 18,447 ms | 17,060 ms |
| **Memory Used (Heap)** | 1,157 MB (~1.1 GB) | 638 MB (~0.6 GB) | 1,050 MB (~1.0 GB) |
| **Traversal Time** | 86 ms | 36 ms | 51 ms |
| **Property Access Time** | 171 ms | 123 ms | 291 ms |
| **Filtering Time** | 162 ms | 51 ms | 164 ms |
| **Mutation Time** | 222 ms | 57 ms | 155 ms |
| **Delete Property Time** | 148 ms | 41 ms | 153 ms |

<!-- BENCHMARK_RESULTS_END -->