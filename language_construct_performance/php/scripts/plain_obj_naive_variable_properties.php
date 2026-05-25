<?php

declare(strict_types=1);

require_once __DIR__ . '/benchmark_utils.php';

// --- FACTORIES ---

function createPlainObject(int $index): array
{
    $obj = [
        'label' => 'user-dev-test-' . $index,
        'id' => 'u.' . (16406 + $index),
        'accessTo' => ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        'details' => [
            'provider' => 'aws',
            'accountId' => '568709751681',
            'principal' => true,
            'tags' => ['aKIAYI2NaRQPOT', 'dev testing local'],
            'mfas' => '',
            'la' => 1772454942 + ($index % 1000),
            's' => 1,
            'cpd' => 0,
            'pcb' => '-',
            'lld' => 0,
            'cd' => 1763097939000,
            'cb' => '-',
            'ub' => '-',
            'ud' => 0,
            'ua' => 1772526871591
        ]
    ];

    if ($index % 2 === 0) {
        $obj['edgeTo'] = ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'];
    }

    if ($index % 3 === 0) {
        $obj['details']['ut'] = 2;
    }

    if ($index % 4 === 0) {
        $obj['details']['ag'] = [
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
        ];
    }

    return $obj;
}

// --- BENCHMARK RUNNER ---

$stats = [];

$runBenchmark = function () use (&$stats) {
    echo sprintf("Starting Plain Naive Naive Variable Properties Benchmark with %s entries...\n", number_format(NUM_ENTRIES));

    $plainArray = [];

    echo "\n--- CREATION ---\n";
    benchmarkStats("Plain Naive Creation", $stats, "creationTimeMs", function () use (&$plainArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $plainArray[$i] = createPlainObject($i);
        }
    }, true);

    echo "\n--- PLAIN TRAVERSAL ---\n";
    benchmarkStats("Plain Traversal (Plain Naive)", $stats, "plainTraversalTimeMs", function () use (&$plainArray) {
        $dummyCount = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($plainArray[$i] !== null) {
                $dummyCount++;
            }
        }
        return $dummyCount;
    });

    echo "\n--- PROPERTY ACCESS ---\n";
    benchmarkStats("Property Access (Plain Naive)", $stats, "propAccessTimeMs", function () use (&$plainArray) {
        $sum = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $sum += $plainArray[$i]['details']['ag']['a']['s']['r'] ?? 0;
        }
        return $sum;
    });

    echo "\n--- FILTERING ---\n";
    benchmarkStats("Filtering (Plain Naive)", $stats, "filterTimeMs", function () use (&$plainArray) {
        $matched = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($plainArray[$i]['details']['la'] > 1772455500) {
                $matched++;
            }
        }
        return $matched;
    });

    echo "\n--- MUTATION ---\n";
    benchmarkStats("Mutation (Plain Naive)", $stats, "mutationTimeMs", function () use (&$plainArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $plainArray[$i]['details']['la'] += 1;
        }
    });

    echo "\n--- DELETE PROPERTY ---\n";
    benchmarkStats("Delete Property (Plain Naive)", $stats, "deletePropertyTimeMs", function () use (&$plainArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            unset($plainArray[$i]['details']['ud']);
        }
    });

    // Clear memory
    $plainArray = [];
    gc_collect_cycles();

    // Save Stats
    saveStats("stats_variable.json", "plain object naive", $stats);
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
