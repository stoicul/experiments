use benchmark::benchmark_utils::{benchmark_stats, get_num_entries, save_stats, TrackingAllocator};
use serde_json::Map;

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator::new();

#[derive(Clone)]
pub struct AgSType {
    pub t: i32,
}

#[derive(Clone)]
pub struct AgASubSType {
    pub t: i32,
    pub s: i32,
    pub r: i32,
}

#[derive(Clone)]
pub struct AgAType {
    pub t: i32,
    pub s: AgASubSType,
}

#[derive(Clone)]
pub struct AgType {
    pub s: AgSType,
    pub a: AgAType,
}

#[derive(Clone)]
pub struct DetailsType {
    pub provider: String,
    pub account_id: String,
    pub principal: bool,
    pub tags: Vec<String>,
    pub mfas: String,
    pub la: i64,
    pub ut: i32,
    pub s: i32,
    pub cpd: i32,
    pub pcb: String,
    pub lld: i32,
    pub cd: i64,
    pub cb: String,
    pub ub: String,
    pub ud: i32,
    pub ua: i64,
    pub ag: AgType,
}

#[derive(Clone)]
pub struct ValueObjectNode {
    pub label: String,
    pub id: String,
    pub edge_to: Vec<String>,
    pub access_to: Vec<String>,
    pub details: DetailsType,
}

fn create_value_object_fixed(index: usize) -> ValueObjectNode {
    ValueObjectNode {
        label: format!("user-dev-test-{}", index),
        id: format!("u.{}", 16406 + index),
        edge_to: vec!["r.392".to_string(), "r.40".to_string(), "r.41".to_string(), "update".to_string(), "administrator".to_string(), "create".to_string(), "delete".to_string(), "read".to_string()],
        access_to: vec!["s.[s3].UACDR".to_string(), "a.[s3].DARC".to_string(), "s.[secretsmanager].RACDU".to_string(), "s.[dynamodb].RCDAU".to_string()],
        details: DetailsType {
            provider: "aws".to_string(),
            account_id: "568709751681".to_string(),
            principal: true,
            tags: vec!["aKIAYI2NaRQPOT".to_string(), "dev testing local".to_string()],
            mfas: "".to_string(),
            la: 1772454942 + (index as i64 % 1000),
            ut: 2,
            s: 1,
            cpd: 0,
            pcb: "-".to_string(),
            lld: 0,
            cd: 1763097939000,
            cb: "-".to_string(),
            ub: "-".to_string(),
            ud: 0,
            ua: 1772526871591,
            ag: AgType {
                s: AgSType { t: 167 },
                a: AgAType {
                    t: 3187978,
                    s: AgASubSType {
                        t: 3187978,
                        s: 3149311,
                        r: 42506,
                    },
                },
            },
        },
    }
}

fn main() {
    let num_entries = get_num_entries();
    let mut stats = Map::new();
    println!("Starting Value Object Fixed Properties Benchmark with {} entries...", num_entries);

    // Array of Box to simulate pointers and heap allocation similar to Go's pointers
    let mut value_obj_array: Vec<Option<Box<ValueObjectNode>>> = Vec::with_capacity(num_entries);
    for _ in 0..num_entries {
        value_obj_array.push(None);
    }

    println!("\n--- CREATION ---");
    benchmark_stats("Value Object Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i] = Some(Box::new(create_value_object_fixed(i)));
        }
    });

    println!("\n--- PLAIN TRAVERSAL ---");
    benchmark_stats("Plain Traversal (Value Object)", &mut stats, "plainTraversalTimeMs", false, &GLOBAL, || {
        let mut dummy_count = 0;
        for i in 0..num_entries {
            if value_obj_array[i].is_some() {
                dummy_count += 1;
            }
        }
        dummy_count
    });

    println!("\n--- PROPERTY ACCESS ---");
    benchmark_stats("Property Access (Value Object)", &mut stats, "propAccessTimeMs", false, &GLOBAL, || {
        let mut sum: i64 = 0;
        for i in 0..num_entries {
            sum += value_obj_array[i].as_ref().unwrap().details.ag.a.s.r as i64;
        }
        sum
    });

    println!("\n--- FILTERING ---");
    benchmark_stats("Filtering (Value Object)", &mut stats, "filterTimeMs", false, &GLOBAL, || {
        let mut matched = 0;
        for i in 0..num_entries {
            if value_obj_array[i].as_ref().unwrap().details.la > 1772455500 {
                matched += 1;
            }
        }
        matched
    });

    println!("\n--- MUTATION ---");
    benchmark_stats("Mutation (Value Object)", &mut stats, "mutationTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i].as_mut().unwrap().details.la += 1;
        }
    });

    println!("\n--- DELETE PROPERTY ---");
    benchmark_stats("Delete Property (Value Object)", &mut stats, "deletePropertyTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i].as_mut().unwrap().details.ud = 0; // In Go structs we can't truly delete, set to zero value
        }
    });

    drop(value_obj_array);

    save_stats("stats.json", "value object", stats);
}
