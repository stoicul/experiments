import { NUM_ENTRIES, benchmarkStats, saveStats } from "./benchmark_utils";

// --- VALUE OBJECT CLASSES ---

class MinimalValueObjectNode {
  label: string;
  id: string;
  accessTo: string[];
  details: any;

  edgeTo?: string[];

  constructor(label: string, id: string, accessTo: string[], details: any, edgeTo?: string[]) {
    this.label = label;
    this.id = id;
    this.accessTo = accessTo;
    this.details = details;

    if (edgeTo !== undefined) this.edgeTo = edgeTo;
  }
}

// --- FACTORIES ---

function createValueObject(index: number) {
  const edgeTo = index % 2 === 0 ? ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"] : undefined;
  const ut = index % 3 === 0 ? 2 : undefined;
  const ag = index % 4 === 0 ? {
    s: { t: 167 },
    a: { t: 3187978, s: { t: 3187978, s: 3149311, r: 42506 } }
  } : undefined;

  const details: any = {
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
  };

  if (ut !== undefined) details.ut = ut;
  if (ag !== undefined) details.ag = ag;

  return new MinimalValueObjectNode(
    "user-dev-test-" + index,
    "u." + (16406 + index),
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    details,
    edgeTo
  );
}

// --- BENCHMARK RUNNER ---

const stats: Record<string, any> = {};

async function runBenchmark() {
  console.log(`Starting Value Object Variable Properties Minimal Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let valueObjArray: MinimalValueObjectNode[] | null = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Value Object Minimal Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray![i] = createValueObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Value Object Minimal)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray![i]) continue;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Value Object Minimal)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += valueObjArray![i].details?.ag?.a?.s?.r || 0;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Value Object Minimal)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray![i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Value Object Minimal)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray![i].details.la += 1;
    }
  });

  console.log("\n--- DELETE PROPERTY ---");
  benchmarkStats("Delete Property (Value Object Minimal)", stats, "deletePropertyTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      delete valueObjArray![i].details.ud;
    }
  });

  // Clear memory
  valueObjArray.length = 0;
  valueObjArray = null;
  Bun.gc(true);

  // Save Stats
  saveStats("stats_variable.json", "value object minimal", stats);
}

runBenchmark().catch(console.error);
