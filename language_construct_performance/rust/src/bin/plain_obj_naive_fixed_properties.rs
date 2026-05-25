use benchmark::benchmark_utils::{benchmark_stats, get_num_entries, save_stats, TrackingAllocator};
use serde_json::{json, Map, Value};
use std::collections::HashMap;

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
    details.insert("la".to_string(), json!(1772454942 + (index % 1000)));
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
    let num_entries = get_num_entries();
    let mut stats = Map::new();
    println!("Starting Plain Naive Fixed Properties Benchmark with {} entries...", num_entries);

    // Using Vec<Option<...>> to allow modification and memory freeing easily
    let mut plain_array: Vec<Option<HashMap<String, Value>>> = Vec::with_capacity(num_entries);
    for _ in 0..num_entries {
        plain_array.push(None);
    }

    println!("\n--- CREATION ---");
    benchmark_stats("Plain Naive Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for i in 0..num_entries {
            plain_array[i] = Some(create_plain_object_fixed(i));
        }
    });

    println!("\n--- PLAIN TRAVERSAL ---");
    benchmark_stats("Plain Traversal (Plain Naive)", &mut stats, "plainTraversalTimeMs", false, &GLOBAL, || {
        let mut dummy_count = 0;
        for i in 0..num_entries {
            if plain_array[i].is_some() {
                dummy_count += 1;
            }
        }
        dummy_count
    });

    println!("\n--- PROPERTY ACCESS ---");
    benchmark_stats("Property Access (Plain Naive)", &mut stats, "propAccessTimeMs", false, &GLOBAL, || {
        let mut sum: i64 = 0;
        for i in 0..num_entries {
            let map = plain_array[i].as_ref().unwrap();
            let details = map.get("details").unwrap().as_object().unwrap();
            let ag = details.get("ag").unwrap().as_object().unwrap();
            let a = ag.get("a").unwrap().as_object().unwrap();
            let s = a.get("s").unwrap().as_object().unwrap();
            sum += s.get("r").unwrap().as_i64().unwrap();
        }
        sum
    });

    println!("\n--- FILTERING ---");
    benchmark_stats("Filtering (Plain Naive)", &mut stats, "filterTimeMs", false, &GLOBAL, || {
        let mut matched = 0;
        for i in 0..num_entries {
            let map = plain_array[i].as_ref().unwrap();
            let details = map.get("details").unwrap().as_object().unwrap();
            if details.get("la").unwrap().as_i64().unwrap() > 1772455500 {
                matched += 1;
            }
        }
        matched
    });

    println!("\n--- MUTATION ---");
    benchmark_stats("Mutation (Plain Naive)", &mut stats, "mutationTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            let map = plain_array[i].as_mut().unwrap();
            let details = map.get_mut("details").unwrap().as_object_mut().unwrap();
            let la = details.get("la").unwrap().as_i64().unwrap();
            details.insert("la".to_string(), json!(la + 1));
        }
    });

    println!("\n--- DELETE PROPERTY ---");
    benchmark_stats("Delete Property (Plain Naive)", &mut stats, "deletePropertyTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            let map = plain_array[i].as_mut().unwrap();
            let details = map.get_mut("details").unwrap().as_object_mut().unwrap();
            details.remove("ud");
        }
    });

    // Drop array before saving to free memory and run GC equivalents if needed
    drop(plain_array);

    save_stats("stats.json", "plain object naive", stats);
}
