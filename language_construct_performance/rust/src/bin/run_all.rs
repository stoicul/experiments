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
    let group = std::env::args().nth(1).unwrap_or_else(|| "all".to_string());
    println!("Running benchmarks (group: {}) sequentially in isolated processes...\n", group);

    let objects_scripts = vec![
        "plain_obj_naive_fixed_properties",
        "plain_obj_idiomatic_fixed_properties",
        "value_obj_naive_fixed_properties",
        "value_obj_idiomatic_fixed_properties",
        "plain_obj_naive_variable_properties",
        "plain_obj_idiomatic_variable_properties",
        "value_obj_naive_variable_properties",
        "value_obj_idiomatic_variable_properties",
    ];

    let json_scripts = vec![
        "json_encoding_plain_naive",
        "json_encoding_plain_idiomatic",
        "json_encoding_value_naive",
        "json_encoding_value_idiomatic",
    ];

    let scripts = match group.as_str() {
        "objects" => objects_scripts,
        "json" => json_scripts,
        _ => {
            let mut all = objects_scripts;
            all.extend(json_scripts);
            all
        }
    };

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
