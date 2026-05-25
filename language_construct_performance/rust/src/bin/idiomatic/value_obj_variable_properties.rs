use benchmark::benchmark_utils::{benchmark_stats, get_num_entries, save_stats, TrackingAllocator};
use serde_json::Map;

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator::new();

#[derive(Clone)]
pub struct AgSTypeVar {
    pub t: i32,
}

#[derive(Clone)]
pub struct AgASubSTypeVar {
    pub t: i32,
    pub s: i32,
    pub r: i32,
}

#[derive(Clone)]
pub struct AgATypeVar {
    pub t: i32,
    pub s: AgASubSTypeVar,
}

#[derive(Clone)]
pub struct AgTypeVar {
    pub s: AgSTypeVar,
    pub a: AgATypeVar,
}

#[derive(Clone)]
pub struct DetailsTypeVar {
    pub provider: String,
    pub account_id: String,
    pub principal: bool,
    pub tags: Vec<String>,
    pub mfas: String,
    pub la: i64,
    pub s: i32,
    pub cpd: i32,
    pub pcb: String,
    pub lld: i32,
    pub cd: i64,
    pub cb: String,
    pub ub: String,
    pub ud: i32,
    pub ua: i64,
    pub ut: Option<i32>,
    pub ag: Option<Box<AgTypeVar>>,
}

#[derive(Clone)]
pub struct ValueObjectNodeVar {
    pub label: String,
    pub id: String,
    pub access_to: Vec<String>,
    pub details: DetailsTypeVar,
    pub edge_to: Option<Vec<String>>,
}

fn create_value_object_variable(index: usize) -> ValueObjectNodeVar {
    let edge_to = if index % 2 == 0 {
        Some(vec!["r.392".to_string(), "r.40".to_string(), "r.41".to_string(), "update".to_string(), "administrator".to_string(), "create".to_string(), "delete".to_string(), "read".to_string()])
    } else {
        None
    };

    let ut = if index % 3 == 0 {
        Some(2)
    } else {
        None
    };

    let ag = if index % 4 == 0 {
        Some(Box::new(AgTypeVar {
            s: AgSTypeVar { t: 167 },
            a: AgATypeVar {
                t: 3187978,
                s: AgASubSTypeVar {
                    t: 3187978,
                    s: 3149311,
                    r: 42506,
                },
            },
        }))
    } else {
        None
    };

    ValueObjectNodeVar {
        label: format!("user-dev-test-{}", index),
        id: format!("u.{}", 16406 + index),
        access_to: vec!["s.[s3].UACDR".to_string(), "a.[s3].DARC".to_string(), "s.[secretsmanager].RACDU".to_string(), "s.[dynamodb].RCDAU".to_string()],
        details: DetailsTypeVar {
            provider: "aws".to_string(),
            account_id: "568709751681".to_string(),
            principal: true,
            tags: vec!["aKIAYI2NaRQPOT".to_string(), "dev testing local".to_string()],
            mfas: "".to_string(),
            la: 1772454942 + (index as i64 % 1000),
            s: 1,
            cpd: 0,
            pcb: "-".to_string(),
            lld: 0,
            cd: 1763097939000,
            cb: "-".to_string(),
            ub: "-".to_string(),
            ud: 0,
            ua: 1772526871591,
            ut,
            ag,
        },
        edge_to,
    }
}

fn main() {
    let num_entries = get_num_entries();
    let mut stats = Map::new();
    println!("Starting Value Object Idiomatic Variable Properties Benchmark with {} entries...", num_entries);

    let mut value_obj_array: Vec<ValueObjectNodeVar> = Vec::with_capacity(num_entries);

    println!("\n--- CREATION ---");
    benchmark_stats("Value Object Idiomatic Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array.push(create_value_object_variable(i));
        }
    });

    println!("\n--- PLAIN TRAVERSAL ---");
    benchmark_stats("Plain Traversal (Value Object Idiomatic)", &mut stats, "plainTraversalTimeMs", false, &GLOBAL, || {
        let mut dummy_count = 0;
        for i in 0..num_entries {
            if !value_obj_array[i].id.is_empty() {
                dummy_count += 1;
            }
        }
        dummy_count
    });

    println!("\n--- PROPERTY ACCESS ---");
    benchmark_stats("Property Access (Value Object Idiomatic)", &mut stats, "propAccessTimeMs", false, &GLOBAL, || {
        let mut sum: i64 = 0;
        for i in 0..num_entries {
            if let Some(ag) = &value_obj_array[i].details.ag {
                sum += ag.a.s.r as i64;
            }
        }
        sum
    });

    println!("\n--- FILTERING ---");
    benchmark_stats("Filtering (Value Object Idiomatic)", &mut stats, "filterTimeMs", false, &GLOBAL, || {
        let mut matched = 0;
        for i in 0..num_entries {
            if value_obj_array[i].details.la > 1772455500 {
                matched += 1;
            }
        }
        matched
    });

    println!("\n--- MUTATION ---");
    benchmark_stats("Mutation (Value Object Idiomatic)", &mut stats, "mutationTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i].details.la += 1;
        }
    });

    println!("\n--- DELETE PROPERTY ---");
    benchmark_stats("Delete Property (Value Object Idiomatic)", &mut stats, "deletePropertyTimeMs", false, &GLOBAL, || {
        for i in 0..num_entries {
            value_obj_array[i].details.ud = 0;
        }
    });

    drop(value_obj_array);

    save_stats("stats_variable.json", "value object idiomatic", stats);
}
