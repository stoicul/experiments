import { NUM_ENTRIES, benchmarkStats, saveStats } from "./benchmark_utils";

// --- VALUE OBJECT CLASSES ---

class AgSType {
  t: number;
  constructor(t: number) {
    this.t = t;
  }
}

class AgASubSType {
  t: number;
  s: number;
  r: number;
  constructor(t: number, s: number, r: number) {
    this.t = t;
    this.s = s;
    this.r = r;
  }
}

class AgAType {
  t: number;
  s: AgASubSType;
  constructor(t: number, s: AgASubSType) {
    this.t = t;
    this.s = s;
  }
}

class AgType {
  s: AgSType;
  a: AgAType;
  constructor(s: AgSType, a: AgAType) {
    this.s = s;
    this.a = a;
  }
}

class DetailsType {
  provider: string;
  accountId: string;
  principal: boolean;
  tags: string[];
  mfas: string;
  la: number;
  ut: number;
  s: number;
  cpd: number;
  pcb: string;
  lld: number;
  cd: number;
  cb: string;
  ub: string;
  ud: number;
  ua: number;
  ag: AgType;

  constructor(
    provider: string, accountId: string, principal: boolean, tags: string[],
    mfas: string, la: number, ut: number, s: number, cpd: number, pcb: string,
    lld: number, cd: number, cb: string, ub: string, ud: number, ua: number, ag: AgType
  ) {
    this.provider = provider; this.accountId = accountId; this.principal = principal;
    this.tags = tags; this.mfas = mfas; this.la = la; this.ut = ut; this.s = s;
    this.cpd = cpd; this.pcb = pcb; this.lld = lld; this.cd = cd; this.cb = cb;
    this.ub = ub; this.ud = ud; this.ua = ua; this.ag = ag;
  }
}

class ValueObjectNode {
  label: string;
  id: string;
  edgeTo: string[];
  accessTo: string[];
  details: DetailsType;

  constructor(label: string, id: string, edgeTo: string[], accessTo: string[], details: DetailsType) {
    this.label = label;
    this.id = id;
    this.edgeTo = edgeTo;
    this.accessTo = accessTo;
    this.details = details;
  }
}

// --- FACTORIES ---

function createValueObject(index: number) {
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

const stats: Record<string, any> = {};

async function runBenchmark() {
  console.log(`Starting Value Object Fixed Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let valueObjArray: ValueObjectNode[] | null = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Value Object Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray![i] = createValueObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Value Object)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray![i]) continue;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Value Object)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += valueObjArray![i].details.ag.a.s.r;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Value Object)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray![i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Value Object)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray![i].details.la += 1;
    }
  });

  // Clear memory
  valueObjArray.length = 0;
  valueObjArray = null;
  Bun.gc(true);

  // Save Stats
  saveStats("stats.json", "value object", stats);
}

runBenchmark().catch(console.error);
