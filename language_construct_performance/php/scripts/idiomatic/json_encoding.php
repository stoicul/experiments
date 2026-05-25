<?php

declare(strict_types=1);

require_once __DIR__ . '/../benchmark_utils.php';

function createPlainObject(int $index): array
{
    return [
        'label' => 'user-dev-test-' . $index,
        'id' => 'u.' . (16406 + $index),
        'edgeTo' => ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'],
        'accessTo' => ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        'details' => [
            'provider' => 'aws',
            'accountId' => '568709751681',
            'principal' => true,
            'tags' => ['aKIAYI2NaRQPOT', 'dev testing local'],
            'mfas' => '',
            'la' => 1772454942 + ($index % 1000),
            'ut' => 2,
            's' => 1,
            'cpd' => 0,
            'pcb' => '-',
            'lld' => 0,
            'cd' => 1763097939000,
            'cb' => '-',
            'ub' => '-',
            'ud' => 0,
            'ua' => 1772526871591,
            'ag' => [
                's' => [
                    't' => 167
                ],
                'a' => [
                    't' => 3187978,
                    's' => [
                        't' => 3187978,
                        's' => 3149311,
                        'r' => 42506
                    ]
                ]
            ]
        ]
    ];
}

$stats = [];

$runBenchmark = function () use (&$stats) {
    $columns = 3;
    $rows = 50000;
    echo sprintf("Starting JSON Encoding/Decoding Benchmark with %d columns x %d rows...\n", $columns, $rows);

    $twoDArray = [];

    echo "\n--- CREATION ---\n";
    benchmarkStats("Creation", $stats, "creationTimeMs", function () use (&$twoDArray, $columns, $rows) {
        for ($c = 0; $c < $columns; $c++) {
            $columnArray = [];
            for ($r = 0; $r < $rows; $r++) {
                $columnArray[] = createPlainObject($c * $rows + $r);
            }
            $twoDArray[] = $columnArray;
        }
    }, true);

    $encodedJSON = "";

    echo "\n--- JSON ENCODING ---\n";
    benchmarkStats("JSON Encoding", $stats, "jsonEncodeTimeMs", function () use (&$twoDArray, &$encodedJSON) {
        $encodedJSON = json_encode($twoDArray);
    }, true);

    echo "\n--- JSON DECODING ---\n";
    benchmarkStats("JSON Decoding", $stats, "jsonDecodeTimeMs", function () use (&$encodedJSON) {
        $decoded = json_decode($encodedJSON, true);
    }, true);

    
    echo "\n--- JSON FILE WRITE ---\n";
    benchmarkStats("JSON File Write", $stats, "jsonFileWriteTimeMs", function () use (&$encodedJSON) {
        file_put_contents("data/test_dump.json", $encodedJSON);
    }, true);

    $readJSON = "";
    echo "\n--- JSON FILE READ ---\n";
    benchmarkStats("JSON File Read", $stats, "jsonFileReadTimeMs", function () use (&$readJSON) {
        $readJSON = file_get_contents("data/test_dump.json");
    }, true);

    echo "\n--- JSON FILE DECODE ---\n";
    benchmarkStats("JSON File Decode", $stats, "jsonFileDecodeTimeMs", function () use (&$readJSON) {
        $decoded = json_decode($readJSON, true);
    }, true);

        if (file_exists("data/test_dump.json")) unlink("data/test_dump.json");
    // Clear memory
    $twoDArray = [];
    $encodedJSON = "";
    gc_collect_cycles();

    // Save Stats
    if (!is_dir("data")) {
        mkdir("data");
    }
    $statsPath = "data/stats_json.json";
    $allStats = ["columns" => $columns, "rows" => $rows];
    if (file_exists($statsPath)) {
        $existing = json_decode(file_get_contents($statsPath), true);
        if (is_array($existing)) $allStats = array_merge($allStats, $existing);
    }
    $allStats["idiomatic"] = $stats;
    $allStats["columns"] = $columns;
    $allStats["rows"] = $rows;
    file_put_contents($statsPath, json_encode($allStats, JSON_PRETTY_PRINT));
    echo "\nSaved json stats to data/stats_json.json\n";
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
