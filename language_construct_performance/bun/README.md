# Bun Object Performance Benchmark

This experiment benchmarks the performance and memory differences between Plain JavaScript Objects (POJOs) and Strict TypeScript Classes (Value Objects) in the Bun.js (JavaScriptCore) runtime.

## Benchmarks

We run two distinct performance tests, evaluating object creation, traversal, property access, filtering, and mutation across a massive array of entries (default: 10 million). 

1. **Fixed Properties (`plain_vs_value_obj_fixed_properties.ts`)**:
   Tests objects where every instance has the exact same structural shape (all nested properties are perfectly initialized).
   
2. **Variable Properties (`plain_vs_value_obj_variable_properties.ts`)**:
   Tests objects where certain properties are conditionally added or omitted (e.g., `ut`, `ag`, `edgeTo`), forcing the engine to handle variable object shapes (polymorphism).

## Key Findings (JavaScriptCore)

### Memory Efficiency
- **Plain Objects** are highly memory-efficient (approx. 4.5 GB heap for 20M entries).
- **Strict Classes** consume significantly more memory (approx. 10.2 GB heap for 20M entries). This happens because nested strict class instances carry structural metadata and prototype chain overhead that plain nested object literals avoid.

### CPU Performance: The Hidden Class Optimization
JavaScriptCore (like V8) relies heavily on "Hidden Classes" (or structures) to optimize property access. 

**When Shapes are Uniform (Fixed Properties)**:
- Strict Classes are **up to 6x faster** than Plain Objects at property access. The engine perfectly predicts where data lives in memory.

**When Shapes are Variable (Variable Properties)**:
- If you dynamically omit properties inside a Strict Class constructor (e.g., `if (ut !== undefined) this.ut = ut;`), you force the engine to create multiple polymorphic hidden classes.
- The property access optimization **collapses**. In tests with variable shapes, Strict Classes actually become slightly *slower* than Plain Objects.

**Takeaway**: Strict classes offer incredible speed for complex business logic, but *only* if you guarantee that every instance has the exact same shape (even if properties are set to `undefined`).

## How to Run

To prevent Out-Of-Memory (OOM) crashes in standard 15GB/16GB Docker containers when interleaving tests, the default `NUM_ENTRIES` is set to `10,000,000`. You can override this using the `NUM_ENTRIES` environment variable.

You can select which script to run using the `SCRIPT_NAME` environment variable:

```powershell
# Run Fixed Properties Benchmark (Default)
docker-compose run --rm benchmark

# Run Variable Properties Benchmark
$env:SCRIPT_NAME="plain_vs_value_obj_variable_properties.ts"; docker-compose run --rm benchmark

# Run with a custom amount of entries
$env:NUM_ENTRIES="5000000"; docker-compose run --rm benchmark
```

Benchmark statistics will automatically be exported to the `data/` directory (`stats.json` and `stats_variable.json`).
