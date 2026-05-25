import { benchmarkStats, saveStats, forceGC } from "./benchmark_utils.mjs";

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



const stats = {};

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

  let encodedJSON;

  console.log("\n--- JSON ENCODING ---");
  benchmarkStats("JSON Encoding", stats, "jsonEncodeTimeMs", () => {
    encodedJSON = JSON.stringify(twoDArray);
  }, true);

  console.log("\n--- JSON DECODING ---");
  benchmarkStats("JSON Decoding", stats, "jsonDecodeTimeMs", () => {
    const decoded = JSON.parse(encodedJSON);
  }, true);

  // Clear memory
  twoDArray = null;
  encodedJSON = null;
  forceGC();

  // Save Stats
  import("fs").then(fs => {
    import("path").then(path => {
      if (!fs.existsSync("data")) fs.mkdirSync("data");
      const jsonStats = { columns, rows, stats };
      fs.writeFileSync(path.join("data", "stats_json_value_idiomatic.json"), JSON.stringify(jsonStats, null, 2));
      console.log("\nSaved json stats to data/stats_json_value_idiomatic.json");
    });
  });
}

runBenchmark().catch(console.error);
