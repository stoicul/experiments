import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

function formatMB(mb: number): string {
  const gb = (mb / 1024).toFixed(1);
  return `${mb.toLocaleString()} MB (~${gb} GB)`;
}

function formatMS(ms: number): string {
  return `${ms.toLocaleString()} ms`;
}

function run() {
  const readmePath = join(process.cwd(), "README.md");
  const statsPath = join(process.cwd(), "data", "stats.json");
  const statsVarPath = join(process.cwd(), "data", "stats_variable.json");

  if (!existsSync(readmePath)) {
    console.error("README.md not found!");
    process.exit(1);
  }

  let stats: any = null;
  let statsVar: any = null;

  if (existsSync(statsPath)) {
    try {
      stats = JSON.parse(readFileSync(statsPath, "utf-8"));
    } catch (e) {
      console.error(`Error parsing ${statsPath}:`, e);
    }
  }
  if (existsSync(statsVarPath)) {
    try {
      statsVar = JSON.parse(readFileSync(statsVarPath, "utf-8"));
    } catch (e) {
      console.error(`Error parsing ${statsVarPath}:`, e);
    }
  }

  if (!stats && !statsVar) {
    console.error("No valid stats files found in data/ directory!");
    process.exit(1);
  }

  // Determine number of entries
  const numEntries = stats?.numEntries || statsVar?.numEntries || 20000000;
  const formattedEntries = numEntries.toLocaleString();

  let newSection = `<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (${formattedEntries} Entries)

Here are the actual measured results from running the isolated benchmark suite under Bun.js with **${formattedEntries} entries**:`;

  if (stats) {
    newSection += `

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | ${formatMS(stats["plain object"].creationTimeMs)} | ${formatMS(stats["value object"].creationTimeMs)} | ${formatMS(stats["value object minimal"].creationTimeMs)} |
| **Memory Used (Heap)** | ${formatMB(stats["plain object"].memoryUsedMB)} | ${formatMB(stats["value object"].memoryUsedMB)} | ${formatMB(stats["value object minimal"].memoryUsedMB)} |
| **Traversal Time** | ${formatMS(stats["plain object"].plainTraversalTimeMs)} | ${formatMS(stats["value object"].plainTraversalTimeMs)} | ${formatMS(stats["value object minimal"].plainTraversalTimeMs)} |
| **Property Access Time** | ${formatMS(stats["plain object"].propAccessTimeMs)} | ${formatMS(stats["value object"].propAccessTimeMs)} | ${formatMS(stats["value object minimal"].propAccessTimeMs)} |
| **Filtering Time** | ${formatMS(stats["plain object"].filterTimeMs)} | ${formatMS(stats["value object"].filterTimeMs)} | ${formatMS(stats["value object minimal"].filterTimeMs)} |
| **Mutation Time** | ${formatMS(stats["plain object"].mutationTimeMs)} | ${formatMS(stats["value object"].mutationTimeMs)} | ${formatMS(stats["value object minimal"].mutationTimeMs)} |
| **Delete Property Time** | ${formatMS(stats["plain object"].deletePropertyTimeMs)} | ${formatMS(stats["value object"].deletePropertyTimeMs)} | ${formatMS(stats["value object minimal"].deletePropertyTimeMs)} |`;
  }

  if (statsVar) {
    newSection += `

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: | :---: |
| **Creation Time** | ${formatMS(statsVar["plain object"].creationTimeMs)} | ${formatMS(statsVar["value object"].creationTimeMs)} | ${formatMS(statsVar["value object minimal"].creationTimeMs)} |
| **Memory Used (Heap)** | ${formatMB(statsVar["plain object"].memoryUsedMB)} | ${formatMB(statsVar["value object"].memoryUsedMB)} | ${formatMB(statsVar["value object minimal"].memoryUsedMB)} |
| **Traversal Time** | ${formatMS(statsVar["plain object"].plainTraversalTimeMs)} | ${formatMS(statsVar["value object"].plainTraversalTimeMs)} | ${formatMS(statsVar["value object minimal"].plainTraversalTimeMs)} |
| **Property Access Time** | ${formatMS(statsVar["plain object"].propAccessTimeMs)} | ${formatMS(statsVar["value object"].propAccessTimeMs)} | ${formatMS(statsVar["value object minimal"].propAccessTimeMs)} |
| **Filtering Time** | ${formatMS(statsVar["plain object"].filterTimeMs)} | ${formatMS(statsVar["value object"].filterTimeMs)} | ${formatMS(statsVar["value object minimal"].filterTimeMs)} |
| **Mutation Time** | ${formatMS(statsVar["plain object"].mutationTimeMs)} | ${formatMS(statsVar["value object"].mutationTimeMs)} | ${formatMS(statsVar["value object minimal"].mutationTimeMs)} |
| **Delete Property Time** | ${formatMS(statsVar["plain object"].deletePropertyTimeMs)} | ${formatMS(statsVar["value object"].deletePropertyTimeMs)} | ${formatMS(statsVar["value object minimal"].deletePropertyTimeMs)} |`;
  }

  
  const statsJsonPath = join(process.cwd(), "data", "stats_json.json");
  if (existsSync(statsJsonPath)) {
    try {
      const dataJson = JSON.parse(readFileSync(statsJsonPath, "utf-8"));
      const r = dataJson.rows || 0;
      const c = dataJson.columns || 0;
      const n = dataJson.naive || {};
      const i = dataJson.idiomatic || {};
      newSection += `\n\n### 3. JSON Encoding/Decoding (${c} cols x ${r.toLocaleString()} rows)\n\n`;
      newSection += `| Metric | Naive | Idiomatic |\n`;
      newSection += `| :--- | :---: | :---: |\n`;
      newSection += `| **Creation Time** | ${formatMS(n.creationTimeMs || 0)} | ${formatMS(i.creationTimeMs || 0)} |\n`;
      newSection += `| **Memory Used (Heap)** | ${formatMB(n.memoryUsedMB || 0)} | ${formatMB(i.memoryUsedMB || 0)} |\n`;
      newSection += `| **JSON Encoding Time** | ${formatMS(n.jsonEncodeTimeMs || 0)} | ${formatMS(i.jsonEncodeTimeMs || 0)} |\n`;
      newSection += `| **JSON Decoding Time** | ${formatMS(n.jsonDecodeTimeMs || 0)} | ${formatMS(i.jsonDecodeTimeMs || 0)} |\n`;
      newSection += `| **JSON File Write Time** | ${formatMS(n.jsonFileWriteTimeMs || 0)} | ${formatMS(i.jsonFileWriteTimeMs || 0)} |\n`;
      newSection += `| **JSON File Read Time** | ${formatMS(n.jsonFileReadTimeMs || 0)} | ${formatMS(i.jsonFileReadTimeMs || 0)} |\n`;
      newSection += `| **JSON File Decode Time** | ${formatMS(n.jsonFileDecodeTimeMs || 0)} | ${formatMS(i.jsonFileDecodeTimeMs || 0)} |\n`;
    } catch (e) {}
  }

  newSection += `\n<!-- BENCHMARK_RESULTS_END -->`;

  let readmeContent = readFileSync(readmePath, "utf-8");

  const startMarker = "<!-- BENCHMARK_RESULTS_START -->";
  const endMarker = "<!-- BENCHMARK_RESULTS_END -->";

  if (readmeContent.includes(startMarker) && readmeContent.includes(endMarker)) {
    const startIndex = readmeContent.indexOf(startMarker);
    const endIndex = readmeContent.indexOf(endMarker) + endMarker.length;
    readmeContent = readmeContent.slice(0, startIndex) + newSection + readmeContent.slice(endIndex);
  } else {
    // Replace the section between "## Benchmark Results" and "## Key Findings"
    const regex = /## Benchmark Results \([\d,]+ Entries\)[\s\S]*?(?=## Key Findings)/;
    if (regex.test(readmeContent)) {
      readmeContent = readmeContent.replace(regex, newSection + "\n\n");
    } else {
      console.warn("Could not find ## Benchmark Results section. Appending to end of file.");
      readmeContent += "\n\n" + newSection;
    }
  }

  writeFileSync(readmePath, readmeContent, "utf-8");
  console.log("Successfully updated README.md from stats!");
}

run();
