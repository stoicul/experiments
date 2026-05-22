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
    public int $s;
    public int $cpd;
    public string $pcb;
    public int $lld;
    public int $cd;
    public string $cb;
    public string $ub;
    public int $ud;
    public int $ua;

    public ?int $ut = null;
    public ?AgType $ag = null;

    public function __construct(
        string $provider,
        string $accountId,
        bool $principal,
        array $tags,
        string $mfas,
        int $la,
        int $s,
        int $cpd,
        string $pcb,
        int $lld,
        int $cd,
        string $cb,
        string $ub,
        int $ud,
        int $ua,
        ?int $ut = null,
        ?AgType $ag = null
    ) {
        $this->provider = $provider;
        $this->accountId = $accountId;
        $this->principal = $principal;
        $this->tags = $tags;
        $this->mfas = $mfas;
        $this->la = $la;
        $this->s = $s;
        $this->cpd = $cpd;
        $this->pcb = $pcb;
        $this->lld = $lld;
        $this->cd = $cd;
        $this->cb = $cb;
        $this->ub = $ub;
        $this->ud = $ud;
        $this->ua = $ua;

        if ($ut !== null) {
            $this->ut = $ut;
        }
        if ($ag !== null) {
            $this->ag = $ag;
        }
    }
}

class ValueObjectNode
{
    public string $label;
    public string $id;
    public array $accessTo;
    public DetailsType $details;

    public ?array $edgeTo = null;

    public function __construct(
        string $label,
        string $id,
        array $accessTo,
        DetailsType $details,
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

function createValueObject(int $index): ValueObjectNode
{
    $edgeTo = $index % 2 === 0 ? ['r.392', 'r.40', 'r.41', 'update', 'administrator', 'create', 'delete', 'read'] : null;
    $ut = $index % 3 === 0 ? 2 : null;
    $ag = $index % 4 === 0 ? new AgType(
        new AgSType(167),
        new AgAType(
            3187978,
            new AgASubSType(3187978, 3149311, 42506)
        )
    ) : null;

    return new ValueObjectNode(
        'user-dev-test-' . $index,
        'u.' . (16406 + $index),
        ['s.[s3].UACDR', 'a.[s3].DARC', 's.[secretsmanager].RACDU', 's.[dynamodb].RCDAU'],
        new DetailsType(
            'aws',
            '568709751681',
            true,
            ['aKIAYI2NaRQPOT', 'dev testing local'],
            '',
            1772454942 + ($index % 1000),
            1,
            0,
            '-',
            0,
            1763097939000,
            '-',
            '-',
            0,
            1772526871591,
            $ut,
            $ag
        ),
        $edgeTo
    );
}

// --- BENCHMARK RUNNER ---

$stats = [];

$runBenchmark = function () use (&$stats) {
    echo sprintf("Starting Value Object Variable Properties Benchmark with %s entries...\n", number_format(NUM_ENTRIES));

    $valueObjArray = [];

    echo "\n--- CREATION ---\n";
    benchmarkStats("Value Object Creation", $stats, "creationTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $valueObjArray[$i] = createValueObject($i);
        }
    }, true);

    echo "\n--- PLAIN TRAVERSAL ---\n";
    benchmarkStats("Plain Traversal (Value Object)", $stats, "plainTraversalTimeMs", function () use (&$valueObjArray) {
        $dummyCount = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($valueObjArray[$i] !== null) {
                continue;
            }
        }
        return $dummyCount;
    });

    echo "\n--- PROPERTY ACCESS ---\n";
    benchmarkStats("Property Access (Value Object)", $stats, "propAccessTimeMs", function () use (&$valueObjArray) {
        $sum = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $sum += $valueObjArray[$i]->details->ag?->a?->s?->r ?? 0;
        }
        return $sum;
    });

    echo "\n--- FILTERING ---\n";
    benchmarkStats("Filtering (Value Object)", $stats, "filterTimeMs", function () use (&$valueObjArray) {
        $matched = 0;
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            if ($valueObjArray[$i]->details->la > 1772455500) {
                $matched++;
            }
        }
        return $matched;
    });

    echo "\n--- MUTATION ---\n";
    benchmarkStats("Mutation (Value Object)", $stats, "mutationTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            $valueObjArray[$i]->details->la += 1;
        }
    });

    echo "\n--- DELETE PROPERTY ---\n";
    benchmarkStats("Delete Property (Value Object)", $stats, "deletePropertyTimeMs", function () use (&$valueObjArray) {
        for ($i = 0; $i < NUM_ENTRIES; $i++) {
            unset($valueObjArray[$i]->details->ud);
        }
    });

    // Clear memory
    $valueObjArray = [];
    gc_collect_cycles();

    // Save Stats
    saveStats("stats_variable.json", "value object", $stats);
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
