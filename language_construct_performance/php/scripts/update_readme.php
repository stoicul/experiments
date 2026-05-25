<?php

declare(strict_types=1);

function formatMB(int $mb): string
{
    $gb = number_format($mb / 1024, 1);
    return sprintf("%s MB (~%s GB)", number_format($mb), $gb);
}

function formatMS(int $ms): string
{
    return sprintf("%s ms", number_format($ms));
}

function run()
{
    $readmePath = dirname(__DIR__) . '/README.md';
    $statsPath = dirname(__DIR__) . '/data/stats.json';
    $statsVarPath = dirname(__DIR__) . '/data/stats_variable.json';

    $stats = null;
    $statsVar = null;

    if (file_exists($statsPath)) {
        try {
            $content = file_get_contents($statsPath);
            if ($content !== false) {
                $stats = json_decode($content, true);
            }
        } catch (\Throwable $e) {
            echo "Error parsing {$statsPath}: " . $e->getMessage() . "\n";
        }
    }

    if (file_exists($statsVarPath)) {
        try {
            $content = file_get_contents($statsVarPath);
            if ($content !== false) {
                $statsVar = json_decode($content, true);
            }
        } catch (\Throwable $e) {
            echo "Error parsing {$statsVarPath}: " . $e->getMessage() . "\n";
        }
    }

    if (!$stats && !$statsVar) {
        echo "No valid stats files found in data/ directory!\n";
        exit(1);
    }

    $numEntries = $stats['numEntries'] ?? $statsVar['numEntries'] ?? 1000000;
    $formattedEntries = number_format($numEntries);

    $newSection = "<!-- BENCHMARK_RESULTS_START -->\n";
    $newSection .= "## Benchmark Results ({$formattedEntries} Entries)\n\n";
    $newSection .= "Here are the actual measured results from running the isolated benchmark suite under PHP with **{$formattedEntries} entries**:\n";

    if ($stats) {
        $newSection .= "\n### 1. Fixed Properties (Uniform Structural Shape)\n\n";
        $newSection .= "| Metric | Plain Object (Array) | Value Object | Value Object Minimal |\n";
        $newSection .= "| :--- | :---: | :---: | :---: | :---: |\n";
        $newSection .= sprintf("| **Creation Time** | %s | %s | %s |\n", formatMS($stats['plain object']['creationTimeMs'] ?? 0), formatMS($stats['value object']['creationTimeMs'] ?? 0), formatMS($stats['value object minimal']['creationTimeMs'] ?? 0));
        $newSection .= sprintf("| **Memory Used (Heap)** | %s | %s | %s |\n", formatMB($stats['plain object']['memoryUsedMB'] ?? 0), formatMB($stats['value object']['memoryUsedMB'] ?? 0), formatMB($stats['value object minimal']['memoryUsedMB'] ?? 0));
        $newSection .= sprintf("| **Traversal Time** | %s | %s | %s |\n", formatMS($stats['plain object']['plainTraversalTimeMs'] ?? 0), formatMS($stats['value object']['plainTraversalTimeMs'] ?? 0), formatMS($stats['value object minimal']['plainTraversalTimeMs'] ?? 0));
        $newSection .= sprintf("| **Property Access Time** | %s | %s | %s |\n", formatMS($stats['plain object']['propAccessTimeMs'] ?? 0), formatMS($stats['value object']['propAccessTimeMs'] ?? 0), formatMS($stats['value object minimal']['propAccessTimeMs'] ?? 0));
        $newSection .= sprintf("| **Filtering Time** | %s | %s | %s |\n", formatMS($stats['plain object']['filterTimeMs'] ?? 0), formatMS($stats['value object']['filterTimeMs'] ?? 0), formatMS($stats['value object minimal']['filterTimeMs'] ?? 0));
        $newSection .= sprintf("| **Mutation Time** | %s | %s | %s |\n", formatMS($stats['plain object']['mutationTimeMs'] ?? 0), formatMS($stats['value object']['mutationTimeMs'] ?? 0), formatMS($stats['value object minimal']['mutationTimeMs'] ?? 0));
        $newSection .= sprintf("| **Delete Property Time** | %s | %s | %s |\n", formatMS($stats['plain object']['deletePropertyTimeMs'] ?? 0), formatMS($stats['value object']['deletePropertyTimeMs'] ?? 0), formatMS($stats['value object minimal']['deletePropertyTimeMs'] ?? 0));
    }

    if ($statsVar) {
        $newSection .= "\n### 2. Variable Properties (Polymorphic Shapes)\n\n";
        $newSection .= "| Metric | Plain Object (Array) | Value Object | Value Object Minimal |\n";
        $newSection .= "| :--- | :---: | :---: | :---: | :---: |\n";
        $newSection .= sprintf("| **Creation Time** | %s | %s | %s |\n", formatMS($statsVar['plain object']['creationTimeMs'] ?? 0), formatMS($statsVar['value object']['creationTimeMs'] ?? 0), formatMS($statsVar['value object minimal']['creationTimeMs'] ?? 0));
        $newSection .= sprintf("| **Memory Used (Heap)** | %s | %s | %s |\n", formatMB($statsVar['plain object']['memoryUsedMB'] ?? 0), formatMB($statsVar['value object']['memoryUsedMB'] ?? 0), formatMB($statsVar['value object minimal']['memoryUsedMB'] ?? 0));
        $newSection .= sprintf("| **Traversal Time** | %s | %s | %s |\n", formatMS($statsVar['plain object']['plainTraversalTimeMs'] ?? 0), formatMS($statsVar['value object']['plainTraversalTimeMs'] ?? 0), formatMS($statsVar['value object minimal']['plainTraversalTimeMs'] ?? 0));
        $newSection .= sprintf("| **Property Access Time** | %s | %s | %s |\n", formatMS($statsVar['plain object']['propAccessTimeMs'] ?? 0), formatMS($statsVar['value object']['propAccessTimeMs'] ?? 0), formatMS($statsVar['value object minimal']['propAccessTimeMs'] ?? 0));
        $newSection .= sprintf("| **Filtering Time** | %s | %s | %s |\n", formatMS($statsVar['plain object']['filterTimeMs'] ?? 0), formatMS($statsVar['value object']['filterTimeMs'] ?? 0), formatMS($statsVar['value object minimal']['filterTimeMs'] ?? 0));
        $newSection .= sprintf("| **Mutation Time** | %s | %s | %s |\n", formatMS($statsVar['plain object']['mutationTimeMs'] ?? 0), formatMS($statsVar['value object']['mutationTimeMs'] ?? 0), formatMS($statsVar['value object minimal']['mutationTimeMs'] ?? 0));
        $newSection .= sprintf("| **Delete Property Time** | %s | %s | %s |\n", formatMS($statsVar['plain object']['deletePropertyTimeMs'] ?? 0), formatMS($statsVar['value object']['deletePropertyTimeMs'] ?? 0), formatMS($statsVar['value object minimal']['deletePropertyTimeMs'] ?? 0));
    }

    $newSection .= "\n<!-- BENCHMARK_RESULTS_END -->";

    $readmeContent = "";
    if (file_exists($readmePath)) {
        $readmeContent = file_get_contents($readmePath);
    }

    $startMarker = "<!-- BENCHMARK_RESULTS_START -->";
    $endMarker = "<!-- BENCHMARK_RESULTS_END -->";

    if (strpos($readmeContent, $startMarker) !== false && strpos($readmeContent, $endMarker) !== false) {
        $startIndex = strpos($readmeContent, $startMarker);
        $endIndex = strpos($readmeContent, $endMarker) + strlen($endMarker);
        $readmeContent = substr($readmeContent, 0, $startIndex) . $newSection . substr($readmeContent, $endIndex);
    } else {
        // Look for ## Benchmark Results and replace or append
        $regex = '/## Benchmark Results \([\d,]+ Entries\)[\s\S]*?(?=## Key Findings)/';
        if (preg_match($regex, $readmeContent, $matches, PREG_OFFSET_CAPTURE)) {
            $readmeContent = preg_replace($regex, $newSection . "\n\n", $readmeContent);
        } else {
            // Append right before "## Key Findings" or at end
            $keyFindingsPos = strpos($readmeContent, "## Key Findings");
            if ($keyFindingsPos !== false) {
                $readmeContent = substr($readmeContent, 0, $keyFindingsPos) . $newSection . "\n\n" . substr($readmeContent, $keyFindingsPos);
            } else {
                $readmeContent .= "\n\n" . $newSection;
            }
        }
    }

    file_put_contents($readmePath, $readmeContent);
    echo "Successfully updated README.md from stats!\n";
}

run();
