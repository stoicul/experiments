package main

import (
	"fmt"
	"runtime"
)

func createPlainObjectFixed(index int) map[string]interface{} {
	return map[string]interface{}{
		"label":    fmt.Sprintf("user-dev-test-%d", index),
		"id":       fmt.Sprintf("u.%d", 16406+index),
		"edgeTo":   []string{"r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"},
		"accessTo": []string{"s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"},
		"details": map[string]interface{}{
			"provider":  "aws",
			"accountId": "568709751681",
			"principal": true,
			"tags":      []string{"aKIAYI2NaRQPOT", "dev testing local"},
			"mfas":      "",
			"la":        1772454942 + (index % 1000),
			"ut":        2,
			"s":         1,
			"cpd":       0,
			"pcb":       "-",
			"lld":       0,
			"cd":        1763097939000,
			"cb":        "-",
			"ub":        "-",
			"ud":        0,
			"ua":        1772526871591,
			"ag": map[string]interface{}{
				"s": map[string]interface{}{
					"t": 167,
				},
				"a": map[string]interface{}{
					"t": 3187978,
					"s": map[string]interface{}{
						"t": 3187978,
						"s": 3149311,
						"r": 42506,
					},
				},
			},
		},
	}
}

func main() {
	stats := make(map[string]interface{})
	fmt.Printf("Starting Plain Fixed Properties Benchmark with %d entries...\n", NumEntries)

	plainArray := make([]map[string]interface{}, NumEntries)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Plain Creation", stats, "creationTimeMs", true, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			plainArray[i] = createPlainObjectFixed(i)
		}
		return nil
	})

	fmt.Println("\n--- PLAIN TRAVERSAL ---")
	BenchmarkStats("Plain Traversal (Plain)", stats, "plainTraversalTimeMs", false, func() interface{} {
		dummyCount := 0
		for i := 0; i < NumEntries; i++ {
			if plainArray[i] != nil {
				dummyCount++
			}
		}
		return dummyCount
	})

	fmt.Println("\n--- PROPERTY ACCESS ---")
	BenchmarkStats("Property Access (Plain)", stats, "propAccessTimeMs", false, func() interface{} {
		sum := 0
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			ag := details["ag"].(map[string]interface{})
			a := ag["a"].(map[string]interface{})
			s := a["s"].(map[string]interface{})
			sum += s["r"].(int)
		}
		return sum
	})

	fmt.Println("\n--- FILTERING ---")
	BenchmarkStats("Filtering (Plain)", stats, "filterTimeMs", false, func() interface{} {
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
	BenchmarkStats("Mutation (Plain)", stats, "mutationTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			details["la"] = details["la"].(int) + 1
		}
		return nil
	})

	fmt.Println("\n--- DELETE PROPERTY ---")
	BenchmarkStats("Delete Property (Plain)", stats, "deletePropertyTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			details := plainArray[i]["details"].(map[string]interface{})
			delete(details, "ud")
		}
		return nil
	})

	// Clear memory
	plainArray = nil
	runtime.GC()

	SaveStats("stats.json", "plain object", stats)
}
