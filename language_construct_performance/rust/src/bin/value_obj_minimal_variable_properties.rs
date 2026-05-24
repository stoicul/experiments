use benchmark::benchmark_utils::{benchmark_stats, get_num_entries, save_stats, TrackingAllocator};
use serde_json::{json, Map, Value};
use std::collections::HashMap;

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator::new();

#[derive(Clone)]
pub struct ValueObjectNodeMinimalVar {
    pub label: String,
    pub id: String,
    pub access_to: Vec<String>,
    pub details: HashMap<String, Value>,
    pub edge_to: Option<Vec<String>>,
}

fn create_value_object_minimal_variable(index: usize) -> ValueObjectNodeMinimalVar {
    let edge_to = if index % 2 == 0 {
        Some(vec!["r.392".to_string(), "r.40".to_string(), "r.41".to_string(), "update".to_string(), "administrator".to_string(), "create".to_string(), "delete".to_string(), "read".to_string()])
    } else {
        None
    };

    let mut details = HashMap::new();
    details.insert("provider".to_string(), json!("aws"));
    details.insert("accountId".to_string(), json!("568709751681"));
    details.insert("principal".to_string(), json!(true));
    details.insert("tags".to_string(), json!(vec!["aKIAYI2NaRQPOT", "dev testing local"]));
    details.insert("mfas".to_string(), json!(""));
    details.insert("la".to_string(), json!(1772454942 + (index as i64 % 1000)));
    details.insert("s".to_string(), json!(1));
    details.insert("cpd".to_string(), json!(0));
    details.insert("pcb".to_string(), json!("-"));
    details.insert("lld".to_string(), json!(0));
    details.insert("cd".to_string(), json!(1763097939000_i64));
    details.insert("cb".to_string(), json!("-"));
    details.insert("ub".to_string(), json!("-"));
    details.insert("ud".to_string(), json!(0));
    details.insert("ua".to_string(), json!(1772526871591_i64));

    if index % 3 == 0 {
        details.insert("ut".to_string(), json!(2));
    }

    if index % 4 == 0 {
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
    }

    ValueObjectNodeMinimalVar {
        label: format!("user-dev-test-{}", index),
        id: format!("u.{}", 16406 + index),
        access_to: vec!["s.[s3].UACDR".to_string(), "a.[s3].DARC".to_string(), "s.[secretsmanager].RACDU".to_string(), "s.[dynamodb].RCDAU".to_string()],
        details,
        edge_to,
    }
}

fn main() {
    let num_entries = get_num_entries();
    let mut stats = Map::new();
    println!("Starting Value Object Minimal Variable Properties Benchmark with {} entries...", num_entries);

    let mut value_obj_array: Vec<Option<Box<ValueObjectNodeMinimalVar>>> = Vec::with_capacity(num_entries);
    for _ in 0..num_entries {
        value_obj_array.push(None);
    }

    println!("\n--- CREATION ---");
    benchmark_stats("Value Object Minimal Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i] = Some(Box::new(create_value_object_minimal_variable(i)));
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
            if let Some(ag_val) = details.get("ag") {
                if let Some(ag) = ag_val.as_object() {
                    if let Some(a_val) = ag.get("a") {
                        if let Some(a) = a_val.as_object() {
                            if let Some(s_val) = a.get("s") {
                                if let Some(s) = s_val.as_object() {
                                    if let Some(r_val) = s.get("r") {
                                        if let Some(r) = r_val.as_i64() {
                                            sum += r;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
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

    save_stats("stats_variable.json", "value object minimal", stats);
}
