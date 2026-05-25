package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"strconv"
)

func formatMB(mb interface{}) string {
	if mb == nil {
		return "0 MB"
	}
	var val float64
	switch v := mb.(type) {
	case float64:
		val = v
	case int:
		val = float64(v)
	default:
		return fmt.Sprintf("%v MB", mb)
	}
	gb := val / 1024.0
	// Not adding comma formatting for simplicity here
	return fmt.Sprintf("%d MB (~%.1f GB)", int(val), gb)
}

func formatMS(ms interface{}) string {
	if ms == nil {
		return "0 ms"
	}
	var val int
	switch v := ms.(type) {
	case float64:
		val = int(v)
	case int:
		val = v
	default:
		return fmt.Sprintf("%v ms", ms)
	}
	// Simple comma formatting could be done, but keep it simple
	s := strconv.Itoa(val)
	n := len(s)
	if n <= 3 {
		return s + " ms"
	}
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (n-i)%3 == 0 {
			b.WriteRune(',')
		}
		b.WriteRune(c)
	}
	return b.String() + " ms"
}

func main() {
	readmePath := "README.md"
	statsPath := filepath.Join("data", "stats.json")
	statsVarPath := filepath.Join("data", "stats_variable.json")

	if _, err := os.Stat(readmePath); os.IsNotExist(err) {
		fmt.Fprintln(os.Stderr, "README.md not found!")
		os.Exit(1)
	}

	var stats map[string]interface{}
	var statsVar map[string]interface{}

	if b, err := os.ReadFile(statsPath); err == nil {
		json.Unmarshal(b, &stats)
	}
	if b, err := os.ReadFile(statsVarPath); err == nil {
		json.Unmarshal(b, &statsVar)
	}

	if stats == nil && statsVar == nil {
		fmt.Fprintln(os.Stderr, "No valid stats files found in data/ directory!")
		os.Exit(1)
	}

	var numEntries float64 = 20000000
	if stats != nil && stats["numEntries"] != nil {
		numEntries = stats["numEntries"].(float64)
	} else if statsVar != nil && statsVar["numEntries"] != nil {
		numEntries = statsVar["numEntries"].(float64)
	}
	
	sNum := strconv.Itoa(int(numEntries))
	var formattedEntries string
	for i, c := range sNum {
		if i > 0 && (len(sNum)-i)%3 == 0 {
			formattedEntries += ","
		}
		formattedEntries += string(c)
	}

	newSection := "<!-- BENCHMARK_RESULTS_START -->\n"
	newSection += "## Benchmark Results (" + formattedEntries + " Entries)\n\n"
	newSection += "Here are the actual measured results from running the isolated benchmark suite under Go with **" + formattedEntries + " entries**:\n"

	if stats != nil {
		newSection += "\n### 1. Fixed Properties (Uniform Structural Shape)\n\n"
		newSection += "| Metric | Plain Object | Value Object | Value Object Minimal |\n"
		newSection += "| :--- | :---: | :---: | :---: | :---: |\n"
		
		po := stats["plain object"].(map[string]interface{})
		vo := stats["value object"].(map[string]interface{})
		vom := stats["value object minimal"].(map[string]interface{})

		newSection += fmt.Sprintf("| **Creation Time** | %s | %s | %s |\n", formatMS(po["creationTimeMs"]), formatMS(vo["creationTimeMs"]), formatMS(vom["creationTimeMs"]))
		newSection += fmt.Sprintf("| **Memory Used (Heap)** | %s | %s | %s |\n", formatMB(po["memoryUsedMB"]), formatMB(vo["memoryUsedMB"]), formatMB(vom["memoryUsedMB"]))
		newSection += fmt.Sprintf("| **Traversal Time** | %s | %s | %s |\n", formatMS(po["plainTraversalTimeMs"]), formatMS(vo["plainTraversalTimeMs"]), formatMS(vom["plainTraversalTimeMs"]))
		newSection += fmt.Sprintf("| **Property Access Time** | %s | %s | %s |\n", formatMS(po["propAccessTimeMs"]), formatMS(vo["propAccessTimeMs"]), formatMS(vom["propAccessTimeMs"]))
		newSection += fmt.Sprintf("| **Filtering Time** | %s | %s | %s |\n", formatMS(po["filterTimeMs"]), formatMS(vo["filterTimeMs"]), formatMS(vom["filterTimeMs"]))
		newSection += fmt.Sprintf("| **Mutation Time** | %s | %s | %s |\n", formatMS(po["mutationTimeMs"]), formatMS(vo["mutationTimeMs"]), formatMS(vom["mutationTimeMs"]))
		newSection += fmt.Sprintf("| **Delete Property Time** | %s | %s | %s |\n", formatMS(po["deletePropertyTimeMs"]), formatMS(vo["deletePropertyTimeMs"]), formatMS(vom["deletePropertyTimeMs"]))
	}

	if statsVar != nil {
		newSection += "\n### 2. Variable Properties (Polymorphic Shapes)\n\n"
		newSection += "| Metric | Plain Object | Value Object | Value Object Minimal |\n"
		newSection += "| :--- | :---: | :---: | :---: | :---: |\n"
		
		po := statsVar["plain object"].(map[string]interface{})
		vo := statsVar["value object"].(map[string]interface{})
		vom := statsVar["value object minimal"].(map[string]interface{})

		newSection += fmt.Sprintf("| **Creation Time** | %s | %s | %s |\n", formatMS(po["creationTimeMs"]), formatMS(vo["creationTimeMs"]), formatMS(vom["creationTimeMs"]))
		newSection += fmt.Sprintf("| **Memory Used (Heap)** | %s | %s | %s |\n", formatMB(po["memoryUsedMB"]), formatMB(vo["memoryUsedMB"]), formatMB(vom["memoryUsedMB"]))
		newSection += fmt.Sprintf("| **Traversal Time** | %s | %s | %s |\n", formatMS(po["plainTraversalTimeMs"]), formatMS(vo["plainTraversalTimeMs"]), formatMS(vom["plainTraversalTimeMs"]))
		newSection += fmt.Sprintf("| **Property Access Time** | %s | %s | %s |\n", formatMS(po["propAccessTimeMs"]), formatMS(vo["propAccessTimeMs"]), formatMS(vom["propAccessTimeMs"]))
		newSection += fmt.Sprintf("| **Filtering Time** | %s | %s | %s |\n", formatMS(po["filterTimeMs"]), formatMS(vo["filterTimeMs"]), formatMS(vom["filterTimeMs"]))
		newSection += fmt.Sprintf("| **Mutation Time** | %s | %s | %s |\n", formatMS(po["mutationTimeMs"]), formatMS(vo["mutationTimeMs"]), formatMS(vom["mutationTimeMs"]))
		newSection += fmt.Sprintf("| **Delete Property Time** | %s | %s | %s |\n", formatMS(po["deletePropertyTimeMs"]), formatMS(vo["deletePropertyTimeMs"]), formatMS(vom["deletePropertyTimeMs"]))
	}

	newSection += "\n<!-- BENCHMARK_RESULTS_END -->"

	b, _ := os.ReadFile(readmePath)
	readmeContent := string(b)

	startMarker := "<!-- BENCHMARK_RESULTS_START -->"
	endMarker := "<!-- BENCHMARK_RESULTS_END -->"

	if strings.Contains(readmeContent, startMarker) && strings.Contains(readmeContent, endMarker) {
		startIdx := strings.Index(readmeContent, startMarker)
		endIdx := strings.Index(readmeContent, endMarker) + len(endMarker)
		readmeContent = readmeContent[:startIdx] + newSection + readmeContent[endIdx:]
	} else {
		// Just append it
		readmeContent += "\n\n" + newSection
	}

	os.WriteFile(readmePath, []byte(readmeContent), 0644)
	fmt.Println("Successfully updated README.md from stats!")
}
