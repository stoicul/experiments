import os
import gc
from dataclasses import dataclass
from typing import List, Optional, Any, Dict
from benchmark_utils import NUM_ENTRIES, benchmark_stats, save_stats

# --- VALUE OBJECT CLASSES ---

@dataclass(slots=True)
class MinimalValueObjectNode:
    label: str
    id: str
    accessTo: List[str]
    details: Dict[str, Any]
    edgeTo: Optional[List[str]] = None

# --- FACTORIES ---

def create_value_object(index: int) -> MinimalValueObjectNode:
    edgeTo = ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'] if index % 2 == 0 else None
    ut = 2 if index % 3 == 0 else None
    ag = None
    if index % 4 == 0:
        ag = {
            's': {'t': 167},
            'a': {
                't': 3187978,
                's': {
                    't': 3187978,
                    's': 3149311,
                    'r': 42506
                }
            }
        }

    details = {
        'provider': 'aws',
        'accountId': '568709751681',
        'principal': True,
        'tags': ['aKIAYI2NaRQPOT', 'dev testing local'],
        'mfas': '',
        'la': 1772454942 + (index % 1000),
        's': 1,
        'cpd': 0,
        'pcb': '-',
        'lld': 0,
        'cd': 1763097939000,
        'cb': '-',
        'ub': '-',
        'ud': 0,
        'ua': 1772526871591
    }

    if ut is not None:
        details['ut'] = ut
    if ag is not None:
        details['ag'] = ag

    return MinimalValueObjectNode(
        label=f'user-dev-test-{index}',
        id=f'u.{16406 + index}',
        accessTo=['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        details=details,
        edgeTo=edgeTo
    )

# --- BENCHMARK RUNNER ---

def run_benchmark():
    stats = {}
    print(f"Starting Value Object Variable Properties Minimal Benchmark with {NUM_ENTRIES:,} entries...\n")

    value_obj_list = [None] * NUM_ENTRIES

    print("\n--- CREATION ---")
    def creation():
        for i in range(NUM_ENTRIES):
            value_obj_list[i] = create_value_object(i)
    benchmark_stats("Value Object Minimal Creation", stats, "creationTimeMs", creation, track_memory=True)

    print("\n--- PLAIN TRAVERSAL ---")
    def traversal():
        dummy_count = 0
        for i in range(NUM_ENTRIES):
            if value_obj_list[i] is not None:
                dummy_count += 1
        return dummy_count
    benchmark_stats("Plain Traversal (Value Object Minimal)", stats, "plainTraversalTimeMs", traversal)

    print("\n--- PROPERTY ACCESS ---")
    def property_access():
        sum_val = 0
        for i in range(NUM_ENTRIES):
            ag = value_obj_list[i].details.get('ag')
            if ag:
                sum_val += ag['a']['s']['r']
        return sum_val
    benchmark_stats("Property Access (Value Object Minimal)", stats, "propAccessTimeMs", property_access)

    print("\n--- FILTERING ---")
    def filtering():
        matched = 0
        for i in range(NUM_ENTRIES):
            if value_obj_list[i].details['la'] > 1772455500:
                matched += 1
        return matched
    benchmark_stats("Filtering (Value Object Minimal)", stats, "filterTimeMs", filtering)

    print("\n--- MUTATION ---")
    def mutation():
        for i in range(NUM_ENTRIES):
            value_obj_list[i].details['la'] += 1
    benchmark_stats("Mutation (Value Object Minimal)", stats, "mutationTimeMs", mutation)

    print("\n--- DELETE PROPERTY ---")
    def delete_property():
        for i in range(NUM_ENTRIES):
            if 'ud' in value_obj_list[i].details:
                del value_obj_list[i].details['ud']
    benchmark_stats("Delete Property (Value Object Minimal)", stats, "deletePropertyTimeMs", delete_property)

    # Clear memory
    value_obj_list.clear()
    gc.collect()

    # Save Stats
    save_stats("stats_variable.json", "value object minimal", stats)

if __name__ == "__main__":
    try:
        run_benchmark()
    except Exception as e:
        print(f"Error: {e}")
        import sys
        sys.exit(1)
