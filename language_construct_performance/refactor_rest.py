import os
import shutil
import re

def refactor_language(lang, ext):
    base = f'd:/development/ai/experiments/language_construct_performance/{lang}/scripts'
    
    # Remove minimal
    for file in [f'value_obj_minimal_fixed_properties{ext}', f'value_obj_minimal_variable_properties{ext}']:
        path = os.path.join(base, file)
        if os.path.exists(path):
            os.remove(path)

    def cp_rename(src, dst1, dst2):
        src_path = os.path.join(base, src)
        if os.path.exists(src_path):
            shutil.copy(src_path, os.path.join(base, dst1))
            shutil.copy(src_path, os.path.join(base, dst2))
            os.remove(src_path)

    # Plain fixed
    cp_rename(f'plain_obj_fixed_properties{ext}', f'plain_obj_naive_fixed_properties{ext}', f'plain_obj_idiomatic_fixed_properties{ext}')
    # Plain variable
    cp_rename(f'plain_obj_variable_properties{ext}', f'plain_obj_naive_variable_properties{ext}', f'plain_obj_idiomatic_variable_properties{ext}')
    # NodeJS typo fallback
    cp_rename(f'plane_obj_variable_properties{ext}', f'plain_obj_naive_variable_properties{ext}', f'plain_obj_idiomatic_variable_properties{ext}')

    # Value fixed
    cp_rename(f'value_obj_fixed_properties{ext}', f'value_obj_naive_fixed_properties{ext}', f'value_obj_idiomatic_fixed_properties{ext}')
    # Value variable
    cp_rename(f'value_obj_variable_properties{ext}', f'value_obj_naive_variable_properties{ext}', f'value_obj_idiomatic_variable_properties{ext}')

    # JSON encoding
    cp_rename(f'json_encoding{ext}', f'json_encoding_plain_naive{ext}', f'json_encoding_plain_idiomatic{ext}')

    def rep(f, rs):
        p = os.path.join(base, f)
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as file:
                s = file.read()
            for o,n in rs:
                s = s.replace(o,n)
            with open(p,'w', encoding='utf-8') as file:
                file.write(s)

    rep(f'plain_obj_naive_fixed_properties{ext}', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])
    rep(f'plain_obj_naive_variable_properties{ext}', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])

    rep(f'plain_obj_idiomatic_fixed_properties{ext}', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])
    rep(f'plain_obj_idiomatic_variable_properties{ext}', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])

    rep(f'value_obj_naive_fixed_properties{ext}', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])
    rep(f'value_obj_naive_variable_properties{ext}', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])

    rep(f'value_obj_idiomatic_fixed_properties{ext}', [('Starting Value Object', 'Starting Value Object Idiomatic'), ('Value Object Creation', 'Value Object Idiomatic Creation'), ('(Value Object)', '(Value Object Idiomatic)'), ('"value object"', '"value object idiomatic"')])
    rep(f'value_obj_idiomatic_variable_properties{ext}', [('Starting Value Object', 'Starting Value Object Idiomatic'), ('Value Object Creation', 'Value Object Idiomatic Creation'), ('(Value Object)', '(Value Object Idiomatic)'), ('"value object"', '"value object idiomatic"')])

    rep(f'json_encoding_plain_naive{ext}', [('stats_json.json', 'stats_json_plain_naive.json')])
    rep(f'json_encoding_plain_idiomatic{ext}', [('stats_json.json', 'stats_json_plain_idiomatic.json')])

    # GENERATE VALUE JSON
    with open(f'{base}/json_encoding_plain_naive{ext}', 'r', encoding='utf-8') as f:
        json_src = f.read()

    with open(f'{base}/value_obj_naive_fixed_properties{ext}', 'r', encoding='utf-8') as f:
        val_src = f.read()

    # JS/TS vs PHP logic
    if lang in ['nodejs', 'bun']:
        # extract classes
        match = re.search(r'(// --- VALUE OBJECT CLASSES ---.*?)// --- BENCHMARK RUNNER ---', val_src, re.DOTALL)
        if match:
            classes = match.group(1)
            # remove createPlainObject and replace with classes
            json_src = re.sub(r'function createPlainObject.*?return \{.*?\};\n\}', classes, json_src, flags=re.DOTALL)
            json_src = json_src.replace('createPlainObject(', 'createValueObjectFixed(')
            
            vn = json_src.replace('stats_json_plain_naive.json', 'stats_json_value_naive.json')
            vi = json_src.replace('stats_json_plain_naive.json', 'stats_json_value_idiomatic.json')
            
            with open(f'{base}/json_encoding_value_naive{ext}', 'w', encoding='utf-8') as f: f.write(vn)
            with open(f'{base}/json_encoding_value_idiomatic{ext}', 'w', encoding='utf-8') as f: f.write(vi)
    elif lang == 'php':
        match = re.search(r'(// --- VALUE OBJECT CLASSES ---.*?)// --- BENCHMARK RUNNER ---', val_src, re.DOTALL)
        if match:
            classes = match.group(1)
            json_src = re.sub(r'function createPlainObject.*?\n\}', classes, json_src, flags=re.DOTALL)
            json_src = json_src.replace('createPlainObject(', 'createValueObjectFixed(')
            vn = json_src.replace('stats_json_plain_naive.json', 'stats_json_value_naive.json')
            vi = json_src.replace('stats_json_plain_naive.json', 'stats_json_value_idiomatic.json')
            with open(f'{base}/json_encoding_value_naive{ext}', 'w', encoding='utf-8') as f: f.write(vn)
            with open(f'{base}/json_encoding_value_idiomatic{ext}', 'w', encoding='utf-8') as f: f.write(vi)

    # UPDATE RUN_ALL
    if lang == 'php':
        run_file = f'{base}/run_all.php'
    else:
        run_file = f'{base}/run_all{ext}'
        
    if os.path.exists(run_file):
        with open(run_file, 'r', encoding='utf-8') as f:
            run_code = f.read()
            
        old_obj = [
            f'"scripts/plain_obj_fixed_properties{ext}"',
            f'"scripts/value_obj_fixed_properties{ext}"',
            f'"scripts/value_obj_minimal_fixed_properties{ext}"',
            f'"scripts/plain_obj_variable_properties{ext}"',
            f'"scripts/value_obj_variable_properties{ext}"',
            f'"scripts/value_obj_minimal_variable_properties{ext}"'
        ]
        if lang == 'php':
            old_obj = [x.replace('"', "'") for x in old_obj]
        elif lang in ['nodejs', 'bun']:
            old_obj = [f"'scripts/plain_obj_fixed_properties{ext}'", f"'scripts/value_obj_fixed_properties{ext}'", f"'scripts/value_obj_minimal_fixed_properties{ext}'", f"'scripts/plain_obj_variable_properties{ext}'", f"'scripts/value_obj_variable_properties{ext}'", f"'scripts/value_obj_minimal_variable_properties{ext}'"]
            # Fix typo fallback
            run_code = run_code.replace(f"'scripts/plane_obj_variable_properties{ext}'", f"'scripts/plain_obj_variable_properties{ext}'")

        new_obj = [
            f"'scripts/plain_obj_naive_fixed_properties{ext}'",
            f"'scripts/plain_obj_idiomatic_fixed_properties{ext}'",
            f"'scripts/value_obj_naive_fixed_properties{ext}'",
            f"'scripts/value_obj_idiomatic_fixed_properties{ext}'",
            f"'scripts/plain_obj_naive_variable_properties{ext}'",
            f"'scripts/plain_obj_idiomatic_variable_properties{ext}'",
            f"'scripts/value_obj_naive_variable_properties{ext}'",
            f"'scripts/value_obj_idiomatic_variable_properties{ext}'"
        ]

        if lang == 'nodejs' or lang == 'bun':
            arr_str = "[\n    " + ",\n    ".join(new_obj) + "\n  ]"
            run_code = re.sub(r'const objectsScripts = \[.*?\];', f'const objectsScripts = {arr_str};', run_code, flags=re.DOTALL)
            
            json_arr = [
                f"'scripts/json_encoding_plain_naive{ext}'",
                f"'scripts/json_encoding_plain_idiomatic{ext}'",
                f"'scripts/json_encoding_value_naive{ext}'",
                f"'scripts/json_encoding_value_idiomatic{ext}'"
            ]
            arr_str2 = "[\n    " + ",\n    ".join(json_arr) + "\n  ]"
            run_code = re.sub(r'const jsonScripts = \[.*?\];', f'const jsonScripts = {arr_str2};', run_code, flags=re.DOTALL)
        elif lang == 'php':
            arr_str = "[\n    " + ",\n    ".join(new_obj) + "\n]"
            run_code = re.sub(r'\$objects_scripts = \[.*?\];', f'$objects_scripts = {arr_str};', run_code, flags=re.DOTALL)
            
            json_arr = [
                f"'scripts/json_encoding_plain_naive{ext}'",
                f"'scripts/json_encoding_plain_idiomatic{ext}'",
                f"'scripts/json_encoding_value_naive{ext}'",
                f"'scripts/json_encoding_value_idiomatic{ext}'"
            ]
            arr_str2 = "[\n    " + ",\n    ".join(json_arr) + "\n]"
            run_code = re.sub(r'\$json_scripts = \[.*?\];', f'$json_scripts = {arr_str2};', run_code, flags=re.DOTALL)

        with open(run_file, 'w', encoding='utf-8') as f:
            f.write(run_code)
            
    # UPDATE README (PHP, NODE, BUN)
    readme_file = f'{base}/update_readme{ext}'
    if os.path.exists(readme_file):
        with open(readme_file, 'r', encoding='utf-8') as f:
            c = f.read()
        
        # We will just write a very fast manual replacement based on the Python logic
        if lang in ['nodejs', 'bun']:
            c = c.replace('plain: group["plain object"] || {}', 'plain_naive: group["plain object naive"] || {}')
            c = c.replace('value: group["value object"] || {}', 'plain_idiomatic: group["plain object idiomatic"] || {}')
            c = c.replace('minimal: group["value object minimal"] || {}', 'value_naive: group["value object naive"] || {},\n      value_idiomatic: group["value object idiomatic"] || {}')
            
            c = c.replace('| Metric | Plain Object (Dict) | Value Object (Class) | Value Object Minimal |', '| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |')
            c = c.replace('| :--- | :---: | :---: | :---: |', '| :--- | :---: | :---: | :---: | :---: |')
            
            # formatRow logic update
            c = c.replace('const { plain, value, minimal } = metrics;', 'const { plain_naive, plain_idiomatic, value_naive, value_idiomatic } = metrics;')
            c = c.replace('return `| **${metricName}** | ${formatMB(plain[key])} | ${formatMB(value[key])} | ${formatMB(minimal[key])} |\\n`;', 'return `| **${metricName}** | ${formatMB(plain_naive[key])} | ${formatMB(plain_idiomatic[key])} | ${formatMB(value_naive[key])} | ${formatMB(value_idiomatic[key])} |\\n`;')
            c = c.replace('return `| **${metricName}** | ${formatMs(plain[key])} | ${formatMs(value[key])} | ${formatMs(minimal[key])} |\\n`;', 'return `| **${metricName}** | ${formatMs(plain_naive[key])} | ${formatMs(plain_idiomatic[key])} | ${formatMs(value_naive[key])} | ${formatMs(value_idiomatic[key])} |\\n`;')

        elif lang == 'php':
            c = c.replace("'plain' => $group['plain object'] ?? [],", "'plain_naive' => $group['plain object naive'] ?? [],")
            c = c.replace("'value' => $group['value object'] ?? [],", "'plain_idiomatic' => $group['plain object idiomatic'] ?? [],")
            c = c.replace("'minimal' => $group['value object minimal'] ?? []", "'value_naive' => $group['value object naive'] ?? [],\n      'value_idiomatic' => $group['value object idiomatic'] ?? []")
            
            c = c.replace('| Metric | Plain Object (Associative Array) | Value Object (Class) | Value Object Minimal |', '| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |')
            c = c.replace('| :--- | :---: | :---: | :---: |', '| :--- | :---: | :---: | :---: | :---: |')
            
            c = c.replace('$plain = $metrics[\'plain\'];', '$plain_naive = $metrics[\'plain_naive\'];\n      $plain_idiomatic = $metrics[\'plain_idiomatic\'];')
            c = c.replace('$value = $metrics[\'value\'];', '$value_naive = $metrics[\'value_naive\'];')
            c = c.replace('$minimal = $metrics[\'minimal\'];', '$value_idiomatic = $metrics[\'value_idiomatic\'];')
            
            c = c.replace('return "| **{$metricName}** | " . formatMB($plain[$key] ?? 0) . " | " . formatMB($value[$key] ?? 0) . " | " . formatMB($minimal[$key] ?? 0) . " |\\n";', 'return "| **{$metricName}** | " . formatMB($plain_naive[$key] ?? 0) . " | " . formatMB($plain_idiomatic[$key] ?? 0) . " | " . formatMB($value_naive[$key] ?? 0) . " | " . formatMB($value_idiomatic[$key] ?? 0) . " |\\n";')
            c = c.replace('return "| **{$metricName}** | " . formatMs($plain[$key] ?? 0) . " | " . formatMs($value[$key] ?? 0) . " | " . formatMs($minimal[$key] ?? 0) . " |\\n";', 'return "| **{$metricName}** | " . formatMs($plain_naive[$key] ?? 0) . " | " . formatMs($plain_idiomatic[$key] ?? 0) . " | " . formatMs($value_naive[$key] ?? 0) . " | " . formatMs($value_idiomatic[$key] ?? 0) . " |\\n";')

        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(c)

refactor_language('bun', '.ts')
refactor_language('nodejs', '.mjs')
refactor_language('php', '.php')

print("Refactored Bun, NodeJS, and PHP completely!")
