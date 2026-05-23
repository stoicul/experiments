package main

import (
	"fmt"
	"runtime"
)

type AgSType struct {
	T int
}

type AgASubSType struct {
	T int
	S int
	R int
}

type AgAType struct {
	T int
	S AgASubSType
}

type AgType struct {
	S AgSType
	A AgAType
}

type DetailsType struct {
	Provider  string
	AccountId string
	Principal bool
	Tags      []string
	Mfas      string
	La        int
	Ut        int
	S         int
	Cpd       int
	Pcb       string
	Lld       int
	Cd        int64
	Cb        string
	Ub        string
	Ud        int
	Ua        int64
	Ag        AgType
}

type ValueObjectNode struct {
	Label    string
	Id       string
	EdgeTo   []string
	AccessTo []string
	Details  DetailsType
}

func createValueObjectFixed(index int) ValueObjectNode {
	return ValueObjectNode{
		Label:    fmt.Sprintf("user-dev-test-%d", index),
		Id:       fmt.Sprintf("u.%d", 16406+index),
		EdgeTo:   []string{"r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"},
		AccessTo: []string{"s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"},
		Details: DetailsType{
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
			Ag: AgType{
				S: AgSType{T: 167},
				A: AgAType{
					T: 3187978,
					S: AgASubSType{T: 3187978, S: 3149311, R: 42506},
				},
			},
		},
	}
}

func main() {
	stats := make(map[string]interface{})
	fmt.Printf("Starting Value Object Fixed Properties Benchmark with %d entries...\n", NumEntries)

	// Array of pointers to simulate objects
	valueObjArray := make([]*ValueObjectNode, NumEntries)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Value Object Creation", stats, "creationTimeMs", true, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			obj := createValueObjectFixed(i)
			valueObjArray[i] = &obj
		}
		return nil
	})

	fmt.Println("\n--- PLAIN TRAVERSAL ---")
	BenchmarkStats("Plain Traversal (Value Object)", stats, "plainTraversalTimeMs", false, func() interface{} {
		dummyCount := 0
		for i := 0; i < NumEntries; i++ {
			if valueObjArray[i] != nil {
				dummyCount++
			}
		}
		return dummyCount
	})

	fmt.Println("\n--- PROPERTY ACCESS ---")
	BenchmarkStats("Property Access (Value Object)", stats, "propAccessTimeMs", false, func() interface{} {
		sum := 0
		for i := 0; i < NumEntries; i++ {
			sum += valueObjArray[i].Details.Ag.A.S.R
		}
		return sum
	})

	fmt.Println("\n--- FILTERING ---")
	BenchmarkStats("Filtering (Value Object)", stats, "filterTimeMs", false, func() interface{} {
		matched := 0
		for i := 0; i < NumEntries; i++ {
			if valueObjArray[i].Details.La > 1772455500 {
				matched++
			}
		}
		return matched
	})

	fmt.Println("\n--- MUTATION ---")
	BenchmarkStats("Mutation (Value Object)", stats, "mutationTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			valueObjArray[i].Details.La += 1
		}
		return nil
	})

	fmt.Println("\n--- DELETE PROPERTY ---")
	BenchmarkStats("Delete Property (Value Object)", stats, "deletePropertyTimeMs", false, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			valueObjArray[i].Details.Ud = 0 // In Go structs we can't truly delete, set to zero value
		}
		return nil
	})

	// Clear memory
	valueObjArray = nil
	runtime.GC()

	SaveStats("stats.json", "value object", stats)
}
