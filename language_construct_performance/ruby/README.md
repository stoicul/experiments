# Ruby Object Performance Benchmark

This experiment benchmarks the performance and memory differences between Plain Ruby Hashes and Ruby Class Value Objects in the CRuby (MRI) runtime.

## Benchmarks

We run performance tests, evaluating object creation, traversal, property access, filtering, and mutation across a massive array of entries (default: 20 million). The tests are split into six separate scripts to guarantee absolute process and memory isolation:

1. **Fixed Properties**:
   Tests objects where every instance has the exact same structural shape (all nested properties are perfectly initialized).
   - **Plain Objects (Hashes)**: `scripts/plain_obj_fixed_properties.rb`
   - **Value Objects (Classes)**: `scripts/value_obj_fixed_properties.rb`
   - **Minimal Value Objects** (Only root wrapped in a class, nested objects are plain Hashes): `scripts/value_obj_minimal_fixed_properties.rb`
   
2. **Variable Properties**:
   Tests objects where certain properties are conditionally added or omitted (e.g., `ut`, `ag`, `edge_to`), forcing the runtime to handle variable object shapes (polymorphism).
   - **Plain Objects (Hashes)**: `scripts/plain_obj_variable_properties.rb`
   - **Value Objects (Classes)**: `scripts/value_obj_variable_properties.rb`
   - **Minimal Value Objects** (Only root wrapped in a class, nested objects are plain Hashes): `scripts/value_obj_minimal_variable_properties.rb`

<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (1,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under Ruby with **1,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 12,410 ms | 5,990 ms | 14,337 ms |
| **Memory Used (RSS)** | 2,912 MB (~2.8 GB) | 1,643 MB (~1.6 GB) | 2,834 MB (~2.8 GB) |
| **Traversal Time** | 41 ms | 40 ms | 44 ms |
| **Property Access Time** | 381 ms | 356 ms | 269 ms |
| **Filtering Time** | 175 ms | 106 ms | 116 ms |
| **Mutation Time** | 275 ms | 127 ms | 208 ms |
| **Delete Property Time** | 194 ms | 153 ms | 169 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 9,230 ms | 9,151 ms | 9,764 ms |
| **Memory Used (RSS)** | 1,881 MB (~1.8 GB) | 1,376 MB (~1.3 GB) | 1,821 MB (~1.8 GB) |
| **Traversal Time** | 42 ms | 49 ms | 42 ms |
| **Property Access Time** | 249 ms | 389 ms | 300 ms |
| **Filtering Time** | 243 ms | 391 ms | 232 ms |
| **Mutation Time** | 342 ms | 307 ms | 328 ms |
| **Delete Property Time** | 238 ms | 364 ms | 221 ms |
<!-- BENCHMARK_RESULTS_END -->

## Key Findings

*Results will be analyzed after running the benchmarks.*

## How to Run

To guarantee the highest benchmarking accuracy and prevent Garbage Collection (GC) optimizations from one object type cross-contaminating the other, the benchmarks run in absolute isolation as independent processes.

### Run All Benchmarks Sequentially
You can run all six isolated benchmarks one after the other in separate processes:

```bash
# Using docker-compose (recommended)
docker-compose run --rm benchmark

# With a custom entry count
NUM_ENTRIES=1000000 docker-compose run --rm benchmark

# Or locally with Ruby (>= 3.0)
ruby scripts/run_all.rb
```

### Run Isolated Benchmarks Individually
You can target any specific benchmark script directly:

```bash
# --- FIXED PROPERTIES ---
docker-compose run --rm benchmark scripts/plain_obj_fixed_properties.rb
docker-compose run --rm benchmark scripts/value_obj_fixed_properties.rb
docker-compose run --rm benchmark scripts/value_obj_minimal_fixed_properties.rb

# --- VARIABLE PROPERTIES ---
docker-compose run --rm benchmark scripts/plain_obj_variable_properties.rb
docker-compose run --rm benchmark scripts/value_obj_variable_properties.rb
docker-compose run --rm benchmark scripts/value_obj_minimal_variable_properties.rb
```

Benchmark statistics will automatically be exported to the `data/` directory (`stats.json` and `stats_variable.json`).
