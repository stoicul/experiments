---
name: performance-testing
description: Enforces Docker execution, 100k scale, and directory rules for benchmarks.
---
# Benchmark Performance Rules

## 🐳 Execution & Docker
- **Docker Only:** Always run tests inside Docker (`docker-compose up <service>`).
- **Rebuilds:** Rebuild image if test logic changes: `docker-compose up --build <service>`.
- **Cleanup:** Delete all `test_dump` and `test_dump.json` files after execution.

## 📊 scale
- **Iteration:** Enforce `NUM_ENTRIES=100000` (100k entries) during development.
- **Production:** Use 1M entries only if explicitly requested.

## 📂 Conventions
- **Folders:** Separate tests into `<lang>/scripts/naive/` and `<lang>/scripts/idiomatic/`.
- **Filenames:** Remove `_naive` and `_idiomatic` suffixes from test file names.
- **JSON:** Benchmark naive vs idiomatic creation/encoding/decoding. Output stats to `stats_json`.
