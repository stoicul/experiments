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

	
	fmt.Println("\n--- JSON FILE WRITE ---")
	BenchmarkStats("JSON File Write", stats, "jsonFileWriteTimeMs", true, func() interface{} {
		err := os.WriteFile("data/test_dump.json", encodedJSON, 0644)
		if err != nil {
			panic(err)
		}
		return nil
	})

	var readJSON []byte
	fmt.Println("\n--- JSON FILE READ ---")
	BenchmarkStats("JSON File Read", stats, "jsonFileReadTimeMs", true, func() interface{} {
		var err error
		readJSON, err = os.ReadFile("data/test_dump.json")
		if err != nil {
			panic(err)
		}
		return nil
	})

	fmt.Println("\n--- JSON FILE DECODE ---")
	BenchmarkStats("JSON File Decode", stats, "jsonFileDecodeTimeMs", true, func() interface{} {
		var decoded [][]map[string]interface{}
		err := json.Unmarshal(readJSON, &decoded)
		if err != nil {
			panic(err)
		}
		return nil
	})

		_ = os.Remove("data/test_dump.json")
	// Clear memory
	twoDArray = nil
	encodedJSON = nil
	runtime.GC()

	os.MkdirAll("data", 0755)
	statsPath := "data/stats_json.json"
	allStats := map[string]interface{}{
		"columns": columns,
		"rows":    rows,
	}
	if b, err := os.ReadFile(statsPath); err == nil {
		var existing map[string]interface{}
		if err := json.Unmarshal(b, &existing); err == nil {
			for k, v := range existing {
				allStats[k] = v
			}
		}
	}
	allStats["naive"] = stats
	allStats["columns"] = columns
	allStats["rows"] = rows
	b, _ := json.MarshalIndent(allStats, "", "  ")
	os.WriteFile(statsPath, b, 0644)
	fmt.Printf("\nSaved json stats to data/stats_json.json\n")
}
