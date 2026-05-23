import os
import gc
import json
from benchmark_utils import benchmark_stats, save_stats

def create_plain_object(index):
    return {
        'label': f'user-dev-test-{index}',
        'id': f'u.{16406 + index}',
        'edgeTo': ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'],
        'accessTo': ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        'details': {
            'provider': 'aws',
            'accountId': '568709751681',
            'principal': True,
            'tags': ['aKIAYI2NaRQPOT', 'dev testing local'],
            'mfas': '',
            'la': 1772454942 + (index % 1000),
            'ut': 2,
            's': 1,
            'cpd': 0,
            'pcb': '-',
            'lld': 0,
            'cd': 1763097939000,
            'cb': '-',
            'ub': '-',
            'ud': 0,
            'ua': 1772526871591,
            'ag': {
                's': {
                    't': 167
                },
                'a': {
                    't': 3187978,
                    's': {
                        't': 3187978,
                        's': 3149311,
                        'r': 42506
                    }
                }
            }
        }
    }

def run_benchmark():
    stats = {}
    columns = 3
    rows = 50000
    print(f"Starting JSON Encoding/Decoding Benchmark with {columns} columns x {rows} rows...\n")
    
    two_d_array = [None] * columns
    
    print("\n--- CREATION ---")
    def creation():
        for c in range(columns):
            column_array = [None] * rows
            for r in range(rows):
                column_array[r] = create_plain_object(c * rows + r)
            two_d_array[c] = column_array
    benchmark_stats("Creation", stats, "creationTimeMs", creation, track_memory=True)
    
    encoded_json = [None]
    
    print("\n--- JSON ENCODING ---")
    def json_encode():
        encoded_json[0] = json.dumps(two_d_array)
    benchmark_stats("JSON Encoding", stats, "jsonEncodeTimeMs", json_encode, track_memory=True)
    
    print("\n--- JSON DECODING ---")
    def json_decode():
        decoded = json.loads(encoded_json[0])
    benchmark_stats("JSON Decoding", stats, "jsonDecodeTimeMs", json_decode, track_memory=True)
    
    # Clear memory
    two_d_array.clear()
    encoded_json.clear()
    gc.collect()
    # Save Stats
    if not os.path.exists("data"):
        os.makedirs("data")
    json_stats = {
        "columns": columns,
        "rows": rows,
        "stats": stats
    }
    with open(os.path.join("data", "stats_json.json"), "w") as f:
        json.dump(json_stats, f, indent=2)
    print("\nSaved json stats to data/stats_json.json")

if __name__ == "__main__":
    try:
        run_benchmark()
    except Exception as e:
        print(f"Error: {e}")
        import sys
        sys.exit(1)
