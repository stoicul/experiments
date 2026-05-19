import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const NUM_ENTRIES = parseInt(process.env.NUM_ENTRIES || "10000000", 10);

// --- STRICT CLASSES ---

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
  s: number;
  cpd: number;
  pcb: string;
  lld: number;
  cd: number;
  cb: string;
  ub: string;
  ud: number;
  ua: number;

  ut?: number;
  ag?: AgType;

  constructor(
    provider: string, accountId: string, principal: boolean, tags: string[],
    mfas: string, la: number, s: number, cpd: number, pcb: string,
    lld: number, cd: number, cb: string, ub: string, ud: number, ua: number,
    ut?: number, ag?: AgType
  ) {
    this.provider = provider; this.accountId = accountId; this.principal = principal;
    this.tags = tags; this.mfas = mfas; this.la = la; this.s = s;
    this.cpd = cpd; this.pcb = pcb; this.lld = lld; this.cd = cd; this.cb = cb;
    this.ub = ub; this.ud = ud; this.ua = ua;

    // Conditionally adding properties to force different object shapes (polymorphism)
    if (ut !== undefined) this.ut = ut;
    if (ag !== undefined) this.ag = ag;
  }
}

class StrictNode {
  label: string;
  id: string;
  accessTo: string[];
  details: DetailsType;

  edgeTo?: string[];

  constructor(label: string, id: string, accessTo: string[], details: DetailsType, edgeTo?: string[]) {
    this.label = label;
    this.id = id;
    this.accessTo = accessTo;
    this.details = details;

    if (edgeTo !== undefined) this.edgeTo = edgeTo;
  }
}

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

function createStrictObject(index: number) {
  const edgeTo = index % 2 === 0 ? ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"] : undefined;
  const ut = index % 3 === 0 ? 2 : undefined;
  const ag = index % 4 === 0 ? new AgType(
    new AgSType(167),
    new AgAType(
      3187978,
      new AgASubSType(3187978, 3149311, 42506)
    )
  ) : undefined;

  return new StrictNode(
    "user-dev-test-" + index,
    "u." + (16406 + index),
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    new DetailsType(
      "aws", "568709751681", true, ["aKIAYI2NaRQPOT", "dev testing local"], "",
      1772454942 + (index % 1000), 1, 0, "-", 0, 1763097939000, "-", "-", 0, 1772526871591,
      ut, ag
    ),
    edgeTo
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
  plain: {
    creationTimeMs?: number;
    memoryUsedMB?: number;
    plainTraversalTimeMs?: number;
    propAccessTimeMs?: number;
    filterTimeMs?: number;
    mutationTimeMs?: number;
  };
  strict: {
    creationTimeMs?: number;
    memoryUsedMB?: number;
    plainTraversalTimeMs?: number;
    propAccessTimeMs?: number;
    filterTimeMs?: number;
    mutationTimeMs?: number;
  };
} = {
  numEntries: NUM_ENTRIES,
  plain: {},
  strict: {}
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
    console.log(`${name} - Time: ${timeMs}ms, Memory Used (Heap): ${memoryMB} MB`);
  } else {
    console.log(`${name}: ${timeMs}ms`);
  }

  return result;
}

async function runBenchmark() {
  console.log(`Starting Variable Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  const plainArray: ReturnType<typeof createPlainObject>[] = new Array(NUM_ENTRIES);
  const strictArray: StrictNode[] = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Plain Creation", stats.plain, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray[i] = createPlainObject(i);
    }
  }, true);

  benchmarkStats("Strict Creation", stats.strict, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      strictArray[i] = createStrictObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Plain)", stats.plain, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray[i]) dummyCount++;
    }
    return dummyCount;
  });

  benchmarkStats("Plain Traversal (Strict)", stats.strict, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (strictArray[i]) continue;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Plain)", stats.plain, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += plainArray[i].details?.ag?.a?.s?.r || 0;
    }
    return sum;
  });

  benchmarkStats("Property Access (Strict)", stats.strict, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += strictArray[i].details?.ag?.a?.s?.r || 0;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Plain)", stats.plain, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray[i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  benchmarkStats("Filtering (Strict)", stats.strict, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (strictArray[i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Plain)", stats.plain, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray[i].details.la += 1;
    }
  });

  benchmarkStats("Mutation (Strict)", stats.strict, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      strictArray[i].details.la += 1;
    }
  });

  // Clear memory
  plainArray.length = 0;
  strictArray.length = 0;
  Bun.gc(true);

  // Save Stats
  if (!existsSync("data")) mkdirSync("data");
  writeFileSync(join("data", "stats_variable.json"), JSON.stringify(stats, null, 2));
  console.log("\nSaved stats to data/stats_variable.json");
}

runBenchmark().catch(console.error);
