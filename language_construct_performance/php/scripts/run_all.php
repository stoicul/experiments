<?php

declare(strict_types=1);

$group = $argv[1] ?? 'all';
echo "Running PHP benchmarks (group: {$group}) sequentially in isolated processes...\n\n";

$objects_scripts = [
    'scripts/naive/plain_obj_fixed_properties.php',
    'scripts/idiomatic/plain_obj_fixed_properties.php',
    'scripts/naive/value_obj_fixed_properties.php',
    'scripts/idiomatic/value_obj_fixed_properties.php',
    'scripts/naive/plain_obj_variable_properties.php',
    'scripts/idiomatic/plain_obj_variable_properties.php',
    'scripts/naive/value_obj_variable_properties.php',
    'scripts/idiomatic/value_obj_variable_properties.php'
];

$json_scripts = [
    'scripts/naive/json_encoding.php',
    'scripts/idiomatic/json_encoding.php',
];

$scripts = [];
if ($group === 'objects') {
    $scripts = $objects_scripts;
} elseif ($group === 'json') {
    $scripts = $json_scripts;
} else {
    $scripts = array_merge($objects_scripts, $json_scripts);
}

// Inherit NUM_ENTRIES environment variable if set
$numEntriesEnv = getenv('NUM_ENTRIES');
$numEntries = $numEntriesEnv !== false ? (int)$numEntriesEnv : 1000000;

foreach ($scripts as $script) {
    echo "=========================================\n";
    echo "Running {$script}...\n";
    echo "=========================================\n";
    
    $cmd = 'php ' . escapeshellarg(__DIR__ . '/../' . $script);
    $exitCode = 0;
    
    // Run the command using passthru to stream standard output
    passthru($cmd, $exitCode);
    
    if ($exitCode !== 0) {
        echo "Error running {$script}\n";
        exit($exitCode);
    }
    echo "\n";
}

echo "All benchmarks completed!\n";
echo "=========================================\n";
echo "Updating README.md from stats...\n";
echo "=========================================\n";

$exitCode = 0;
passthru('php ' . escapeshellarg(__DIR__ . '/update_readme.php'), $exitCode);
if ($exitCode !== 0) {
    echo "Error updating README.md\n";
} else {
    echo "README.md successfully updated!\n";
}
