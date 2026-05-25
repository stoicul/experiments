package main

import (
	"encoding/json"
	"fmt"
	"os"
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
	columns := 3
	rows := 50000
	fmt.Printf("Starting JSON Encoding/Decoding Benchmark with %d columns x %d rows...\n", columns, rows)

	// Create 2D array
	twoDArray := make([][]map[string]interface{}, columns)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Creation", stats, "creationTimeMs", true, func() interface{} {
		for c := 0; c < columns; c++ {
			columnArray := make([]map[string]interface{}, rows)
			for r := 0; r < rows; r++ {
				columnArray[r] = createPlainObjectFixed(c*rows + r)
			}
			twoDArray[c] = columnArray
		}
		return nil
	})

	var encodedJSON []byte

	fmt.Println("\n--- JSON ENCODING ---")
	BenchmarkStats("JSON Encoding", stats, "jsonEncodeTimeMs", true, func() interface{} {
		var err error
		encodedJSON, err = json.Marshal(twoDArray)
		if err != nil {
			panic(err)
		}
		return nil
	})

	fmt.Println("\n--- JSON DECODING ---")
	BenchmarkStats("JSON Decoding", stats, "jsonDecodeTimeMs", true, func() interface{} {
		var decoded [][]map[string]interface{}
		err := json.Unmarshal(encodedJSON, &decoded)
		if err != nil {
			panic(err)
		}
		return nil
	})

	// Clear memory
	twoDArray = nil
	encodedJSON = nil
	runtime.GC()

	os.MkdirAll("data", 0755)
	jsonStats := map[string]interface{}{
		"columns": columns,
		"rows":    rows,
		"stats":   stats,
	}
	b, _ := json.MarshalIndent(jsonStats, "", "  ")
	os.WriteFile("data/stats_json_plain_idiomatic.json", b, 0644)
	fmt.Printf("\nSaved json stats to data/stats_json_plain_idiomatic.json\n")
}
