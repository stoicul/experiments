use benchmark::benchmark_utils::{benchmark_stats, get_num_entries, save_stats, TrackingAllocator};
use serde_json::{json, Map, Value};
use std::collections::HashMap;

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator::new();

#[derive(Clone)]
pub struct ValueObjectNodeMinimal {
    pub label: String,
    pub id: String,
    pub edge_to: Vec<String>,
    pub access_to: Vec<String>,
    pub details: HashMap<String, Value>,
}

fn create_value_object_minimal_fixed(index: usize) -> ValueObjectNodeMinimal {
    let mut details = HashMap::new();
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
    details.insert("cd".to_string(), json!(1763097939000_i64));
    details.insert("cb".to_string(), json!("-"));
    details.insert("ub".to_string(), json!("-"));
    details.insert("ud".to_string(), json!(0));
    details.insert("ua".to_string(), json!(1772526871591_i64));

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

    ValueObjectNodeMinimal {
        label: format!("user-dev-test-{}", index),
        id: format!("u.{}", 16406 + index),
        edge_to: vec!["r.392".to_string(), "r.40".to_string(), "r.41".to_string(), "update".to_string(), "administrator".to_string(), "create".to_string(), "delete".to_string(), "read".to_string()],
        access_to: vec!["s.[s3].UACDR".to_string(), "a.[s3].DARC".to_string(), "s.[secretsmanager].RACDU".to_string(), "s.[dynamodb].RCDAU".to_string()],
        details,
    }
}

fn main() {
    let num_entries = get_num_entries();
    let mut stats = Map::new();
    println!("Starting Value Object Minimal Fixed Properties Benchmark with {} entries...", num_entries);

    let mut value_obj_array: Vec<Option<Box<ValueObjectNodeMinimal>>> = Vec::with_capacity(num_entries);
    for _ in 0..num_entries {
        value_obj_array.push(None);
    }

    println!("\n--- CREATION ---");
    benchmark_stats("Value Object Minimal Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i] = Some(Box::new(create_value_object_minimal_fixed(i)));
        }
    });

    println!("\n--- PLAIN TRAVERSAL ---");
    benchmark_stats("Plain Traversal (Value Object Minimal)", &mut stats, "plainTraversalTimeMs", false, &GLOBAL, || {
        let mut dummy_count = 0;
        for i in 0..num_entries {
            if value_obj_array[i].is_some() {
                dummy_count += 1;
            }
        }
        dummy_count
    });

    println!("\n--- PROPERTY ACCESS ---");
    benchmark_stats("Property Access (Value Object Minimal)", &mut stats, "propAccessTimeMs", false, &GLOBAL, || {
        let mut sum: i64 = 0;
        for i in 0..num_entries {
            let details = &value_obj_array[i].as_ref().unwrap().details;
            let ag = details.get("ag").unwrap().as_object().unwrap();
            let a = ag.get("a").unwrap().as_object().unwrap();
            let s = a.get("s").unwrap().as_object().unwrap();
            sum += s.get("r").unwrap().as_i64().unwrap();
        }
        sum
    });

    println!("\n--- FILTERING ---");
    benchmark_stats("Filtering (Value Object Minimal)", &mut stats, "filterTimeMs", false, &GLOBAL, || {
        let mut matched = 0;
        for i in 0..num_entries {
            if value_obj_array[i].as_ref().unwrap().details.get("la").unwrap().as_i64().unwrap() > 1772455500 {
                matched += 1;
            }
        }
        matched
    });

    println!("\n--- MUTATION ---");
    benchmark_stats("Mutation (Value Object Minimal)", &mut stats, "mutationTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            let details = &mut value_obj_array[i].as_mut().unwrap().details;
            let la = details.get("la").unwrap().as_i64().unwrap();
            details.insert("la".to_string(), json!(la + 1));
        }
    });

    println!("\n--- DELETE PROPERTY ---");
    benchmark_stats("Delete Property (Value Object Minimal)", &mut stats, "deletePropertyTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i].as_mut().unwrap().details.remove("ud");
        }
    });

    drop(value_obj_array);

    save_stats("stats.json", "value object minimal", stats);
}
