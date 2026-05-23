package main

import (
	"fmt"
	"runtime"
)

type ValueObjectNodeMinimalVar struct {
	Label    string
	Id       string
	AccessTo []string
	Details  map[string]interface{}
	EdgeTo   []string
}

func createValueObjectMinimalVariable(index int) ValueObjectNodeMinimalVar {
	var edgeTo []string
	if index%2 == 0 {
		edgeTo = []string{"r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"}
	}

	details := map[string]interface{}{
		"provider":  "aws",
		"accountId": "568709751681",
		"principal": true,
		"tags":      []string{"aKIAYI2NaRQPOT", "dev testing local"},
		"mfas":      "",
		"la":        1772454942 + (index % 1000),
		"s":         1,
		"cpd":       0,
		"pcb":       "-",
		"lld":       0,
		"cd":        1763097939000,
		"cb":        "-",
		"ub":        "-",
		"ud":        0,
		"ua":        1772526871591,
	}

	if index%3 == 0 {
		details["ut"] = 2
	}

	if index%4 == 0 {
		details["ag"] = map[string]interface{}{
			"s": map[string]interface{}{"t": 167},
			"a": map[string]interface{}{
				"t": 3187978,
				"s": map[string]interface{}{
					"t": 3187978,
					"s": 3149311,
					"r": 42506,
				},
			},
		}
	}

	return ValueObjectNodeMinimalVar{
		Label:    fmt.Sprintf("user-dev-test-%d", index),
		Id:       fmt.Sprintf("u.%d", 16406+index),
		AccessTo: []string{"s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"},
		Details:  details,
		EdgeTo:   edgeTo,
	}
}

func main() {
	stats := make(map[string]interface{})
	fmt.Printf("Starting Value Object Minimal Variable Properties Benchmark with %d entries...\n", NumEntries)

	valueObjArray := make([]*ValueObjectNodeMinimalVar, NumEntries)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Value Object Minimal Creation", stats, "creationTimeMs", true, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			obj := createValueObjectMinimalVariable(i)
			valueObjArray[i] = &obj
		}
		return nil
	})

	fmt.Println("\n--- PLAIN TRAVERSAL ---")
	BenchmarkStats("Plain Traversal (Value Object Minimal)", stats, "plainTraversalTimeMs", false, func() interface{} {
		dummyCount := 0
		for i := 0; i < NumEntries; i++ {
			if valueObjArray[i] != nil {
				dummyCount++
			}
		}
		return dummyCount
	})

	fmt.Println("\n--- PROPERTY ACCESS ---")
	BenchmarkStats("Property Access (Value Object Minimal)", stats, "propAccessTimeMs", false, func() interface{} {
		sum := 0
		for i := 0; i < NumEntries; i++ {
			if ag, ok := valueObjArray[i].Details["ag"].(map[string]interface{}); ok {
				if a, ok := ag["a"].(map[string]interface{}); ok {
					if s, ok := a["s"].(map[string]interface{}); ok {
						if r, ok := s["r"].(int); ok {
							sum += r
						}
					}
				}
			}
		}
		return sum
	})

	fmt.Println("\n--- FILTERING ---")
	BenchmarkStats("Filtering (Value Object Minimal)", stats, "filterTimeMs", false, func() interface{} {
		matched := 0
		for i := 0; i < NumEntries; i++ {
			if valueObjArray[i].Details["la"].(int) > 1772455500 {
				matched++
			}
		}
		return matched
	})

	fmt.Println("\n--- MUTATION ---")
	BenchmarkStats("Mutation (Value Object Minimal)", stats, "mutationTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			valueObjArray[i].Details["la"] = valueObjArray[i].Details["la"].(int) + 1
		}
		return nil
	})

	fmt.Println("\n--- DELETE PROPERTY ---")
	BenchmarkStats("Delete Property (Value Object Minimal)", stats, "deletePropertyTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			delete(valueObjArray[i].Details, "ud")
		}
		return nil
	})

	// Clear memory
	valueObjArray = nil
	runtime.GC()

	SaveStats("stats_variable.json", "value object minimal", stats)
}
