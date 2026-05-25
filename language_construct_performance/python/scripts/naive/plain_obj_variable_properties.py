import os
import gc
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from benchmark_utils import NUM_ENTRIES, benchmark_stats, save_stats

def create_plain_object(index):
    obj = {
        'label': f'user-dev-test-{index}',
        'id': f'u.{16406 + index}',
        'accessTo': ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        'details': {
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
    }

    if index % 2 == 0:
        obj['edgeTo'] = ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read']

    if index % 3 == 0:
        obj['details']['ut'] = 2

    if index % 4 == 0:
        obj['details']['ag'] = {
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

    return obj

def run_benchmark():
    stats = {}
    print(f"Starting Plain Naive Variable Properties Benchmark with {NUM_ENTRIES:,} entries...\n")
    
    plain_list = [None] * NUM_ENTRIES
    
    print("\n--- CREATION ---")
    def creation():
        for i in range(NUM_ENTRIES):
            plain_list[i] = create_plain_object(i)
    benchmark_stats("Plain Naive Creation", stats, "creationTimeMs", creation, track_memory=True)
    
    print("\n--- PLAIN TRAVERSAL ---")
    def traversal():
        dummy_count = 0
        for i in range(NUM_ENTRIES):
            if plain_list[i] is not None:
                dummy_count += 1
        return dummy_count
    benchmark_stats("Plain Traversal (Plain Naive)", stats, "plainTraversalTimeMs", traversal)
    
    print("\n--- PROPERTY ACCESS ---")
    def property_access():
        sum_val = 0
        for i in range(NUM_ENTRIES):
            ag = plain_list[i]['details'].get('ag')
            if ag:
                sum_val += ag['a']['s']['r']
        return sum_val
    benchmark_stats("Property Access (Plain Naive)", stats, "propAccessTimeMs", property_access)
    
    print("\n--- FILTERING ---")
    def filtering():
        matched = 0
        for i in range(NUM_ENTRIES):
            if plain_list[i]['details']['la'] > 1772455500:
                matched += 1
        return matched
    benchmark_stats("Filtering (Plain Naive)", stats, "filterTimeMs", filtering)
    
    print("\n--- MUTATION ---")
    def mutation():
        for i in range(NUM_ENTRIES):
            plain_list[i]['details']['la'] += 1
    benchmark_stats("Mutation (Plain Naive)", stats, "mutationTimeMs", mutation)
    
    print("\n--- DELETE PROPERTY ---")
    def delete_property():
        for i in range(NUM_ENTRIES):
            if 'ud' in plain_list[i]['details']:
                del plain_list[i]['details']['ud']
    benchmark_stats("Delete Property (Plain Naive)", stats, "deletePropertyTimeMs", delete_property)
    
    # Clear memory
    plain_list.clear()
    gc.collect()
    
    save_stats("stats_variable.json", "plain object naive", stats)

if __name__ == "__main__":
    try:
        run_benchmark()
    except Exception as e:
        print(f"Error: {e}")
        import sys
        sys.exit(1)
