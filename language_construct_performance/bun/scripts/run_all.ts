import { spawnSync } from "child_process";

const group = process.argv[2] || "all";
console.log(`Running benchmarks (group: ${group}) sequentially in isolated processes...\n`);

const objectsScripts = [
    'scripts/naive/plain_obj_fixed_properties.ts',
    'scripts/idiomatic/plain_obj_fixed_properties.ts',
    'scripts/naive/value_obj_fixed_properties.ts',
    'scripts/idiomatic/value_obj_fixed_properties.ts',
    'scripts/naive/plain_obj_variable_properties.ts',
    'scripts/idiomatic/plain_obj_variable_properties.ts',
    'scripts/naive/value_obj_variable_properties.ts',
    'scripts/idiomatic/value_obj_variable_properties.ts'
  ];

const jsonScripts = [
    'scripts/naive/json_encoding.ts',
    'scripts/idiomatic/json_encoding.ts',
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

