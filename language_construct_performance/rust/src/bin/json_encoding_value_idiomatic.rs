use benchmark::benchmark_utils::{benchmark_stats, TrackingAllocator};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map};
use std::fs;
use std::path::Path;

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator::new();

#[derive(Serialize, Deserialize, Clone)]
pub struct JSONStructAgSType {
    pub t: i32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct JSONStructAgASubSType {
    pub t: i32,
    pub s: i32,
    pub r: i32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct JSONStructAgAType {
    pub t: i32,
    pub s: JSONStructAgASubSType,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct JSONStructAgType {
    pub s: JSONStructAgSType,
    pub a: JSONStructAgAType,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct JSONStructDetailsType {
    pub provider: String,
    #[serde(rename = "accountId")]
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
    pub ag: JSONStructAgType,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct JSONStructValueObjectNode {
    pub label: String,
    pub id: String,
    #[serde(rename = "edgeTo")]
    pub edge_to: Vec<String>,
    #[serde(rename = "accessTo")]
    pub access_to: Vec<String>,
    pub details: JSONStructDetailsType,
}

fn create_plain_object_fixed_struct(index: usize) -> JSONStructValueObjectNode {
    JSONStructValueObjectNode {
        label: format!("user-dev-test-{}", index),
        id: format!("u.{}", 16406 + index),
        edge_to: vec!["r.392".to_string(), "r.40".to_string(), "r.41".to_string(), "update".to_string(), "administrator".to_string(), "create".to_string(), "delete".to_string(), "read".to_string()],
        access_to: vec!["s.[s3].UACDR".to_string(), "a.[s3].DARC".to_string(), "s.[secretsmanager].RACDU".to_string(), "s.[dynamodb].RCDAU".to_string()],
        details: JSONStructDetailsType {
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
            ag: JSONStructAgType {
                s: JSONStructAgSType { t: 167 },
                a: JSONStructAgAType {
                    t: 3187978,
                    s: JSONStructAgASubSType {
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
    let mut stats = Map::new();
    let columns = 3;
    let rows = 50000;
    println!("Starting JSON Struct-Based Encoding/Decoding Benchmark with {} columns x {} rows...", columns, rows);

    let mut two_d_array: Vec<Vec<JSONStructValueObjectNode>> = Vec::with_capacity(columns);
    for _ in 0..columns {
        two_d_array.push(Vec::new());
    }

    println!("\n--- CREATION ---");
    benchmark_stats("Creation", &mut stats, "creationTimeMs", true, &GLOBAL, || {
        for c in 0..columns {
            let mut column_array = Vec::with_capacity(rows);
            for r in 0..rows {
                column_array.push(create_plain_object_fixed_struct(c * rows + r));
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
        let _decoded: Vec<Vec<JSONStructValueObjectNode>> = serde_json::from_str(&encoded_json).unwrap();
    });

    drop(two_d_array);
    drop(encoded_json);

    fs::create_dir_all("data").unwrap_or_default();
    let json_stats = json!({
        "columns": columns,
        "rows": rows,
        "stats": stats,
    });
    let b = serde_json::to_string_pretty(&json_stats).unwrap();
    fs::write(Path::new("data/stats_json_value_idiomatic.json"), b).unwrap();
    println!("\nSaved struct-based json stats to data/stats_json_value_idiomatic.json");
}
