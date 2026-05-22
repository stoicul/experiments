<?php

declare(strict_types=1);

require_once __DIR__ . '/benchmark_utils.php';

// --- VALUE OBJECT CLASSES ---

class MinimalValueObjectNode
{
    public string $label;
    public string $id;
    public array $accessTo;
    public array $details;

    public ?array $edgeTo = null;

    public function __construct(
        string $label,
        string $id,
        array $accessTo,
        array $details,
        ?array $edgeTo = null
    ) {
        $this->label = $label;
        $this->id = $id;
        $this->accessTo = $accessTo;
        $this->details = $details;

        if ($edgeTo !== null) {
            $this->edgeTo = $edgeTo;
        }
    }
}

// --- FACTORIES ---

function createValueObject(int $index): MinimalValueObjectNode
{
    $edgeTo = $index % 2 === 0 ? ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'] : null;
    $ut = $index % 3 === 0 ? 2 : null;
    $ag = $index % 4 === 0 ? [
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
    ] : null;

    $details = [
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
    ];

    if ($ut !== null) {
        $details['ut'] = $ut;
    }
    if ($ag !== null) {
        $details['ag'] = $ag;
    }

    return new MinimalValueObjectNode(
        'user-dev-test-' . $index,
        'u.' . (16406 + $index),
        ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        $details,
        $edgeTo
    );
}

// --- BENCHMARK RUNNER ---

$stats = [];

$runBenchmark = function () use (&$stats) {
    echo sprintf("Starting Value Object Variable Properties Minimal Benchmark with %s entries...\n", number_format(NUM_ENTRIES));

    $valueObjArray = [];

    echo "\n--- CREATION ---\n";
    benchmarkStats("Value Object Minimal Creation", $stats, "creationTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $valueObjArray[$i] = createValueObject($i);
        }
    }, true);

    echo "\n--- PLAIN TRAVERSAL ---\n";
    benchmarkStats("Plain Traversal (Value Object Minimal)", $stats, "plainTraversalTimeMs", function () use (&$valueObjArray) {
        $dummyCount = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($valueObjArray[$i] !== null) {
                continue;
            }
        }
        return $dummyCount;
    });

    echo "\n--- PROPERTY ACCESS ---\n";
    benchmarkStats("Property Access (Value Object Minimal)", $stats, "propAccessTimeMs", function () use (&$valueObjArray) {
        $sum = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $sum += $valueObjArray[$i]->details['ag']['a']['s']['r'] ?? 0;
        }
        return $sum;
    });

    echo "\n--- FILTERING ---\n";
    benchmarkStats("Filtering (Value Object Minimal)", $stats, "filterTimeMs", function () use (&$valueObjArray) {
        $matched = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($valueObjArray[$i]->details['la'] > 1772455500) {
                $matched++;
            }
        }
        return $matched;
    });

    echo "\n--- MUTATION ---\n";
    benchmarkStats("Mutation (Value Object Minimal)", $stats, "mutationTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $valueObjArray[$i]->details['la'] += 1;
        }
    });

    echo "\n--- DELETE PROPERTY ---\n";
    benchmarkStats("Delete Property (Value Object Minimal)", $stats, "deletePropertyTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            unset($valueObjArray[$i]->details['ud']);
        }
    });

    // Clear memory
    $valueObjArray = [];
    gc_collect_cycles();

    // Save Stats
    saveStats("stats_variable.json", "value object minimal", $stats);
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
