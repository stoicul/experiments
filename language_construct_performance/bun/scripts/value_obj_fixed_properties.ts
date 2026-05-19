import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const NUM_ENTRIES = parseInt(process.env.NUM_ENTRIES || "20000000", 10);

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
  valueObject: {
    creationTimeMs?: number;
    memoryUsedMB?: number;
    plainTraversalTimeMs?: number;
    propAccessTimeMs?: number;
    filterTimeMs?: number;
    mutationTimeMs?: number;
  };
} = {
  numEntries: NUM_ENTRIES,
  valueObject: {}
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
  console.log(`Starting Value Object Fixed Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let valueObjArray: ValueObjectNode[] | null = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Value Object Creation", stats.valueObject, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray![i] = createValueObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Value Object)", stats.valueObject, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray![i]) continue;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Value Object)", stats.valueObject, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += valueObjArray![i].details.ag.a.s.r;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Value Object)", stats.valueObject, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (valueObjArray![i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Value Object)", stats.valueObject, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      valueObjArray![i].details.la += 1;
    }
  });

  // Clear memory
  valueObjArray.length = 0;
  valueObjArray = null;
  Bun.gc(true);

  // Save Stats
  if (!existsSync("data")) mkdirSync("data");
  const statsPath = join("data", "stats.json");
  let existingStats: any = { numEntries: NUM_ENTRIES, "plain object": {}, "value object": {} };
  if (existsSync(statsPath)) {
    try { existingStats = JSON.parse(readFileSync(statsPath, "utf-8")); } catch (e) {}
  }
  
  existingStats["value object"] = stats.valueObject;
  existingStats.numEntries = NUM_ENTRIES;

  writeFileSync(statsPath, JSON.stringify(existingStats, null, 2));
  console.log("\nSaved value object stats to data/stats.json");
}

runBenchmark().catch(console.error);
