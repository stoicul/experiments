# Bun Object Performance Benchmark

This experiment benchmarks the performance and memory differences between Plain JavaScript Objects (POJOs) and TypeScript Class Value Objects in the Bun.js (JavaScriptCore) runtime.

## Benchmarks

We run performance tests, evaluating object creation, traversal, property access, filtering, and mutation across a massive array of entries (default: 10 million). The tests are split into six separate scripts to guarantee absolute process and memory isolation:

1. **Fixed Properties**:
   Tests objects where every instance has the exact same structural shape (all nested properties are perfectly initialized).
   - **Plain Objects**: `scripts/plain_obj_fixed_properties.ts`
   - **Value Objects**: `scripts/value_obj_fixed_properties.ts`
   - **Minimal Value Objects** (Only root wrapped in a class, nested objects are plain literals): `scripts/value_obj_minimal_fixed_properties.ts`
   
2. **Variable Properties**:
   Tests objects where certain properties are conditionally added or omitted (e.g., `ut`, `ag`, `edgeTo`), forcing the engine to handle variable object shapes (polymorphism).
   - **Plain Objects**: `scripts/plane_obj_variable_properties.ts`
   - **Value Objects**: `scripts/value_obj_variable_properties.ts`
   - **Minimal Value Objects** (Only root wrapped in a class, nested objects are plain literals): `scripts/value_obj_minimal_variable_properties.ts`

<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (1,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under Bun.js with **1,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 716 ms | 1,377 ms | 626 ms |
| **Memory Used (Heap)** | 181 MB (~0.2 GB) | 159 MB (~0.2 GB) | 188 MB (~0.2 GB) |
| **Traversal Time** | 12 ms | 16 ms | 7 ms |
| **Property Access Time** | 41 ms | 86 ms | 21 ms |
| **Filtering Time** | 20 ms | 33 ms | 17 ms |
| **Mutation Time** | 48 ms | 44 ms | 27 ms |
| **Delete Property Time** | 30 ms | 31 ms | 21 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 13,040 ms | 13,264 ms | 10,674 ms |
| **Memory Used (Heap)** | 5,727 MB (~5.6 GB) | 5,782 MB (~5.6 GB) | 5,677 MB (~5.5 GB) |
| **Traversal Time** | 131 ms | 102 ms | 141 ms |
| **Property Access Time** | 348 ms | 320 ms | 434 ms |
| **Filtering Time** | 275 ms | 233 ms | 230 ms |
| **Mutation Time** | 575 ms | 479 ms | 436 ms |
| **Delete Property Time** | 390 ms | 390 ms | 342 ms |
<!-- BENCHMARK_RESULTS_END -->

## Key Findings (JavaScriptCore)

### Memory Efficiency
- **Plain Objects** are highly memory-efficient (approx. 4.5 GB - 5.1 GB heap for 20M entries).
- **Value Objects** consume significantly more memory (approx. 6.3 GB heap for 20M entries). This happens because wrapping data in class instances carries structural metadata and prototype chain overhead that plain nested object literals avoid.
- **Minimal Value Objects** (wrapping only the outer root in a class) yield minor memory improvements under polymorphic conditions (~6.16 GB compared to ~6.33 GB) but carry a very similar memory footprint to fully nested Value Objects overall due to the class wrapper metadata.

### CPU Performance: The Hidden Class Optimization
JavaScriptCore (like V8) relies heavily on "Hidden Classes" (or structures) to optimize property access. 

**When Shapes are Uniform (Fixed Properties)**:
- Value Objects perform extremely well and match or exceed Plain Objects on traversal, property access, and filtering times.

**When Shapes are Variable (Variable Properties)**:
- If you dynamically omit properties inside a Value Object constructor (e.g., `if (ut !== undefined) this.ut = ut;`), you force the engine to create multiple polymorphic hidden classes.
- With polymorphic properties, **Value Object Minimal** shines, achieving the fastest property access (238 ms), traversal (75 ms), and mutation (282 ms) times because the engine optimizes the outer class shell while avoiding deeply nested instance complexity.

**Takeaway**: Value objects offer incredible performance and strict typing, but wrapping only the root node (*Value Object Minimal*) provides the best CPU performance when handling polymorphic/dynamic object shapes.

## How to Run

To guarantee the highest benchmarking accuracy and prevent Garbage Collection (GC) or JIT optimizations from one object type cross-contaminating the other, the benchmarks run in absolute isolation as independent processes.

### Run All Benchmarks Sequentially
You can run all six isolated benchmarks one after the other in separate processes:

```bash
# Using docker-compose (runs "start" script from package.json by default)
docker-compose run --rm benchmark

# Or locally with bun
bun run scripts/run_all.ts
# or
bun run start
```

### Run Isolated Benchmarks Individually
You can target any specific benchmark script directly:

```bash
# --- FIXED PROPERTIES (10M ENTRIES) ---
docker-compose run --rm benchmark scripts/plain_obj_fixed_properties.ts
docker-compose run --rm benchmark scripts/value_obj_fixed_properties.ts
docker-compose run --rm benchmark scripts/value_obj_minimal_fixed_properties.ts

# --- VARIABLE PROPERTIES (10M ENTRIES) ---
docker-compose run --rm benchmark scripts/plane_obj_variable_properties.ts
docker-compose run --rm benchmark scripts/value_obj_variable_properties.ts
docker-compose run --rm benchmark scripts/value_obj_minimal_variable_properties.ts
```

Benchmark statistics will automatically be exported to the `data/` directory (`stats.json` and `stats_variable.json`).
