use serde_json::{Value, json};
use std::fs;
use std::path::Path;

fn format_mb(mb: &Value) -> String {
    let val = match mb {
        Value::Number(n) => n.as_f64().unwrap_or(0.0),
        _ => 0.0,
    };
    let gb = val / 1024.0;
    format!("{} MB (~{:.1} GB)", val as i64, gb)
}

fn format_ms(ms: &Value) -> String {
    let val = match ms {
        Value::Number(n) => n.as_i64().unwrap_or(0),
        _ => 0,
    };
    
    let s = val.to_string();
    let n = s.len();
    if n <= 3 {
        return format!("{} ms", s);
    }
    
    let mut b = String::new();
    for (i, c) in s.chars().enumerate() {
        if i > 0 && (n - i) % 3 == 0 {
            b.push(',');
        }
        b.push(c);
    }
    format!("{} ms", b)
}

fn main() {
    let readme_path = Path::new("README.md");
    let stats_path = Path::new("data/stats.json");
    let stats_var_path = Path::new("data/stats_variable.json");

    if !readme_path.exists() {
        eprintln!("README.md not found!");
        std::process::exit(1);
    }

    let stats: Option<Value> = fs::read_to_string(stats_path)
        .ok()
        .and_then(|b| serde_json::from_str(&b).ok());

    let stats_var: Option<Value> = fs::read_to_string(stats_var_path)
        .ok()
        .and_then(|b| serde_json::from_str(&b).ok());

    if stats.is_none() && stats_var.is_none() {
        eprintln!("No valid stats files found in data/ directory!");
        std::process::exit(1);
    }

    let mut num_entries: f64 = 20000000.0;
    if let Some(s) = &stats {
        if let Some(n) = s.get("numEntries").and_then(|v| v.as_f64()) {
            num_entries = n;
        }
    } else if let Some(sv) = &stats_var {
        if let Some(n) = sv.get("numEntries").and_then(|v| v.as_f64()) {
            num_entries = n;
        }
    }

    let s_num = (num_entries as i64).to_string();
    let mut formatted_entries = String::new();
    for (i, c) in s_num.chars().enumerate() {
        if i > 0 && (s_num.len() - i) % 3 == 0 {
            formatted_entries.push(',');
        }
        formatted_entries.push(c);
    }

    let mut new_section = String::from("<!-- BENCHMARK_RESULTS_START -->\n");
    new_section.push_str(&format!("## Benchmark Results ({} Entries)\n\n", formatted_entries));
    new_section.push_str(&format!("Here are the actual measured results from running the isolated benchmark suite under Rust with **{} entries**:\n", formatted_entries));

    if let Some(s) = stats {
        new_section.push_str("\n### 1. Fixed Properties (Uniform Structural Shape)\n\n");
        new_section.push_str("| Metric | Plain Object | Value Object | Value Object Minimal |\n");
        new_section.push_str("| :--- | :---: | :---: | :---: | :---: |\n");

        if let (Some(po), Some(vo), Some(vom)) = (
            s.get("plain object"),
            s.get("value object"),
            s.get("value object minimal"),
        ) {
            new_section.push_str(&format!("| **Creation Time** | {} | {} | {} |\n", format_ms(&po["creationTimeMs"]), format_ms(&vo["creationTimeMs"]), format_ms(&vom["creationTimeMs"])));
            new_section.push_str(&format!("| **Memory Used (Heap)** | {} | {} | {} |\n", format_mb(&po["memoryUsedMB"]), format_mb(&vo["memoryUsedMB"]), format_mb(&vom["memoryUsedMB"])));
            new_section.push_str(&format!("| **Traversal Time** | {} | {} | {} |\n", format_ms(&po["plainTraversalTimeMs"]), format_ms(&vo["plainTraversalTimeMs"]), format_ms(&vom["plainTraversalTimeMs"])));
            new_section.push_str(&format!("| **Property Access Time** | {} | {} | {} |\n", format_ms(&po["propAccessTimeMs"]), format_ms(&vo["propAccessTimeMs"]), format_ms(&vom["propAccessTimeMs"])));
            new_section.push_str(&format!("| **Filtering Time** | {} | {} | {} |\n", format_ms(&po["filterTimeMs"]), format_ms(&vo["filterTimeMs"]), format_ms(&vom["filterTimeMs"])));
            new_section.push_str(&format!("| **Mutation Time** | {} | {} | {} |\n", format_ms(&po["mutationTimeMs"]), format_ms(&vo["mutationTimeMs"]), format_ms(&vom["mutationTimeMs"])));
            new_section.push_str(&format!("| **Delete Property Time** | {} | {} | {} |\n", format_ms(&po["deletePropertyTimeMs"]), format_ms(&vo["deletePropertyTimeMs"]), format_ms(&vom["deletePropertyTimeMs"])));
        }
    }

    if let Some(sv) = stats_var {
        new_section.push_str("\n### 2. Variable Properties (Polymorphic Shapes)\n\n");
        new_section.push_str("| Metric | Plain Object | Value Object | Value Object Minimal |\n");
        new_section.push_str("| :--- | :---: | :---: | :---: | :---: |\n");

        if let (Some(po), Some(vo), Some(vom)) = (
            sv.get("plain object"),
            sv.get("value object"),
            sv.get("value object minimal"),
        ) {
            new_section.push_str(&format!("| **Creation Time** | {} | {} | {} |\n", format_ms(&po["creationTimeMs"]), format_ms(&vo["creationTimeMs"]), format_ms(&vom["creationTimeMs"])));
            new_section.push_str(&format!("| **Memory Used (Heap)** | {} | {} | {} |\n", format_mb(&po["memoryUsedMB"]), format_mb(&vo["memoryUsedMB"]), format_mb(&vom["memoryUsedMB"])));
            new_section.push_str(&format!("| **Traversal Time** | {} | {} | {} |\n", format_ms(&po["plainTraversalTimeMs"]), format_ms(&vo["plainTraversalTimeMs"]), format_ms(&vom["plainTraversalTimeMs"])));
            new_section.push_str(&format!("| **Property Access Time** | {} | {} | {} |\n", format_ms(&po["propAccessTimeMs"]), format_ms(&vo["propAccessTimeMs"]), format_ms(&vom["propAccessTimeMs"])));
            new_section.push_str(&format!("| **Filtering Time** | {} | {} | {} |\n", format_ms(&po["filterTimeMs"]), format_ms(&vo["filterTimeMs"]), format_ms(&vom["filterTimeMs"])));
            new_section.push_str(&format!("| **Mutation Time** | {} | {} | {} |\n", format_ms(&po["mutationTimeMs"]), format_ms(&vo["mutationTimeMs"]), format_ms(&vom["mutationTimeMs"])));
            new_section.push_str(&format!("| **Delete Property Time** | {} | {} | {} |\n", format_ms(&po["deletePropertyTimeMs"]), format_ms(&vo["deletePropertyTimeMs"]), format_ms(&vom["deletePropertyTimeMs"])));
        }
    }

    
    let stats_json_path = Path::new("data/stats_json.json");
    if let Ok(b) = fs::read_to_string(stats_json_path) {
        if let Ok(data_json) = serde_json::from_str::<Value>(&b) {
            let r = data_json.get("rows").and_then(|v| v.as_u64()).unwrap_or(0);
            let c = data_json.get("columns").and_then(|v| v.as_u64()).unwrap_or(0);
            let empty_obj = json!({});
            let n = data_json.get("naive").unwrap_or(&empty_obj);
            let i = data_json.get("idiomatic").unwrap_or(&empty_obj);
            
            let sr = r.to_string();
            let mut formatted_r = String::new();
            let len = sr.len();
            for (idx, ch) in sr.chars().enumerate() {
                if idx > 0 && (len - idx) % 3 == 0 {
                    formatted_r.push(',');
                }
                formatted_r.push(ch);
            }

            new_section.push_str(&format!("\n\n### 3. JSON Encoding/Decoding ({} cols x {} rows)\n\n", c, formatted_r));
            new_section.push_str("| Metric | Naive | Idiomatic |\n");
            new_section.push_str("| :--- | :---: | :---: |\n");
            new_section.push_str(&format!("| **Creation Time** | {} | {} |\n", format_ms(n.get("creationTimeMs").unwrap_or(&empty_obj)), format_ms(i.get("creationTimeMs").unwrap_or(&empty_obj))));
            new_section.push_str(&format!("| **Memory Used (Heap)** | {} | {} |\n", format_mb(n.get("memoryUsedMB").unwrap_or(&empty_obj)), format_mb(i.get("memoryUsedMB").unwrap_or(&empty_obj))));
            new_section.push_str(&format!("| **JSON Encoding Time** | {} | {} |\n", format_ms(n.get("jsonEncodeTimeMs").unwrap_or(&empty_obj)), format_ms(i.get("jsonEncodeTimeMs").unwrap_or(&empty_obj))));
            new_section.push_str(&format!("| **JSON Decoding Time** | {} | {} |\n", format_ms(n.get("jsonDecodeTimeMs").unwrap_or(&empty_obj)), format_ms(i.get("jsonDecodeTimeMs").unwrap_or(&empty_obj))));
            new_section.push_str(&format!("| **JSON File Write Time** | {} | {} |\n", format_ms(n.get("jsonFileWriteTimeMs").unwrap_or(&empty_obj)), format_ms(i.get("jsonFileWriteTimeMs").unwrap_or(&empty_obj))));
            new_section.push_str(&format!("| **JSON File Read Time** | {} | {} |\n", format_ms(n.get("jsonFileReadTimeMs").unwrap_or(&empty_obj)), format_ms(i.get("jsonFileReadTimeMs").unwrap_or(&empty_obj))));
            new_section.push_str(&format!("| **JSON File Decode Time** | {} | {} |\n", format_ms(n.get("jsonFileDecodeTimeMs").unwrap_or(&empty_obj)), format_ms(i.get("jsonFileDecodeTimeMs").unwrap_or(&empty_obj))));
        }
    }

    new_section.push_str("\n<!-- BENCHMARK_RESULTS_END -->");

    let mut readme_content = fs::read_to_string(readme_path).unwrap_or_default();

    let start_marker = "<!-- BENCHMARK_RESULTS_START -->";
    let end_marker = "<!-- BENCHMARK_RESULTS_END -->";

    if let (Some(start_idx), Some(end_idx_start)) = (
        readme_content.find(start_marker),
        readme_content.find(end_marker),
    ) {
        let end_idx = end_idx_start + end_marker.len();
        readme_content.replace_range(start_idx..end_idx, &new_section);
    } else {
        readme_content.push_str("\n\n");
        readme_content.push_str(&new_section);
    }

    fs::write(readme_path, readme_content).unwrap();
    println!("Successfully updated README.md from stats!");
}
