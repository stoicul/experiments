package main

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
)

type JSONStructAgSType struct {
	T int `json:"t"`
}

type JSONStructAgASubSType struct {
	T int `json:"t"`
	S int `json:"s"`
	R int `json:"r"`
}

type JSONStructAgAType struct {
	T int                   `json:"t"`
	S JSONStructAgASubSType `json:"s"`
}

type JSONStructAgType struct {
	S JSONStructAgSType `json:"s"`
	A JSONStructAgAType `json:"a"`
}

type JSONStructDetailsType struct {
	Provider  string           `json:"provider"`
	AccountId string           `json:"accountId"`
	Principal bool             `json:"principal"`
	Tags      []string         `json:"tags"`
	Mfas      string           `json:"mfas"`
	La        int              `json:"la"`
	Ut        int              `json:"ut"`
	S         int              `json:"s"`
	Cpd       int              `json:"cpd"`
	Pcb       string           `json:"pcb"`
	Lld       int              `json:"lld"`
	Cd        int64            `json:"cd"`
	Cb        string           `json:"cb"`
	Ub        string           `json:"ub"`
	Ud        int              `json:"ud"`
	Ua        int64            `json:"ua"`
	Ag        JSONStructAgType `json:"ag"`
}

type JSONStructValueObjectNode struct {
	Label    string                `json:"label"`
	Id       string                `json:"id"`
	EdgeTo   []string              `json:"edgeTo"`
	AccessTo []string              `json:"accessTo"`
	Details  JSONStructDetailsType `json:"details"`
}

func createPlainObjectFixedStruct(index int) JSONStructValueObjectNode {
	return JSONStructValueObjectNode{
		Label:    fmt.Sprintf("user-dev-test-%d", index),
		Id:       fmt.Sprintf("u.%d", 16406+index),
		EdgeTo:   []string{"r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"},
		AccessTo: []string{"s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"},
		Details: JSONStructDetailsType{
			Provider:  "aws",
			AccountId: "568709751681",
			Principal: true,
			Tags:      []string{"aKIAYI2NaRQPOT", "dev testing local"},
			Mfas:      "",
			La:        1772454942 + (index % 1000),
			Ut:        2,
			S:         1,
			Cpd:       0,
			Pcb:       "-",
			Lld:       0,
			Cd:        1763097939000,
			Cb:        "-",
			Ub:        "-",
			Ud:        0,
			Ua:        1772526871591,
			Ag: JSONStructAgType{
				S: JSONStructAgSType{
					T: 167,
				},
				A: JSONStructAgAType{
					T: 3187978,
					S: JSONStructAgASubSType{
						T: 3187978,
						S: 3149311,
						R: 42506,
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
	fmt.Printf("Starting JSON Struct-Based Encoding/Decoding Benchmark with %d columns x %d rows...\n", columns, rows)

	// Create 2D array of structs
	twoDArray := make([][]JSONStructValueObjectNode, columns)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Creation", stats, "creationTimeMs", true, func() interface{} {
		for c := 0; c < columns; c++ {
			columnArray := make([]JSONStructValueObjectNode, rows)
			for r := 0; r < rows; r++ {
				columnArray[r] = createPlainObjectFixedStruct(c*rows + r)
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
		var decoded [][]JSONStructValueObjectNode
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
	os.WriteFile("data/stats_json_struct.json", b, 0644)
	fmt.Printf("\nSaved struct-based json stats to data/stats_json_struct.json\n")
}
