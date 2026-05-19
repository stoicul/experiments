import { spawnSync } from "child_process";

console.log("Running all benchmarks sequentially in isolated processes...\n");

const scripts = [
  "scripts/plain_obj_fixed_properties.ts",
  "scripts/value_obj_fixed_properties.ts",
  "scripts/value_obj_minimal_fixed_properties.ts",
  "scripts/plane_obj_variable_properties.ts",
  "scripts/value_obj_variable_properties.ts",
  "scripts/value_obj_minimal_variable_properties.ts"
];

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
