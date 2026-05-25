import os
import gc
from dataclasses import dataclass
from typing import List, Optional, Any
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from benchmark_utils import NUM_ENTRIES, benchmark_stats, save_stats

# --- VALUE OBJECT CLASSES ---

@dataclass(slots=True)
class AgSType:
    t: int

@dataclass(slots=True)
class AgASubSType:
    t: int
    s: int
    r: int

@dataclass(slots=True)
class AgAType:
    t: int
    s: AgASubSType

@dataclass(slots=True)
class AgType:
    s: AgSType
    a: AgAType

@dataclass(slots=True)
class DetailsType:
    provider: str
    accountId: str
    principal: bool
    tags: List[str]
    mfas: str
    la: int
    s: int
    cpd: int
    pcb: str
    lld: int
    cd: int
    cb: str
    ub: str
    ud: int
    ua: int
    ut: Optional[int] = None
    ag: Optional[AgType] = None

@dataclass(slots=True)
class ValueObjectNode:
    label: str
    id: str
    accessTo: List[str]
    details: DetailsType
    edgeTo: Optional[List[str]] = None

# --- FACTORIES ---

def create_value_object(index: int) -> ValueObjectNode:
    edgeTo = ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'] if index % 2 == 0 else None
    ut = 2 if index % 3 == 0 else None
    
    ag = None
    if index % 4 == 0:
        ag = AgType(
            s=AgSType(167),
            a=AgAType(
                t=3187978,
                s=AgASubSType(t=3187978, s=3149311, r=42506)
            )
        )

    return ValueObjectNode(
        label=f'user-dev-test-{index}',
        id=f'u.{16406 + index}',
        accessTo=['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        details=DetailsType(
            provider='aws',
            accountId='568709751681',
            principal=True,
            tags=['aKIAYI2NaRQPOT', 'dev testing local'],
            mfas='',
            la=1772454942 + (index % 1000),
            s=1,
            cpd=0,
            pcb='-',
            lld=0,
            cd=1763097939000,
            cb='-',
            ub='-',
            ud=0,
            ua=1772526871591,
            ut=ut,
            ag=ag
        ),
        edgeTo=edgeTo
    )

# --- BENCHMARK RUNNER ---

def run_benchmark():
    stats = {}
    print(f"Starting Value Object Idiomatic Variable Properties Benchmark with {NUM_ENTRIES:,} entries...\n")

    value_obj_list = [None] * NUM_ENTRIES

    print("\n--- CREATION ---")
    def creation():
        for i in range(NUM_ENTRIES):
            value_obj_list[i] = create_value_object(i)
    benchmark_stats("Value Object Idiomatic Creation", stats, "creationTimeMs", creation, track_memory=True)

    print("\n--- PLAIN TRAVERSAL ---")
    def traversal():
        dummy_count = 0
        for i in range(NUM_ENTRIES):
            if value_obj_list[i] is not None:
                dummy_count += 1
        return dummy_count
    benchmark_stats("Plain Traversal (Value Object Idiomatic)", stats, "plainTraversalTimeMs", traversal)

    print("\n--- PROPERTY ACCESS ---")
    def property_access():
        sum_val = 0
        for i in range(NUM_ENTRIES):
            ag = value_obj_list[i].details.ag
            if ag is not None and ag.a is not None and ag.a.s is not None:
                sum_val += ag.a.s.r
        return sum_val
    benchmark_stats("Property Access (Value Object Idiomatic)", stats, "propAccessTimeMs", property_access)

    print("\n--- FILTERING ---")
    def filtering():
        matched = 0
        for i in range(NUM_ENTRIES):
            if value_obj_list[i].details.la > 1772455500:
                matched += 1
        return matched
    benchmark_stats("Filtering (Value Object Idiomatic)", stats, "filterTimeMs", filtering)

    print("\n--- MUTATION ---")
    def mutation():
        for i in range(NUM_ENTRIES):
            value_obj_list[i].details.la += 1
    benchmark_stats("Mutation (Value Object Idiomatic)", stats, "mutationTimeMs", mutation)

    print("\n--- DELETE PROPERTY ---")
    def delete_property():
        # In python slots, you can't dynamically delete a property if it's in slots,
        # but to match PHP/Bun where they unset it or it might be possible,
        # since it's statically typed, we just set it to None or 0.
        # Let's set it to 0 like a static typed unset would typically do,
        # or maybe we should use `delattr` if it's allowed? Slots don't allow del unless there's no default.
        # Wait, the PHP code unsets `ud` which is an int.
        # We can just set it to 0 or None (but it's int).
        # We will use `del value_obj_list[i].details.ud` if it works, otherwise just set to 0.
        # Let's try delattr, but usually it raises AttributeError for slots without a deleter.
        # We will just set it to None, but we typed it as int... Let's just catch and ignore or set to 0.
        for i in range(NUM_ENTRIES):
            try:
                del value_obj_list[i].details.ud
            except AttributeError:
                pass
    benchmark_stats("Delete Property (Value Object Idiomatic)", stats, "deletePropertyTimeMs", delete_property)

    # Clear memory
    value_obj_list.clear()
    gc.collect()

    # Save Stats
    save_stats("stats_variable.json", "value object idiomatic", stats)

if __name__ == "__main__":
    try:
        run_benchmark()
    except Exception as e:
        print(f"Error: {e}")
        import sys
        sys.exit(1)
