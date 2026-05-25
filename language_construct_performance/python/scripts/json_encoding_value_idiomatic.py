import os
import gc
import json
from dataclasses import dataclass, asdict
from typing import List
from benchmark_utils import benchmark_stats, save_stats
from value_obj_idiomatic_fixed_properties import create_value_object

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
                column_array[r] = create_value_object(c * rows + r)
            two_d_array[c] = column_array
    benchmark_stats("Creation", stats, "creationTimeMs", creation, track_memory=True)
    
    encoded_json = [None]
    
    print("\n--- JSON ENCODING ---")
    def json_encode():
        # Using default handler or asdict depending on naive vs idiomatic
        # For idiomatic, we can just use default handler for dataclasses
        encoded_json[0] = json.dumps(two_d_array, default=lambda o: asdict(o) if hasattr(o, '__dataclass_fields__') else o.__dict__)
    benchmark_stats("JSON Encoding", stats, "jsonEncodeTimeMs", json_encode, track_memory=True)
    
    print("\n--- JSON DECODING ---")
    def json_decode():
        decoded = json.loads(encoded_json[0])
    benchmark_stats("JSON Decoding", stats, "jsonDecodeTimeMs", json_decode, track_memory=True)
    
    two_d_array.clear()
    encoded_json.clear()
    gc.collect()
    if not os.path.exists("data"):
        os.makedirs("data")
    json_stats = {"columns": columns, "rows": rows, "stats": stats}
    with open(os.path.join("data", "stats_json_value_idiomatic.json"), "w") as f:
        json.dump(json_stats, f, indent=2)

if __name__ == "__main__":
    run_benchmark()
