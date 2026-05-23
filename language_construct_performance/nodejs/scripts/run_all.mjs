import { spawnSync } from "child_process";

console.log("Running all benchmarks sequentially in isolated processes...\n");

const scripts = [
  "scripts/plain_obj_fixed_properties.mjs",
  "scripts/value_obj_fixed_properties.mjs",
  "scripts/value_obj_minimal_fixed_properties.mjs",
  "scripts/plane_obj_variable_properties.mjs",
  "scripts/value_obj_variable_properties.mjs",
  "scripts/value_obj_minimal_variable_properties.mjs"
];

for (const script of scripts) {
  console.log(`=========================================`);
  console.log(`Running ${script}...`);
  console.log(`=========================================`);
  const result = spawnSync("node", ["--expose-gc", "--max-old-space-size=16384", script], { stdio: "inherit" });
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
const updateResult = spawnSync("node", ["--expose-gc", "--max-old-space-size=16384", "scripts/update_readme.mjs"], { stdio: "inherit" });
if (updateResult.status !== 0) {
  console.error("Error updating README.md");
} else {
  console.log("README.md successfully updated!");
}
