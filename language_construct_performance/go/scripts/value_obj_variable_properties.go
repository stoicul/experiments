package main

import (
	"fmt"
	"runtime"
)

type AgSTypeVar struct {
	T int
}

type AgASubSTypeVar struct {
	T int
	S int
	R int
}

type AgATypeVar struct {
	T int
	S AgASubSTypeVar
}

type AgTypeVar struct {
	S AgSTypeVar
	A AgATypeVar
}

type DetailsTypeVar struct {
	Provider  string
	AccountId string
	Principal bool
	Tags      []string
	Mfas      string
	La        int
	S         int
	Cpd       int
	Pcb       string
	Lld       int
	Cd        int64
	Cb        string
	Ub        string
	Ud        int
	Ua        int64
	Ut        *int
	Ag        *AgTypeVar
}

type ValueObjectNodeVar struct {
	Label    string
	Id       string
	AccessTo []string
	Details  DetailsTypeVar
	EdgeTo   []string // slices are inherently nillable reference types
}

func createValueObjectVariable(index int) ValueObjectNodeVar {
	var edgeTo []string
	if index%2 == 0 {
		edgeTo = []string{"r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"}
	}

	var ut *int
	if index%3 == 0 {
		val := 2
		ut = &val
	}

	var ag *AgTypeVar
	if index%4 == 0 {
		ag = &AgTypeVar{
			S: AgSTypeVar{T: 167},
			A: AgATypeVar{
				T: 3187978,
				S: AgASubSTypeVar{T: 3187978, S: 3149311, R: 42506},
			},
		}
	}

	return ValueObjectNodeVar{
		Label:    fmt.Sprintf("user-dev-test-%d", index),
		Id:       fmt.Sprintf("u.%d", 16406+index),
		AccessTo: []string{"s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"},
		Details: DetailsTypeVar{
			Provider:  "aws",
			AccountId: "568709751681",
			Principal: true,
			Tags:      []string{"aKIAYI2NaRQPOT", "dev testing local"},
			Mfas:      "",
			La:        1772454942 + (index % 1000),
			S:         1,
			Cpd:       0,
			Pcb:       "-",
			Lld:       0,
			Cd:        1763097939000,
			Cb:        "-",
			Ub:        "-",
			Ud:        0,
			Ua:        1772526871591,
			Ut:        ut,
			Ag:        ag,
		},
		EdgeTo: edgeTo,
	}
}

func main() {
	stats := make(map[string]interface{})
	fmt.Printf("Starting Value Object Variable Properties Benchmark with %d entries...\n", NumEntries)

	valueObjArray := make([]*ValueObjectNodeVar, NumEntries)

	fmt.Println("\n--- CREATION ---")
	BenchmarkStats("Value Object Creation", stats, "creationTimeMs", true, func() interface{} {
		for i := 0; i < NumEntries; i++ {
			obj := createValueObjectVariable(i)
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
			if valueObjArray[i].Details.Ag != nil {
				sum += valueObjArray[i].Details.Ag.A.S.R
			}
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
			valueObjArray[i].Details.Ud = 0
		}
		return nil
	})

	// Clear memory
	valueObjArray = nil
	runtime.GC()

	SaveStats("stats_variable.json", "value object", stats)
}
