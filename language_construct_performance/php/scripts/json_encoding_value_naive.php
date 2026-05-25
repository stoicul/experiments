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
                $columnArray[] = createValueObjectFixed($c * $rows + $r);
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

    // Clear memory
    $twoDArray = [];
    $encodedJSON = "";
    gc_collect_cycles();

    // Save Stats
    if (!is_dir("data")) {
        mkdir("data");
    }
    $jsonStats = [
        "columns" => $columns,
        "rows" => $rows,
        "stats" => $stats
    ];
    file_put_contents("data/stats_json_value_naive.json", json_encode($jsonStats, JSON_PRETTY_PRINT));
    echo "\nSaved json stats to data/stats_json_value_naive.json\n";
};

try {
    $runBenchmark();
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
