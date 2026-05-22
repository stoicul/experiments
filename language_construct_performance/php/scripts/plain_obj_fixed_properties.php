<?php

declare(strict_types=1);

require_once __DIR__ . '/benchmark_utils.php';

// --- FACTORIES ---

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

// --- BENCHMARK RUNNER ---

$stats = [];

$runBenchmark = function () use (&$stats) {
    echo sprintf("Starting Plain Fixed Properties Benchmark with %s entries...\n", number_format(NUM_ENTRIES));

    $plainArray = [];

    echo "\n--- CREATION ---\n";
    benchmarkStats("Plain Creation", $stats, "creationTimeMs", function () use (&$plainArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $plainArray[$i] = createPlainObject($i);
        }
    }, true);

    echo "\n--- PLAIN TRAVERSAL ---\n";
    benchmarkStats("Plain Traversal (Plain)", $stats, "plainTraversalTimeMs", function () use (&$plainArray) {
        $dummyCount = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($plainArray[$i] !== null) {
                $dummyCount++;
            }
        }
        return $dummyCount;
    });

    echo "\n--- PROPERTY ACCESS ---\n";
    benchmarkStats("Property Access (Plain)", $stats, "propAccessTimeMs", function () use (&$plainArray) {
        $sum = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $sum += $plainArray[$i]['details']['ag']['a']['s']['r'];
        }
        return $sum;
    });

    echo "\n--- FILTERING ---\n";
    benchmarkStats("Filtering (Plain)", $stats, "filterTimeMs", function () use (&$plainArray) {
        $matched = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($plainArray[$i]['details']['la'] > 1772455500) {
                $matched++;
            }
        }
        return $matched;
    });

    echo "\n--- MUTATION ---\n";
    benchmarkStats("Mutation (Plain)", $stats, "mutationTimeMs", function () use (&$plainArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $plainArray[$i]['details']['la'] += 1;
        }
    });

    echo "\n--- DELETE PROPERTY ---\n";
    benchmarkStats("Delete Property (Plain)", $stats, "deletePropertyTimeMs", function () use (&$plainArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            unset($plainArray[$i]['details']['ud']);
        }
    });

    // Clear memory
    $plainArray = [];
    gc_collect_cycles();

    // Save Stats
    saveStats("stats.json", "plain object", $stats);
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
