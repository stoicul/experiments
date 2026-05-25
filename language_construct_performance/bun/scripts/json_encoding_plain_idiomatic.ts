import { benchmarkStats, saveStats } from "./benchmark_utils";

function createPlainObject(index: number) {
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
        columnArray[r] = createPlainObject(c * rows + r);
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
      fs.writeFileSync(path.join("data", "stats_json_plain_idiomatic.json"), JSON.stringify(jsonStats, null, 2));
      console.log("\nSaved json stats to data/stats_json_plain_idiomatic.json");
    });
  });
}

runBenchmark().catch(console.error);
