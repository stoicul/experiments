<?php

declare(strict_types=1);

require_once __DIR__ . '/benchmark_utils.php';

// --- VALUE OBJECT CLASSES ---

class AgSType
{
    public int $t;
    public function __construct(int $t)
    {
        $this->t = $t;
    }
}

class AgASubSType
{
    public int $t;
    public int $s;
    public int $r;
    public function __construct(int $t, int $s, int $r)
    {
        $this->t = $t;
        $this->s = $s;
        $this->r = $r;
    }
}

class AgAType
{
    public int $t;
    public AgASubSType $s;
    public function __construct(int $t, AgASubSType $s)
    {
        $this->t = $t;
        $this->s = $s;
    }
}

class AgType
{
    public AgSType $s;
    public AgAType $a;
    public function __construct(AgSType $s, AgAType $a)
    {
        $this->s = $s;
        $this->a = $a;
    }
}

class DetailsType
{
    public string $provider;
    public string $accountId;
    public bool $principal;
    public array $tags;
    public string $mfas;
    public int $la;
    public int $ut;
    public int $s;
    public int $cpd;
    public string $pcb;
    public int $lld;
    public int $cd;
    public string $cb;
    public string $ub;
    public int $ud;
    public int $ua;
    public AgType $ag;

    public function __construct(
        string $provider,
        string $accountId,
        bool $principal,
        array $tags,
        string $mfas,
        int $la,
        int $ut,
        int $s,
        int $cpd,
        string $pcb,
        int $lld,
        int $cd,
        string $cb,
        string $ub,
        int $ud,
        int $ua,
        AgType $ag
    ) {
        $this->provider = $provider;
        $this->accountId = $accountId;
        $this->principal = $principal;
        $this->tags = $tags;
        $this->mfas = $mfas;
        $this->la = $la;
        $this->ut = $ut;
        $this->s = $s;
        $this->cpd = $cpd;
        $this->pcb = $pcb;
        $this->lld = $lld;
        $this->cd = $cd;
        $this->cb = $cb;
        $this->ub = $ub;
        $this->ud = $ud;
        $this->ua = $ua;
        $this->ag = $ag;
    }
}

class ValueObjectNode
{
    public string $label;
    public string $id;
    public array $edgeTo;
    public array $accessTo;
    public DetailsType $details;

    public function __construct(
        string $label,
        string $id,
        array $edgeTo,
        array $accessTo,
        DetailsType $details
    ) {
        $this->label = $label;
        $this->id = $id;
        $this->edgeTo = $edgeTo;
        $this->accessTo = $accessTo;
        $this->details = $details;
    }
}

// --- FACTORIES ---

function createValueObject(int $index): ValueObjectNode
{
    return new ValueObjectNode(
        'user-dev-test-' . $index,
        'u.' . (16406 + $index),
        ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'],
        ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        new DetailsType(
            'aws',
            '568709751681',
            true,
            ['aKIAYI2NaRQPOT', 'dev testing local'],
            '',
            1772454942 + ($index % 1000),
            2,
            1,
            0,
            '-',
            0,
            1763097939000,
            '-',
            '-',
            0,
            1772526871591,
            new AgType(
                new AgSType(167),
                new AgAType(
                    3187978,
                    new AgASubSType(3187978, 3149311, 42506)
                )
            )
        )
    );
}

// --- BENCHMARK RUNNER ---

$stats = [];

$runBenchmark = function () use (&$stats) {
    echo sprintf("Starting Value Object Naive Naive Fixed Properties Benchmark with %s entries...\n", number_format(NUM_ENTRIES));

    $valueObjArray = [];

    echo "\n--- CREATION ---\n";
    benchmarkStats("Value Object Naive Creation", $stats, "creationTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $valueObjArray[$i] = createValueObject($i);
        }
    }, true);

    echo "\n--- PLAIN TRAVERSAL ---\n";
    benchmarkStats("Plain Traversal (Value Object Naive)", $stats, "plainTraversalTimeMs", function () use (&$valueObjArray) {
        $dummyCount = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($valueObjArray[$i] !== null) {
                continue;
            }
        }
        return $dummyCount;
    });

    echo "\n--- PROPERTY ACCESS ---\n";
    benchmarkStats("Property Access (Value Object Naive)", $stats, "propAccessTimeMs", function () use (&$valueObjArray) {
        $sum = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $sum += $valueObjArray[$i]->details->ag->a->s->r;
        }
        return $sum;
    });

    echo "\n--- FILTERING ---\n";
    benchmarkStats("Filtering (Value Object Naive)", $stats, "filterTimeMs", function () use (&$valueObjArray) {
        $matched = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($valueObjArray[$i]->details->la > 1772455500) {
                $matched++;
            }
        }
        return $matched;
    });

    echo "\n--- MUTATION ---\n";
    benchmarkStats("Mutation (Value Object Naive)", $stats, "mutationTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $valueObjArray[$i]->details->la += 1;
        }
    });

    echo "\n--- DELETE PROPERTY ---\n";
    benchmarkStats("Delete Property (Value Object Naive)", $stats, "deletePropertyTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            unset($valueObjArray[$i]->details->ud);
        }
    });

    // Clear memory
    $valueObjArray = [];
    gc_collect_cycles();

    // Save Stats
    saveStats("stats.json", "value object naive", $stats);
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
