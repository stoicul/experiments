import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const NUM_ENTRIES = parseInt(process.env.NUM_ENTRIES || "20000000", 10);

// --- FACTORIES ---

function createPlainObject(index: number) {
  return {
    label: "user-dev-test-" + index,
    id: "u." + (16406 + index),
    edgeTo: ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"],
    accessTo: ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    details: {
      provider: "aws",
      accountId: "568709751681",
      principal: true,
      tags: ["aKIAYI2NaRQPOT", "dev testing local"],
      mfas: "",
      la: 1772454942 + (index % 1000),
      ut: 2,
      s: 1,
      cpd: 0,
      pcb: "-",
      lld: 0,
      cd: 1763097939000,
      cb: "-",
      ub: "-",
      ud: 0,
      ua: 1772526871591,
      ag: {
        s: {
          t: 167
        },
        a: {
          t: 3187978,
          s: {
            t: 3187978,
            s: 3149311,
            r: 42506
          }
        }
      }
    }
  };
}

// --- BENCHMARK RUNNER ---

function measureMemory() {
  Bun.gc(true); // Force GC before taking memory snapshot
  const mem = process.memoryUsage();
  return {
    rss: Math.round(mem.rss / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
  };
}

const stats: {
  numEntries: number;
  plain: {
    creationTimeMs?: number;
    memoryUsedMB?: number;
    plainTraversalTimeMs?: number;
    propAccessTimeMs?: number;
    filterTimeMs?: number;
    mutationTimeMs?: number;
  };
} = {
  numEntries: NUM_ENTRIES,
  plain: {}
};

function benchmarkStats<T>(
  name: string,
  statGroup: Record<string, any>,
  statKey: string,
  fn: () => T,
  trackMemory = false
): T {
  const memBefore = trackMemory ? measureMemory() : null;
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  const memAfter = trackMemory ? measureMemory() : null;

  const timeMs = Math.round(t1 - t0);
  statGroup[statKey] = timeMs;

  let memoryMB;
  if (trackMemory) {
    memoryMB = memAfter!.heapUsed - memBefore!.heapUsed;
    statGroup.memoryUsedMB = memoryMB;
    console.log(`${name} - Time: ${timeMs}ms, Memory Used (Heap): ${memoryMB} MB ${JSON.stringify(memAfter)}`);
  } else {
    console.log(`${name}: ${timeMs}ms`);
  }

  return result;
}

async function runBenchmark() {
  console.log(`Starting Plain Fixed Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let plainArray: ReturnType<typeof createPlainObject>[] | null = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Plain Creation", stats.plain, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i] = createPlainObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Plain)", stats.plain, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray![i]) dummyCount++;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Plain)", stats.plain, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += plainArray![i].details.ag.a.s.r;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Plain)", stats.plain, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray![i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Plain)", stats.plain, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i].details.la += 1;
    }
  });

  // Clear memory
  plainArray.length = 0;
  plainArray = null;
  Bun.gc(true);

  // Save Stats
  if (!existsSync("data")) mkdirSync("data");
  const statsPath = join("data", "stats.json");
  let existingStats: any = { numEntries: NUM_ENTRIES, "plain object": {}, "value object": {} };
  if (existsSync(statsPath)) {
    try { existingStats = JSON.parse(readFileSync(statsPath, "utf-8")); } catch (e) {}
  }
  
  existingStats["plain object"] = stats.plain;
  existingStats.numEntries = NUM_ENTRIES;

  writeFileSync(statsPath, JSON.stringify(existingStats, null, 2));
  console.log("\nSaved plain stats to data/stats.json");
}

runBenchmark().catch(console.error);
