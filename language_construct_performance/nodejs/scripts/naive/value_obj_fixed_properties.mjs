import { NUM_ENTRIES, benchmarkStats, saveStats, forceGC } from "../benchmark_utils.mjs";

// --- VALUE OBJECT CLASSES ---

class AgSType {
  constructor(t) {
    this.t = t;
  }
}

class AgASubSType {
  constructor(t, s, r) {
    this.t = t;
    this.s = s;
    this.r = r;
  }
}

class AgAType {
  constructor(t, s) {
    this.t = t;
    this.s = s;
  }
}

class AgType {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
}

class DetailsType {
  constructor(
    provider, accountId, principal, tags,
    mfas, la, ut, s, cpd, pcb,
    lld, cd, cb, ub, ud, ua, ag
  ) {
    this.provider = provider; this.accountId = accountId; this.principal = principal;
    this.tags = tags; this.mfas = mfas; this.la = la; this.ut = ut; this.s = s;
    this.cpd = cpd; this.pcb = pcb; this.lld = lld; this.cd = cd; this.cb = cb;
    this.ub = ub; this.ud = ud; this.ua = ua; this.ag = ag;
  }
}

class ValueObjectNode {
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
  return new ValueObjectNode(
    "user-dev-test-" + index,
    "u." + (16406 + index),
    ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"],
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    new DetailsType(
      "aws", "568709751681", true, ["aKIAYI2NaRQPOT", "dev testing local"], "",
      1772454942 + (index % 1000), 2, 1, 0, "-", 0, 1763097939000, "-", "-", 0, 1772526871591,
      new AgType(
        new AgSType(167),
        new AgAType(
          3187978,
          new AgASubSType(3187978, 3149311, 42506)
        )
      )
    )
  );
}

// --- BENCHMARK RUNNER ---

const stats = {};

async function runBenchmark() {
  console.log(`Starting Value Object Naive Naive Fixed Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let valueObjArray = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Value Object Naive Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray[i] = createValueObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Value Object Naive)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray[i]) continue;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Value Object Naive)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += valueObjArray[i].details.ag.a.s.r;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Value Object Naive)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray[i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Value Object Naive)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray[i].details.la += 1;
    }
  });

  console.log("\n--- DELETE PROPERTY ---");
  benchmarkStats("Delete Property (Value Object Naive)", stats, "deletePropertyTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      delete valueObjArray[i].details.ud;
    }
  });

  // Clear memory
  valueObjArray.length = 0;
  valueObjArray = null;
  forceGC();

  // Save Stats
  saveStats("stats.json", "value object naive", stats);
}

runBenchmark().catch(console.error);
