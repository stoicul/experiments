import { benchmarkStats, saveStats } from "./benchmark_utils";

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



const stats: Record<string, any> = {};

async function runBenchmark() {
  const columns = 3;
  const rows = 50000;
  console.log(`Starting JSON Encoding/Decoding Benchmark with ${columns} columns x ${rows} rows...`);

  let twoDArray = new Array(columns);

  console.log("\n--- CREATION ---");
  benchmarkStats("Creation", stats, "creationTimeMs", () => {
    for (let c = 0; c < columns; c++) {
      let columnArray = new Array(rows);
      for (let r = 0; r < rows; r++) {
        columnArray[r] = createValueObjectFixed(c * rows + r);
      }
      twoDArray[c] = columnArray;
    }
  }, true);

  let encodedJSON: string;

  console.log("\n--- JSON ENCODING ---");
  benchmarkStats("JSON Encoding", stats, "jsonEncodeTimeMs", () => {
    encodedJSON = JSON.stringify(twoDArray);
  }, true);

  console.log("\n--- JSON DECODING ---");
  benchmarkStats("JSON Decoding", stats, "jsonDecodeTimeMs", () => {
    const decoded = JSON.parse(encodedJSON!);
  }, true);

  // Clear memory
  twoDArray = null as any;
  encodedJSON = null as any;
  Bun.gc(true);

  // Save Stats
  import("fs").then(fs => {
    import("path").then(path => {
      if (!fs.existsSync("data")) fs.mkdirSync("data");
      const jsonStats = { columns, rows, stats };
      fs.writeFileSync(path.join("data", "stats_json_value_naive.json"), JSON.stringify(jsonStats, null, 2));
      console.log("\nSaved json stats to data/stats_json_value_naive.json");
    });
  });
}

runBenchmark().catch(console.error);
