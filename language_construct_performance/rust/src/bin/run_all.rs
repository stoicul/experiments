use std::process::{Command, Stdio};

fn run_script(name: &str) -> Result<(), std::io::Error> {
    println!("=========================================");
    println!("Running {}...", name);
    println!("=========================================");

    let mut cmd = Command::new("cargo");
    cmd.arg("run").arg("--release").arg("--bin").arg(name);
    cmd.stdout(Stdio::inherit());
    cmd.stderr(Stdio::inherit());

    let status = cmd.status()?;
    if !status.success() {
        eprintln!("Error running {}", name);
        std::process::exit(1);
    }
    println!("\n");
    Ok(())
}

fn main() {
    println!("Running all benchmarks sequentially in isolated processes...\n");

    let scripts = vec![
        "plain_obj_fixed_properties",
        "value_obj_fixed_properties",
        "value_obj_minimal_fixed_properties",
        "plain_obj_variable_properties",
        "value_obj_variable_properties",
        "value_obj_minimal_variable_properties",
        "json_encoding",
        "json_encoding_struct",
    ];

    for script in scripts {
        if let Err(e) = run_script(script) {
            eprintln!("Failed to execute script {}: {}", script, e);
            std::process::exit(1);
        }
    }

    println!("All benchmarks completed!");
    println!("=========================================");
    println!("Updating README.md from stats...");
    println!("=========================================");

    let mut cmd = Command::new("cargo");
    cmd.arg("run").arg("--release").arg("--bin").arg("update_readme");
    cmd.stdout(Stdio::inherit());
    cmd.stderr(Stdio::inherit());

    match cmd.status() {
        Ok(status) if status.success() => {
            println!("README.md successfully updated!");
        }
        _ => {
            eprintln!("Error updating README.md");
            std::process::exit(1);
        }
    }
}
