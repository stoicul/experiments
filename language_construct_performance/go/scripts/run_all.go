package main

import (
	"fmt"
	"os"
	"os/exec"
)

func runScript(name string) error {
	fmt.Println("=========================================")
	fmt.Printf("Running %s...\n", name)
	fmt.Println("=========================================")
	
	cmd := exec.Command("go", "run", "scripts/"+name+".go", "scripts/benchmark_utils.go")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	if err := cmd.Run(); err != nil {
		fmt.Printf("Error running %s: %v\n", name, err)
		return err
	}
	fmt.Println("\n")
	return nil
}

func main() {
	group := "all"
	if len(os.Args) > 1 {
		group = os.Args[1]
	}

	fmt.Printf("Running benchmarks (group: %s) sequentially in isolated processes...\n\n", group)

	objectsScripts := []string{
		"plain_obj_fixed_properties",
		"value_obj_fixed_properties",
		"value_obj_minimal_fixed_properties",
		"plain_obj_variable_properties",
		"value_obj_variable_properties",
		"value_obj_minimal_variable_properties",
	}

	jsonScripts := []string{
		"json_encoding",
		"json_encoding_struct",
	}

	var scripts []string
	if group == "objects" {
		scripts = objectsScripts
	} else if group == "json" {
		scripts = jsonScripts
	} else {
		scripts = append(objectsScripts, jsonScripts...)
	}

	for _, script := range scripts {
		if err := runScript(script); err != nil {
			os.Exit(1)
		}
	}

	fmt.Println("All benchmarks completed!")
	fmt.Println("=========================================")
	fmt.Println("Updating README.md from stats...")
	fmt.Println("=========================================")
	
	cmd := exec.Command("go", "run", "scripts/update_readme.go")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	if err := cmd.Run(); err != nil {
		fmt.Println("Error updating README.md")
		os.Exit(1)
	} else {
		fmt.Println("README.md successfully updated!")
	}
}
