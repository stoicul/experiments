# PHP Object Performance Benchmark

This experiment benchmarks the performance and memory differences between **Plain PHP Associative Arrays**, **Fully Typed Class Value Objects**, and **Minimal Value Objects** (Outer typed class wrapping nested associative arrays) under the PHP 8.3 CLI runtime with JIT compilation enabled.

## PHP-Specific Runtime Behavior

Unlike JavaScript engines (V8, JSC) which optimize objects through "Hidden Classes" (Shapes), the Zend Engine handles data structures quite differently:
- **PHP Associative Arrays**: Implemented as highly optimized HashTables under the hood, wrapping values inside standard Zend values (`zvals`). While incredibly convenient, they carry significant memory overhead due to key hashing, bucket allocations, and metadata overhead.
- **PHP Objects**: Class properties are stored as flat arrays indexed by predefined offsets (derived from the class definition). Access is fast, but object allocation adds standard GC tracking and refcount overhead.
- **OPcache JIT**: OPcache CLI is enabled in JIT `tracing` mode (`opcache.jit=tracing`) to ensure modern execution speeds comparable to Bun/Node.

---

## Benchmarks

We run performance tests evaluating creation, traversal, property access, filtering, mutation, and property deletion across a massive array of entries (default: 1,000,000). The benchmarks run in isolated child processes to ensure garbage collection or cache warmups from one test do not impact the others.

1. **Fixed Properties**:
   Tests structures where every instance has the exact same structural shape.
   - **Plain Objects (Arrays)**: `scripts/plain_obj_fixed_properties.php`
   - **Value Objects**: `scripts/value_obj_fixed_properties.php`
   - **Minimal Value Objects**: `scripts/value_obj_minimal_fixed_properties.php`

2. **Variable Properties**:
   Tests structures where certain properties are conditionally added or omitted (polymorphic shapes).
   - **Plain Objects (Arrays)**: `scripts/plain_obj_variable_properties.php`
   - **Value Objects**: `scripts/value_obj_variable_properties.php`
   - **Minimal Value Objects**: `scripts/value_obj_minimal_variable_properties.php`

<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (1,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under PHP with **1,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object (Array) | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | 1,910 ms | 1,542 ms | 1,886 ms |
| **Memory Used (Heap)** | 1,732 MB (~1.7 GB) | 888 MB (~0.9 GB) | 1,504 MB (~1.5 GB) |
| **Traversal Time** | 15 ms | 17 ms | 20 ms |
| **Property Access Time** | 170 ms | 40 ms | 107 ms |
| **Filtering Time** | 96 ms | 35 ms | 36 ms |
| **Mutation Time** | 161 ms | 43 ms | 49 ms |
| **Delete Property Time** | 75 ms | 35 ms | 65 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object (Array) | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | 1,002 ms | 1,080 ms | 1,421 ms |
| **Memory Used (Heap)** | 1,173 MB (~1.1 GB) | 633 MB (~0.6 GB) | 944 MB (~0.9 GB) |
| **Traversal Time** | 27 ms | 17 ms | 19 ms |
| **Property Access Time** | 179 ms | 32 ms | 87 ms |
| **Filtering Time** | 138 ms | 39 ms | 46 ms |
| **Mutation Time** | 174 ms | 39 ms | 57 ms |
| **Delete Property Time** | 103 ms | 43 ms | 72 ms |


### 3. JSON Encoding/Decoding (3 cols x 50,000 rows)

| Metric | Naive | Idiomatic |
| :--- | :---: | :---: |
| **Creation Time** | 193 ms | 199 ms |
| **Memory Used (Heap)** | 0 MB (~0.0 GB) | 0 MB (~0.0 GB) |
| **JSON Encoding Time** | 368 ms | 331 ms |
| **JSON Decoding Time** | 1,516 ms | 1,163 ms |
| **JSON File Write Time** | 945 ms | 883 ms |
| **JSON File Read Time** | 339 ms | 336 ms |
| **JSON File Decode Time** | 949 ms | 903 ms |

<!-- BENCHMARK_RESULTS_END -->

---

## Key Findings (Zend Engine)

### Memory Footprint: Zend HashTables vs Typed Properties
- In PHP, standard **Associative Arrays** tend to use significantly more memory than flat **Class Instances** with typed properties. This is because PHP classes allocate properties as a contiguous array of zvals mapped by constant offsets, avoiding the HashTable key/bucket storage overhead entirely.
- **Value Object Minimal** (wrapping an outer class shell around associative array details) balances class definitions with nested dynamic arrays but still bears HashTable storage overhead for nested structures.

### CPU Execution (OPcache JIT Tracing)
- Real-time JIT compilation optimizes typed property access via direct zval offset mapping, making property lookup inside fully typed Value Objects exceptionally competitive compared to hash-table key lookups.

---

## How to Run

To run the benchmarks under identical isolated conditions:

### Run All Benchmarks Sequentially
```bash
# Using docker-compose (JIT & OPcache enabled)
docker-compose run --rm benchmark

# Or locally (make sure CLI has OPcache & JIT enabled)
php scripts/run_all.php
```

### Run Isolated Benchmarks Individually
```bash
# --- FIXED PROPERTIES (1M ENTRIES) ---
docker-compose run --rm benchmark scripts/plain_obj_fixed_properties.php
docker-compose run --rm benchmark scripts/value_obj_fixed_properties.php
docker-compose run --rm benchmark scripts/value_obj_minimal_fixed_properties.php

# --- VARIABLE PROPERTIES (1M ENTRIES) ---
docker-compose run --rm benchmark scripts/plain_obj_variable_properties.php
docker-compose run --rm benchmark scripts/value_obj_variable_properties.php
docker-compose run --rm benchmark scripts/value_obj_minimal_variable_properties.php
```

Benchmark statistics will automatically be exported to the `data/` directory (`stats.json` and `stats_variable.json`).
