import os
import json
import time
import gc
import tracemalloc

NUM_ENTRIES = int(os.environ.get('NUM_ENTRIES', 1000000))

def measure_memory():
    gc.collect()
    if not tracemalloc.is_tracing():
        return {'used': 0, 'total': 0, 'peak': 0}
    current, peak = tracemalloc.get_traced_memory()
    return {
        'used': int(current / 1024 / 1024),
        'total': int(current / 1024 / 1024),
        'peak': int(peak / 1024 / 1024),
    }

def benchmark_stats(name, stat_group, stat_key, fn, track_memory=False):
    mem_before = None
    if track_memory:
        tracemalloc.start()
        mem_before = measure_memory()
        
    t0 = time.perf_counter()
    result = fn()
    t1 = time.perf_counter()
    
    if track_memory:
        mem_after = measure_memory()
        tracemalloc.stop()
    else:
        mem_after = None
        
    time_ms = int(round((t1 - t0) * 1000))
    stat_group[stat_key] = time_ms
    
    if track_memory:
        memory_mb = mem_after['used'] - mem_before['used']
        if memory_mb < 0:
            memory_mb = 0
        stat_group['memoryUsedMB'] = memory_mb
        print(f"{name} - Time: {time_ms}ms, Memory Used (Heap): {memory_mb} MB {json.dumps(mem_after)}")
    else:
        print(f"{name}: {time_ms}ms")
        
    return result

def save_stats(file_name, key, data):
    if not os.path.isdir('data'):
        os.makedirs('data', exist_ok=True)
    stats_path = f"data/{file_name}"
    existing_stats = {
        'numEntries': NUM_ENTRIES,
        'plain object': {},
        'value object': {},
        'value object minimal': {}
    }
    
    if os.path.exists(stats_path):
        try:
            with open(stats_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if content:
                    existing_stats.update(json.loads(content))
        except Exception as e:
            print(f"Error parsing existing stats in {stats_path}: {e}")
            
    existing_stats[key] = data
    existing_stats['numEntries'] = NUM_ENTRIES
    
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(existing_stats, f, indent=4)
    print(f"\nSaved {key} stats to data/{file_name}")
