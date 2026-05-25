package main

import (
	"fmt"
	"runtime"
)

func createPlainObjectVariable(index int) map[string]interface{} {
	obj := map[string]interface{}{
		"label":    fmt.Sprintf("user-dev-test-%d", index),
		"id":       fmt.Sprintf("u.%d", 16406+index),
		"accessTo": []string{"s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"},
		"details": map[string]interface{}{
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
		},
	}

	if index%2 == 0 {
		obj["edgeTo"] = []string{"r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"}
	}

	details := obj["details"].(map[string]interface{})
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

	return obj
}

func main() {
	stats := make(map[string]interface{})
	fmt.Printf("Starting Plain Naive Variable Properties Benchmark with %d entries...\n", NumEntries)

	plainArray := make([]map[string]interface{}, NumEntries)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Plain Naive Creation", stats, "creationTimeMs", true, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			plainArray[i] = createPlainObjectVariable(i)
		}
		return nil
	})

	fmt.Println("\n--- PLAIN TRAVERSAL ---")
	BenchmarkStats("Plain Traversal (Plain Naive)", stats, "plainTraversalTimeMs", false, func() interface{} {
		dummyCount := 0
		for i := 0; i < NumEntries; i++ {
			if plainArray[i] != nil {
				dummyCount++
			}
		}
		return dummyCount
	})

	fmt.Println("\n--- PROPERTY ACCESS ---")
	BenchmarkStats("Property Access (Plain Naive)", stats, "propAccessTimeMs", false, func() interface{} {
		sum := 0
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			if ag, ok := details["ag"].(map[string]interface{}); ok {
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
	BenchmarkStats("Filtering (Plain Naive)", stats, "filterTimeMs", false, func() interface{} {
		matched := 0
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			if details["la"].(int) > 1772455500 {
				matched++
			}
		}
		return matched
	})

	fmt.Println("\n--- MUTATION ---")
	BenchmarkStats("Mutation (Plain Naive)", stats, "mutationTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			details["la"] = details["la"].(int) + 1
		}
		return nil
	})

	fmt.Println("\n--- DELETE PROPERTY ---")
	BenchmarkStats("Delete Property (Plain Naive)", stats, "deletePropertyTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			delete(details, "ud")
		}
		return nil
	})

	// Clear memory
	plainArray = nil
	runtime.GC()

	SaveStats("stats_variable.json", "plain object naive", stats)
}
