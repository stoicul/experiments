import { NUM_ENTRIES, benchmarkStats, saveStats, forceGC } from "./benchmark_utils.mjs";

// --- VALUE OBJECT CLASSES ---

class MinimalValueObjectNode {
  constructor(label, id, edgeTo, accessTo, details) {
    this.label = label;
    this.id = id;
    this.edgeTo = edgeTo;
    this.accessTo = accessTo;
    this.details = details;
  }
}

// --- FACTORIES ---

function createValueObject(index) {
  return new MinimalValueObjectNode(
    "user-dev-test-" + index,
    "u." + (16406 + index),
    ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"],
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    {
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
  );
}

// --- BENCHMARK RUNNER ---

const stats = {};

async function runBenchmark() {
  console.log(`Starting Value Object Fixed Properties Minimal Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let valueObjArray = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Value Object Minimal Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray[i] = createValueObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Value Object Minimal)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray[i]) continue;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Value Object Minimal)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += valueObjArray[i].details.ag.a.s.r;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Value Object Minimal)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray[i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Value Object Minimal)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray[i].details.la += 1;
    }
  });

  console.log("\n--- DELETE PROPERTY ---");
  benchmarkStats("Delete Property (Value Object Minimal)", stats, "deletePropertyTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      delete valueObjArray[i].details.ud;
    }
  });

  // Clear memory
  valueObjArray.length = 0;
  valueObjArray = null;
  forceGC();

  // Save Stats
  saveStats("stats.json", "value object minimal", stats);
}

runBenchmark().catch(console.error);
