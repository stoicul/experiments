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

## Benchmark Results (20,000,000 Entries)

Here are the actual measured results from running the isolated benchmark suite under Bun.js with **20,000,000 entries**:

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 14,080 ms | 13,093 ms | 12,677 ms |
| **Memory Used (Heap)** | 4,562 MB (~4.6 GB) | 6,360 MB (~6.4 GB) | 6,385 MB (~6.4 GB) |
| **Traversal Time** | 93 ms | 80 ms | 84 ms |
| **Property Access Time** | 324 ms | 308 ms | 316 ms |
| **Filtering Time** | 204 ms | 195 ms | 203 ms |
| **Mutation Time** | 301 ms | 305 ms | 317 ms |

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | 10,212 ms | 9,827 ms | 9,607 ms |
| **Memory Used (Heap)** | 5,127 MB (~5.1 GB) | 6,331 MB (~6.3 GB) | 6,167 MB (~6.2 GB) |
| **Traversal Time** | 91 ms | 85 ms | 75 ms |
| **Property Access Time** | 252 ms | 250 ms | 238 ms |
| **Filtering Time** | 216 ms | 203 ms | 201 ms |
| **Mutation Time** | 289 ms | 309 ms | 282 ms |

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
