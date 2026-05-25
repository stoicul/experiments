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

	
	statsJsonPath := filepath.Join("data", "stats_json.json")
	if b, err := os.ReadFile(statsJsonPath); err == nil {
		var dataJson map[string]interface{}
		if err := json.Unmarshal(b, &dataJson); err == nil {
			r := 0
			c := 0
			if dataJson["rows"] != nil { r = int(dataJson["rows"].(float64)) }
			if dataJson["columns"] != nil { c = int(dataJson["columns"].(float64)) }
			n := map[string]interface{}{}
			i := map[string]interface{}{}
			if dataJson["naive"] != nil { n = dataJson["naive"].(map[string]interface{}) }
			if dataJson["idiomatic"] != nil { i = dataJson["idiomatic"].(map[string]interface{}) }
            
            sr := strconv.Itoa(r)
            sNum := sr
            var formattedR string
            for idx, ch := range sNum {
                if idx > 0 && (len(sNum)-idx)%3 == 0 {
                    formattedR += ","
                }
                formattedR += string(ch)
            }
			
			newSection += fmt.Sprintf("\n\n### 3. JSON Encoding/Decoding (%d cols x %s rows)\n\n", c, formattedR)
			newSection += "| Metric | Naive | Idiomatic |\n"
			newSection += "| :--- | :---: | :---: |\n"
			newSection += fmt.Sprintf("| **Creation Time** | %s | %s |\n", formatMS(n["creationTimeMs"]), formatMS(i["creationTimeMs"]))
			newSection += fmt.Sprintf("| **Memory Used (Heap)** | %s | %s |\n", formatMB(n["memoryUsedMB"]), formatMB(i["memoryUsedMB"]))
			newSection += fmt.Sprintf("| **JSON Encoding Time** | %s | %s |\n", formatMS(n["jsonEncodeTimeMs"]), formatMS(i["jsonEncodeTimeMs"]))
			newSection += fmt.Sprintf("| **JSON Decoding Time** | %s | %s |\n", formatMS(n["jsonDecodeTimeMs"]), formatMS(i["jsonDecodeTimeMs"]))
			newSection += fmt.Sprintf("| **JSON File Write Time** | %s | %s |\n", formatMS(n["jsonFileWriteTimeMs"]), formatMS(i["jsonFileWriteTimeMs"]))
			newSection += fmt.Sprintf("| **JSON File Read Time** | %s | %s |\n", formatMS(n["jsonFileReadTimeMs"]), formatMS(i["jsonFileReadTimeMs"]))
			newSection += fmt.Sprintf("| **JSON File Decode Time** | %s | %s |\n", formatMS(n["jsonFileDecodeTimeMs"]), formatMS(i["jsonFileDecodeTimeMs"]))
		}
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
