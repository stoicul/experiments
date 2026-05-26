/**
 * Idiomatic Performance Implementation
 * 
 * This script uses specific constructs optimized for the JavaScript engine (JSC/V8) used by Bun:
 * 
 * 1. Monomorphic Object Shapes (Hidden Classes):
 *    We define explicit interfaces and initialize all properties upfront. 
 *    Even if a property is optional, initializing it to `undefined` rather than 
 *    conditionally adding it later prevents the JS engine from constantly 
 *    transitioning the object into new Hidden Classes. This keeps inline caches 
 *    warm, drastically speeding up property access and iteration.
 * 
 * 2. Avoiding `delete`:
 *    Using the `delete` operator deoptimizes object structures, forcing them 
 *    into a slow "dictionary mode" hash map. We use `obj.prop = undefined` 
 *    instead to safely clear properties while maintaining the fast path.
 */
import { NUM_ENTRIES, benchmarkStats, saveStats } from "../benchmark_utils";

// --- INTERFACES ---

export interface AgSubS {
  t: number;
  s: number;
  r: number;
}

export interface AgA {
  t: number;
  s: AgSubS;
}

export interface Ag {
  s: { t: number };
  a: AgA;
}

export interface VariableDetails {
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
  ud?: number;
  ua: number;
  ut?: number;
  ag?: Ag;
}

export interface VariablePlainObjectNode {
  label: string;
  id: string;
  accessTo: string[];
  details: VariableDetails;
  edgeTo?: string[];
}

// --- FACTORIES ---

function createPlainObject(index: number): VariablePlainObjectNode {
  return {
    label: "user-dev-test-" + index,
    id: "u." + (16406 + index),
    accessTo: ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    edgeTo: index % 2 === 0 ? ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"] : undefined,
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
      ua: 1772526871591,
      ut: index % 3 === 0 ? 2 : undefined,
      ag: index % 4 === 0 ? {
        s: { t: 167 },
        a: { t: 3187978, s: { t: 3187978, s: 3149311, r: 42506 } }
      } : undefined
    }
  };
}

// --- BENCHMARK RUNNER ---

const stats: Record<string, any> = {};

async function runBenchmark() {
  console.log(`Starting Plain Idiomatic Variable Properties Benchmark with ${NUM_ENTRIES.toLocaleString()} entries...`);

  let plainArray: ReturnType<typeof createPlainObject>[] | null = new Array(NUM_ENTRIES);

  console.log("\n--- CREATION ---");
  benchmarkStats("Plain Idiomatic Creation", stats, "creationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i] = createPlainObject(i);
    }
  }, true);

  console.log("\n--- PLAIN TRAVERSAL ---");
  benchmarkStats("Plain Traversal (Plain Idiomatic)", stats, "plainTraversalTimeMs", () => {
    let dummyCount = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray![i]) dummyCount++;
    }
    return dummyCount;
  });

  console.log("\n--- PROPERTY ACCESS ---");
  benchmarkStats("Property Access (Plain Idiomatic)", stats, "propAccessTimeMs", () => {
    let sum = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      sum += plainArray![i].details?.ag?.a?.s?.r || 0;
    }
    return sum;
  });

  console.log("\n--- FILTERING ---");
  benchmarkStats("Filtering (Plain Idiomatic)", stats, "filterTimeMs", () => {
    let matched = 0;
    for (let i = 0; i < NUM_ENTRIES; i++) {
      if (plainArray![i].details.la > 1772455500) matched++;
    }
    return matched;
  });

  console.log("\n--- MUTATION ---");
  benchmarkStats("Mutation (Plain Idiomatic)", stats, "mutationTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i].details.la += 1;
    }
  });

  console.log("\n--- DELETE PROPERTY ---");
  benchmarkStats("Delete Property (Plain Idiomatic)", stats, "deletePropertyTimeMs", () => {
    for (let i = 0; i < NUM_ENTRIES; i++) {
      plainArray![i].details.ud = undefined;
    }
  });

  // Clear memory
  plainArray.length = 0;
  plainArray = null;
  Bun.gc(true);

  // Save Stats
  saveStats("stats_variable.json", "plain object idiomatic", stats);
}

runBenchmark().catch(console.error);
