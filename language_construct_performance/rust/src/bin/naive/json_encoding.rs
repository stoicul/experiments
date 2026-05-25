use benchmark::benchmark_utils::{benchmark_stats, TrackingAllocator};
use serde_json::{json, Map, Value};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator::new();

fn create_plain_object_fixed(index: usize) -> HashMap<String, Value> {
    let mut map = HashMap::new();
    map.insert("label".to_string(), json!(format!("user-dev-test-{}", index)));
    map.insert("id".to_string(), json!(format!("u.{}", 16406 + index)));
    map.insert("edgeTo".to_string(), json!(vec!["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"]));
    map.insert("accessTo".to_string(), json!(vec!["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"]));
    
    let mut details = Map::new();
    details.insert("provider".to_string(), json!("aws"));
    details.insert("accountId".to_string(), json!("568709751681"));
    details.insert("principal".to_string(), json!(true));
    details.insert("tags".to_string(), json!(vec!["aKIAYI2NaRQPOT", "dev testing local"]));
    details.insert("mfas".to_string(), json!(""));
    details.insert("la".to_string(), json!(1772454942 + (index as i64 % 1000)));
    details.insert("ut".to_string(), json!(2));
    details.insert("s".to_string(), json!(1));
    details.insert("cpd".to_string(), json!(0));
    details.insert("pcb".to_string(), json!("-"));
    details.insert("lld".to_string(), json!(0));
    details.insert("cd".to_string(), json!(1763097939000_u64));
    details.insert("cb".to_string(), json!("-"));
    details.insert("ub".to_string(), json!("-"));
    details.insert("ud".to_string(), json!(0));
    details.insert("ua".to_string(), json!(1772526871591_u64));

    let mut s_ag = Map::new();
    s_ag.insert("t".to_string(), json!(167));
    
    let mut s_a = Map::new();
    s_a.insert("t".to_string(), json!(3187978));
    s_a.insert("s".to_string(), json!(3149311));
    s_a.insert("r".to_string(), json!(42506));
    
    let mut a = Map::new();
    a.insert("t".to_string(), json!(3187978));
    a.insert("s".to_string(), json!(s_a));
    
    let mut ag = Map::new();
    ag.insert("s".to_string(), json!(s_ag));
    ag.insert("a".to_string(), json!(a));
    
    details.insert("ag".to_string(), json!(ag));

    map.insert("details".to_string(), json!(details));
    map
}

fn main() {
    let mut stats = Map::new();
    let columns = 3;
    let rows = 50000;
    println!("Starting JSON Encoding/Decoding Benchmark with {} columns x {} rows...", columns, rows);

    let mut two_d_array: Vec<Vec<HashMap<String, Value>>> = Vec::with_capacity(columns);
    for _ in 0..columns {
        two_d_array.push(Vec::new());
    }

    println!("\n--- CREATION ---");
    benchmark_stats("Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for c in 0..columns {
            let mut column_array = Vec::with_capacity(rows);
            for r in 0..rows {
                column_array.push(create_plain_object_fixed(c * rows + r));
            }
            two_d_array[c] = column_array;
        }
    });

    let mut encoded_json = String::new();

    println!("\n--- JSON ENCODING ---");
    benchmark_stats("JSON Encoding", &mut stats, "jsonEncodeTimeMs", true, &GLOBAL, || {
        encoded_json = serde_json::to_string(&two_d_array).unwrap();
    });

    println!("\n--- JSON DECODING ---");
    benchmark_stats("JSON Decoding", &mut stats, "jsonDecodeTimeMs", true, &GLOBAL, || {
        let _decoded: Vec<Vec<HashMap<String, Value>>> = serde_json::from_str(&encoded_json).unwrap();
    });

    
    println!("\n--- JSON FILE WRITE ---");
    benchmark_stats("JSON File Write", &mut stats, "jsonFileWriteTimeMs", true, &GLOBAL, || {
        fs::write("data/test_dump.json", &encoded_json).unwrap();
    });

    let mut read_json = String::new();
    println!("\n--- JSON FILE READ ---");
    benchmark_stats("JSON File Read", &mut stats, "jsonFileReadTimeMs", true, &GLOBAL, || {
        read_json = fs::read_to_string("data/test_dump.json").unwrap();
    });

    println!("\n--- JSON FILE DECODE ---");
    benchmark_stats("JSON File Decode", &mut stats, "jsonFileDecodeTimeMs", true, &GLOBAL, || {
        let _decoded: Vec<Vec<HashMap<String, Value>>> = serde_json::from_str(&read_json).unwrap();
    });

        let _ = fs::remove_file("data/test_dump.json");
    drop(two_d_array);
    drop(encoded_json);

    fs::create_dir_all("data").unwrap_or_default();
    let stats_path = Path::new("data/stats_json.json");
    let mut all_stats = json!({
        "columns": columns,
        "rows": rows,
    });
    if let Ok(content) = fs::read_to_string(stats_path) {
        if let Ok(Value::Object(mut existing)) = serde_json::from_str(&content) {
            for (k, v) in existing.into_iter() {
                all_stats.as_object_mut().unwrap().insert(k, v);
            }
        }
    }
    all_stats.as_object_mut().unwrap().insert("naive".to_string(), json!(stats));
    all_stats.as_object_mut().unwrap().insert("columns".to_string(), json!(columns));
    all_stats.as_object_mut().unwrap().insert("rows".to_string(), json!(rows));
    let b = serde_json::to_string_pretty(&all_stats).unwrap();
    fs::write(stats_path, b).unwrap();
    println!("\nSaved json stats to data/stats_json.json");
}
