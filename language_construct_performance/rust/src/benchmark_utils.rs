use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::alloc::{GlobalAlloc, Layout, System};
use std::env;
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;
use sysinfo::System as SysinfoSystem;

pub struct TrackingAllocator {
    pub allocated: AtomicUsize,
}

impl TrackingAllocator {
    pub const fn new() -> Self {
        TrackingAllocator {
            allocated: AtomicUsize::new(0),
        }
    }
    
    pub fn get_allocated_mb(&self) -> u64 {
        (self.allocated.load(Ordering::SeqCst) / 1024 / 1024) as u64
    }
}

unsafe impl GlobalAlloc for TrackingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let ptr = System.alloc(layout);
        if !ptr.is_null() {
            self.allocated.fetch_add(layout.size(), Ordering::SeqCst);
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        self.allocated.fetch_sub(layout.size(), Ordering::SeqCst);
        System.dealloc(ptr, layout);
    }
}

// Binaries will define `#[global_allocator] static GLOBAL: benchmark::benchmark_utils::TrackingAllocator = benchmark::benchmark_utils::TrackingAllocator::new();`

pub fn get_num_entries() -> usize {
    env::var("NUM_ENTRIES")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(20000000)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MemoryStats {
    pub rss: u64,
    #[serde(rename = "heapUsed")]
    pub heap_used: u64,
}

pub fn measure_memory(global_alloc: &TrackingAllocator) -> MemoryStats {
    let mut sys = SysinfoSystem::new_all();
    sys.refresh_all();
    let pid = sysinfo::get_current_pid().unwrap();
    let process = sys.process(pid).unwrap();
    
    MemoryStats {
        rss: process.memory() / 1024 / 1024,
        heap_used: global_alloc.get_allocated_mb(),
    }
}

pub fn benchmark_stats<F, R>(
    name: &str,
    stat_group: &mut serde_json::Map<String, Value>,
    stat_key: &str,
    track_memory: bool,
    global_alloc: &TrackingAllocator,
    mut fn_to_run: F,
) -> R
where
    F: FnMut() -> R,
{
    let mem_before = if track_memory {
        Some(measure_memory(global_alloc))
    } else {
        None
    };

    let t0 = Instant::now();
    let res = fn_to_run();
    let t1 = Instant::now();

    let mem_after = if track_memory {
        Some(measure_memory(global_alloc))
    } else {
        None
    };

    let time_ms = (t1 - t0).as_millis() as u64;
    stat_group.insert(stat_key.to_string(), Value::Number(time_ms.into()));

    if track_memory {
        let mem_after_val = mem_after.unwrap();
        let mem_before_val = mem_before.unwrap();
        let memory_mb = if mem_after_val.heap_used >= mem_before_val.heap_used {
            mem_after_val.heap_used - mem_before_val.heap_used
        } else {
            0
        };
        stat_group.insert("memoryUsedMB".to_string(), Value::Number(memory_mb.into()));
        let out = serde_json::to_string(&mem_after_val).unwrap();
        println!(
            "{} - Time: {}ms, Memory Used (Heap): {} MB {}",
            name, time_ms, memory_mb, out
        );
    } else {
        println!("{}: {}ms", name, time_ms);
    }

    res
}

pub fn save_stats(file_name: &str, key: &str, data: serde_json::Map<String, Value>) {
    fs::create_dir_all("data").unwrap_or_default();
    let stats_path = Path::new("data").join(file_name);

    let mut existing_stats = if stats_path.exists() {
        let b = fs::read_to_string(&stats_path).unwrap_or_default();
        serde_json::from_str(&b).unwrap_or_else(|_| serde_json::json!({}).as_object().unwrap().clone())
    } else {
        serde_json::json!({
            "numEntries": get_num_entries(),
            "plain object": {},
            "value object": {},
            "value object minimal": {},
        })
        .as_object()
        .unwrap()
        .clone()
    };

    existing_stats.insert(key.to_string(), Value::Object(data));
    existing_stats.insert(
        "numEntries".to_string(),
        Value::Number(get_num_entries().into()),
    );

    let b = serde_json::to_string_pretty(&existing_stats).unwrap();
    fs::write(stats_path, b).unwrap();
    println!("\nSaved {} stats to data/{}", key, file_name);
}
