<?php

declare(strict_types=1);

ini_set('memory_limit', '-1');

$numEntriesEnv = getenv('NUM_ENTRIES');
define('NUM_ENTRIES', $numEntriesEnv !== false ? (int)$numEntriesEnv : 1000000);

function measureMemory(): array
{
    // Force cycle collection to get an accurate representation of active memory
    gc_collect_cycles();
    $used = memory_get_usage(false);
    $total = memory_get_usage(true);
    $peak = memory_get_peak_usage(false);
    return [
        'used' => (int)round($used / 1024 / 1024),
        'total' => (int)round($total / 1024 / 1024),
        'peak' => (int)round($peak / 1024 / 1024),
    ];
}

/**
 * @template T
 * @param string $name
 * @param array $statGroup
 * @param string $statKey
 * @param callable(): T $fn
 * @param bool $trackMemory
 * @return T
 */
function benchmarkStats(
    string $name,
    array &$statGroup,
    string $statKey,
    callable $fn,
    bool $trackMemory = false
) {
    $memBefore = $trackMemory ? measureMemory() : null;
    $t0 = microtime(true);
    $result = $fn();
    $t1 = microtime(true);
    $memAfter = $trackMemory ? measureMemory() : null;

    $timeMs = (int)round(($t1 - $t0) * 1000);
    $statGroup[$statKey] = $timeMs;

    if ($trackMemory) {
        $memoryMB = $memAfter['used'] - $memBefore['used'];
        if ($memoryMB < 0) {
            $memoryMB = 0;
        }
        $statGroup['memoryUsedMB'] = $memoryMB;
        echo sprintf("%s - Time: %dms, Memory Used (Heap): %d MB %s\n", $name, $timeMs, $memoryMB, json_encode($memAfter));
    } else {
        echo sprintf("%s: %dms\n", $name, $timeMs);
    }

    return $result;
}

function saveStats(string $fileName, string $key, array $data): void
{
    if (!is_dir('data')) {
        mkdir('data', 0777, true);
    }
    $statsPath = 'data/' . $fileName;
    $existingStats = [
        'numEntries' => NUM_ENTRIES,
        'plain object' => [],
        'value object' => [],
        'value object minimal' => []
    ];
    if (file_exists($statsPath)) {
        try {
            $content = file_get_contents($statsPath);
            if ($content !== false) {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $existingStats = array_merge($existingStats, $decoded);
                }
            }
        } catch (\Throwable $e) {
            echo "Error parsing existing stats in {$statsPath}: " . $e->getMessage() . "\n";
        }
    }

    $existingStats[$key] = $data;
    $existingStats['numEntries'] = NUM_ENTRIES;

    file_put_contents($statsPath, json_encode($existingStats, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo "\nSaved {$key} stats to data/{$fileName}\n";
}
