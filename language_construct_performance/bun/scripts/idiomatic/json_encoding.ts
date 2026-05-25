import { benchmarkStats, saveStats } from "./benchmark_utils";
import * as fs from "fs";

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

  
  console.log("\n--- JSON FILE WRITE ---");
  benchmarkStats("JSON File Write", stats, "jsonFileWriteTimeMs", () => {
    fs.writeFileSync("data/test_dump.json", encodedJSON);
  }, true);

  let readJSON;
  console.log("\n--- JSON FILE READ ---");
  benchmarkStats("JSON File Read", stats, "jsonFileReadTimeMs", () => {
    readJSON = fs.readFileSync("data/test_dump.json", "utf-8");
  }, true);

  console.log("\n--- JSON FILE DECODE ---");
  benchmarkStats("JSON File Decode", stats, "jsonFileDecodeTimeMs", () => {
    const decoded = JSON.parse(readJSON);
  }, true);

    if (fs.existsSync("data/test_dump.json")) fs.unlinkSync("data/test_dump.json");
  // Clear memory
  twoDArray = null as any;
  encodedJSON = null as any;
  Bun.gc(true);

  // Save Stats
  import("fs").then(fs => {
    import("path").then(path => {
      if (!fs.existsSync("data")) fs.mkdirSync("data");
      const statsPath = "data/stats_json.json";
      let jsonStats = { columns, rows, stats: {} };
      if (fs.existsSync(statsPath)) {
        try { jsonStats = JSON.parse(fs.readFileSync(statsPath, "utf-8")); } catch(e) {}
      }
      jsonStats["idiomatic"] = stats;
      jsonStats.columns = columns;
      jsonStats.rows = rows;
      fs.writeFileSync(statsPath, JSON.stringify(jsonStats, null, 2));
      console.log("\nSaved json stats to data/stats_json.json");
    });
  });
}

runBenchmark().catch(console.error);
