import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { performance } from "perf_hooks";

export const NUM_ENTRIES = parseInt(process.env.NUM_ENTRIES || "20000000", 10);

export function measureMemory() {
  if (global.gc) global.gc(); // Force GC before taking memory snapshot
  const mem = process.memoryUsage();
  return {
    rss: Math.round(mem.rss / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
  };
}

export function benchmarkStats(
  name,
  statGroup,
  statKey,
  fn,
  trackMemory = false
) {
  const memBefore = trackMemory ? measureMemory() : null;
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  const memAfter = trackMemory ? measureMemory() : null;

  const timeMs = Math.round(t1 - t0);
  statGroup[statKey] = timeMs;

  let memoryMB;
  if (trackMemory) {
    memoryMB = memAfter.heapUsed - memBefore.heapUsed;
    statGroup.memoryUsedMB = memoryMB;
    console.log(`${name} - Time: ${timeMs}ms, Memory Used (Heap): ${memoryMB} MB ${JSON.stringify(memAfter)}`);
  } else {
    console.log(`${name}: ${timeMs}ms`);
  }

  return result;
}

export function saveStats(fileName, key, data) {
  if (!existsSync("data")) mkdirSync("data");
  const statsPath = join("data", fileName);
  let existingStats = { numEntries: NUM_ENTRIES, "plain object": {}, "value object": {}, "value object minimal": {} };
  if (existsSync(statsPath)) {
    try {
      existingStats = JSON.parse(readFileSync(statsPath, "utf-8"));
    } catch (e) {
      console.error(`Error parsing existing stats in ${statsPath}:`, e);
    }
  }

  existingStats[key] = data;
  existingStats.numEntries = NUM_ENTRIES;

  writeFileSync(statsPath, JSON.stringify(existingStats, null, 2));
  console.log(`\nSaved ${key} stats to data/${fileName}`);
}

export function forceGC() {
  if (global.gc) {
    global.gc();
  } else {
    console.warn("GC not exposed. Run with --expose-gc flag for accurate memory measurements.");
  }
}
