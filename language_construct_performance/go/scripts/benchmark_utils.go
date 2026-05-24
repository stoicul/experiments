package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"time"
)

func getNumEntries() int {
	envStr := os.Getenv("NUM_ENTRIES")
	if envStr != "" {
		if val, err := strconv.Atoi(envStr); err == nil {
			return val
		}
	}
	return 20000000
}

var NumEntries = getNumEntries()

type MemoryStats struct {
	RSS      uint64 `json:"rss"`
	HeapUsed uint64 `json:"heapUsed"`
}

func measureMemory() MemoryStats {
	runtime.GC()
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	// HeapAlloc is bytes of allocated heap objects
	// Sys is total bytes of memory obtained from the OS (proxy for RSS)
	return MemoryStats{
		RSS:      m.Sys / 1024 / 1024,
		HeapUsed: m.HeapAlloc / 1024 / 1024,
	}
}

func BenchmarkStats(name string, statGroup map[string]interface{}, statKey string, trackMemory bool, fn func() interface{}) interface{} {
	var memBefore MemoryStats
	if trackMemory {
		memBefore = measureMemory()
	}

	t0 := time.Now()
	res := fn()
	t1 := time.Now()

	var memAfter MemoryStats
	if trackMemory {
		memAfter = measureMemory()
	}

	timeMs := t1.Sub(t0).Milliseconds()
	statGroup[statKey] = timeMs

	if trackMemory {
		var memoryMB uint64
		if memAfter.HeapUsed >= memBefore.HeapUsed {
			memoryMB = memAfter.HeapUsed - memBefore.HeapUsed
		} else {
			memoryMB = 0
		}
		statGroup["memoryUsedMB"] = memoryMB
		out, _ := json.Marshal(memAfter)
		fmt.Printf("%s - Time: %dms, Memory Used (Heap): %d MB %s\n", name, timeMs, memoryMB, string(out))
	} else {
		fmt.Printf("%s: %dms\n", name, timeMs)
	}

	return res
}

func SaveStats(fileName, key string, data map[string]interface{}) {
	os.MkdirAll("data", 0755)
	statsPath := filepath.Join("data", fileName)

	existingStats := map[string]interface{}{
		"numEntries":           NumEntries,
		"plain object":         map[string]interface{}{},
		"value object":         map[string]interface{}{},
		"value object minimal": map[string]interface{}{},
	}

	if b, err := os.ReadFile(statsPath); err == nil {
		json.Unmarshal(b, &existingStats)
	}

	existingStats[key] = data
	existingStats["numEntries"] = NumEntries

	b, _ := json.MarshalIndent(existingStats, "", "  ")
	os.WriteFile(statsPath, b, 0644)
	fmt.Printf("\nSaved %s stats to data/%s\n", key, fileName)
}
