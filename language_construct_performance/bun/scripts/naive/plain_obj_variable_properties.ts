import { NUM_ENTRIES, benchmarkStats, saveStats } from "./benchmark_utils";

// --- FACTORIES ---

function createPlainObject(index: number): any {
  const obj: any = {
    label: "user-dev-test-" + index,
    id: "u." + (16406 + index),
    accessTo: ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    details: {
      provider: "aws",
      accountId: "568709751681",
      principal: true,
      tags: ["aKIAYI2NaRQPOT", "dev testing local"],
      mfas: "",
      la: 1772454942 + (index % 1000),
      s: 1,
      cpd: 0,
      pcb: "-",
      lld: 0,
      cd: 1763097939000,
      cb: "-",
      ub: "-",
      ud: 0,
      ua: 1772526871591
    }
  };

  if (index % 2 === 0) {
    obj.edgeTo = ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"];
  }

  if (index % 3 === 0) {
    obj.details.ut = 2;
  }

  if (index % 4 === 0) {
    obj.details.ag = {
      s: { t: 167 },
      a: { t: 3187978, s: { t: 3187978, s: 3149311, r: 42506 } }
    };
  }

  return obj;
}

// --- BENCHMARK RUNNER ---

const stats: Record<string, any> = {};

async function runBenchmark() {
  console.log(`Starting Plain Naive Variable Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let plainArray: ReturnType<typeof createPlainObject>[] | null = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Plain Naive Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i] = createPlainObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Plain Naive)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray![i]) dummyCount++;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Plain Naive)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += plainArray![i].details?.ag?.a?.s?.r || 0;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Plain Naive)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray![i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Plain Naive)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i].details.la += 1;
    }
  });

  console.log("\n--- DELETE PROPERTY ---");
  benchmarkStats("Delete Property (Plain Naive)", stats, "deletePropertyTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      delete plainArray![i].details.ud;
    }
  });

  // Clear memory
  plainArray.length = 0;
  plainArray = null;
  Bun.gc(true);

  // Save Stats
  saveStats("stats_variable.json", "plain object naive", stats);
}

runBenchmark().catch(console.error);
