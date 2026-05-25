import { NUM_ENTRIES, benchmarkStats, saveStats, forceGC } from "../benchmark_utils.mjs";

// --- FACTORIES ---

function createPlainObject(index) {
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

const stats = {};

async function runBenchmark() {
  console.log(`Starting Plain Idiomatic Idiomatic Fixed Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let plainArray = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Plain Idiomatic Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray[i] = createPlainObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Plain Idiomatic)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray[i]) dummyCount++;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Plain Idiomatic)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += plainArray[i].details.ag.a.s.r;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Plain Idiomatic)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray[i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Plain Idiomatic)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray[i].details.la += 1;
    }
  });

  console.log("\n--- DELETE PROPERTY ---");
  benchmarkStats("Delete Property (Plain Idiomatic)", stats, "deletePropertyTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      delete plainArray[i].details.ud;
    }
  });

  // Clear memory
  plainArray.length = 0;
  plainArray = null;
  forceGC();

  // Save Stats
  saveStats("stats.json", "plain object idiomatic", stats);
}

runBenchmark().catch(console.error);
