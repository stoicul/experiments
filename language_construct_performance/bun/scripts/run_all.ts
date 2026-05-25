import { spawnSync } from "child_process";

const group = process.argv[2] || "all";
console.log(`Running benchmarks (group: ${group}) sequentially in isolated processes...\n`);

const objectsScripts = [
    'scripts/plain_obj_naive_fixed_properties.ts',
    'scripts/plain_obj_idiomatic_fixed_properties.ts',
    'scripts/value_obj_naive_fixed_properties.ts',
    'scripts/value_obj_idiomatic_fixed_properties.ts',
    'scripts/plain_obj_naive_variable_properties.ts',
    'scripts/plain_obj_idiomatic_variable_properties.ts',
    'scripts/value_obj_naive_variable_properties.ts',
    'scripts/value_obj_idiomatic_variable_properties.ts'
  ];

const jsonScripts = [
    'scripts/json_encoding_plain_naive.ts',
    'scripts/json_encoding_plain_idiomatic.ts',
    'scripts/json_encoding_value_naive.ts',
    'scripts/json_encoding_value_idiomatic.ts'
  ];

let scripts = [];
if (group === "objects") {
  scripts = objectsScripts;
} else if (group === "json") {
  scripts = jsonScripts;
} else {
  scripts = [...objectsScripts, ...jsonScripts];
}

for (const script of scripts) {
  console.log(`=========================================`);
  console.log(`Running ${script}...`);
  console.log(`=========================================`);
  const result = spawnSync("bun", ["run", script], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Error running ${script}`);
    process.exit(result.status || 1);
  }
  console.log("\n");
}

console.log("All benchmarks completed!");

console.log("=========================================");
console.log("Updating README.md from stats...");
console.log("=========================================");
const updateResult = spawnSync("bun", ["run", "scripts/update_readme.ts"], { stdio: "inherit" });
if (updateResult.status !== 0) {
  console.error("Error updating README.md");
} else {
  console.log("README.md successfully updated!");
}

