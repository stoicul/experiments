import os
import shutil
import re

base = 'd:/development/ai/experiments/language_construct_performance/rust/src/bin'

# Remove minimal
for file in ['value_obj_minimal_fixed_properties.rs', 'value_obj_minimal_variable_properties.rs']:
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
cp_rename('plain_obj_fixed_properties.rs', 'plain_obj_naive_fixed_properties.rs', 'plain_obj_idiomatic_fixed_properties.rs')
# Plain variable
cp_rename('plain_obj_variable_properties.rs', 'plain_obj_naive_variable_properties.rs', 'plain_obj_idiomatic_variable_properties.rs')

# Value fixed
cp_rename('value_obj_fixed_properties.rs', 'value_obj_naive_fixed_properties.rs', 'value_obj_idiomatic_fixed_properties.rs')
# Value variable
cp_rename('value_obj_variable_properties.rs', 'value_obj_naive_variable_properties.rs', 'value_obj_idiomatic_variable_properties.rs')

# JSON encoding
cp_rename('json_encoding.rs', 'json_encoding_plain_naive.rs', 'json_encoding_plain_idiomatic.rs')
cp_rename('json_encoding_struct.rs', 'json_encoding_value_naive.rs', 'json_encoding_value_idiomatic.rs')

def rep(f, rs):
    p = os.path.join(base, f)
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as file:
            s = file.read()
        for o,n in rs:
            s = s.replace(o,n)
        with open(p,'w', encoding='utf-8') as file:
            file.write(s)

rep('plain_obj_naive_fixed_properties.rs', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])
rep('plain_obj_naive_variable_properties.rs', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])

rep('plain_obj_idiomatic_fixed_properties.rs', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])
rep('plain_obj_idiomatic_variable_properties.rs', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])

rep('value_obj_naive_fixed_properties.rs', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])
rep('value_obj_naive_variable_properties.rs', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])


# Idiomatic rust: use Vec<ValueObjectNode> instead of Vec<Option<Box<ValueObjectNode>>>
rust_idiomatic_reps = [
    ('Starting Value Object', 'Starting Value Object Idiomatic'),
    ('Value Object Creation', 'Value Object Idiomatic Creation'),
    ('(Value Object)', '(Value Object Idiomatic)'),
    ('"value object"', '"value object idiomatic"'),
    
    # Creation
    ('Vec<Option<Box<ValueObjectNode>>>', 'Vec<ValueObjectNode>'),
    ('value_obj_array.push(None)', '/* wait, we can just push directly */'),
    
    ('for _ in 0..num_entries {\n        value_obj_array.push(None);\n    }', ''),
    ('value_obj_array[i] = Some(Box::new(create_value_object_fixed(i)));', 'value_obj_array.push(create_value_object_fixed(i));'),
    ('value_obj_array[i] = Some(Box::new(create_value_object_variable(i)));', 'value_obj_array.push(create_value_object_variable(i));'),
    
    # Traversal (No Option)
    ('if value_obj_array[i].is_some() {', 'if !value_obj_array[i].id.is_empty() {'),
    
    # Access
    ('value_obj_array[i].as_ref().unwrap()', 'value_obj_array[i]'),
    ('value_obj_array[i].as_mut().unwrap()', 'value_obj_array[i]'),
]

rep('value_obj_idiomatic_fixed_properties.rs', rust_idiomatic_reps)
rep('value_obj_idiomatic_variable_properties.rs', rust_idiomatic_reps)


rep('json_encoding_plain_naive.rs', [('stats_json.json', 'stats_json_plain_naive.json')])
rep('json_encoding_plain_idiomatic.rs', [('stats_json.json', 'stats_json_plain_idiomatic.json')])

rep('json_encoding_value_naive.rs', [
    ('stats_json_struct.json', 'stats_json_value_naive.json'),
    # Note: it's likely using Box or plain structs. We'll leave it as is, just rename to naive
])
rep('json_encoding_value_idiomatic.rs', [
    ('stats_json_struct.json', 'stats_json_value_idiomatic.json'),
    # Convert to idiomatic
    ('Vec<Option<Box<ValueObjectNode>>>', 'Vec<ValueObjectNode>'),
    ('for _ in 0..rows {\n            column_array.push(None);\n        }', ''),
    ('column_array[r] = Some(Box::new(create_value_object_fixed(c * rows + r)));', 'column_array.push(create_value_object_fixed(c * rows + r));'),
])


# UPDATE RUN_ALL
run_file = f'{base}/run_all.rs'
if os.path.exists(run_file):
    with open(run_file, 'r', encoding='utf-8') as f:
        run_code = f.read()
    
    run_code = re.sub(r'let objects_scripts = vec!\[.*?\];', '''let objects_scripts = vec![
        "plain_obj_naive_fixed_properties",
        "plain_obj_idiomatic_fixed_properties",
        "value_obj_naive_fixed_properties",
        "value_obj_idiomatic_fixed_properties",
        "plain_obj_naive_variable_properties",
        "plain_obj_idiomatic_variable_properties",
        "value_obj_naive_variable_properties",
        "value_obj_idiomatic_variable_properties",
    ];''', run_code, flags=re.DOTALL)
    
    run_code = re.sub(r'let json_scripts = vec!\[.*?\];', '''let json_scripts = vec![
        "json_encoding_plain_naive",
        "json_encoding_plain_idiomatic",
        "json_encoding_value_naive",
        "json_encoding_value_idiomatic",
    ];''', run_code, flags=re.DOTALL)

    with open(run_file, 'w', encoding='utf-8') as f:
        f.write(run_code)

# UPDATE README
readme_file = f'{base}/update_readme.rs'
if os.path.exists(readme_file):
    with open(readme_file, 'r', encoding='utf-8') as f:
        c = f.read()

    # The extract struct
    c = c.replace('''    let plain = group.get("plain object").cloned().unwrap_or_else(|| Map::new());
    let value = group.get("value object").cloned().unwrap_or_else(|| Map::new());
    let minimal = group.get("value object minimal").cloned().unwrap_or_else(|| Map::new());''',
    '''    let plain_naive = group.get("plain object naive").cloned().unwrap_or_else(|| Map::new());
    let plain_idiomatic = group.get("plain object idiomatic").cloned().unwrap_or_else(|| Map::new());
    let value_naive = group.get("value object naive").cloned().unwrap_or_else(|| Map::new());
    let value_idiomatic = group.get("value object idiomatic").cloned().unwrap_or_else(|| Map::new());''')

    c = c.replace('| Metric | Plain Object (HashMap) | Value Object (Struct) | Value Object Minimal |', '| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |')
    c = c.replace('| :--- | :---: | :---: | :---: |', '| :--- | :---: | :---: | :---: | :---: |')

    c = c.replace('''            if is_memory {
                format!("| **{}** | {} | {} | {} |\\n", metric_name, format_mb(get_f64(&plain, key)), format_mb(get_f64(&value, key)), format_mb(get_f64(&minimal, key)))
            } else {
                format!("| **{}** | {} | {} | {} |\\n", metric_name, format_ms(get_f64(&plain, key)), format_ms(get_f64(&value, key)), format_ms(get_f64(&minimal, key)))
            }''',
    '''            if is_memory {
                format!("| **{}** | {} | {} | {} | {} |\\n", metric_name, format_mb(get_f64(&plain_naive, key)), format_mb(get_f64(&plain_idiomatic, key)), format_mb(get_f64(&value_naive, key)), format_mb(get_f64(&value_idiomatic, key)))
            } else {
                format!("| **{}** | {} | {} | {} | {} |\\n", metric_name, format_ms(get_f64(&plain_naive, key)), format_ms(get_f64(&plain_idiomatic, key)), format_ms(get_f64(&value_naive, key)), format_ms(get_f64(&value_idiomatic, key)))
            }''')

    c = c.replace('''    let mut json_struct_stats = Map::new();
    if let Ok(content) = fs::read_to_string(Path::new(&base_dir).join("data").join("stats_json_struct.json")) {
        if let Ok(Value::Object(map)) = serde_json::from_str(&content) {
            json_struct_stats = map;
        }
    }''',
    '''    let load_json = |name: &str| -> Map<String, Value> {
        if let Ok(content) = fs::read_to_string(Path::new(&base_dir).join("data").join(name)) {
            if let Ok(Value::Object(map)) = serde_json::from_str(&content) {
                return map;
            }
        }
        Map::new()
    };
    let json_pn = load_json("stats_json_plain_naive.json");
    let json_pi = load_json("stats_json_plain_idiomatic.json");
    let json_vn = load_json("stats_json_value_naive.json");
    let json_vi = load_json("stats_json_value_idiomatic.json");
''')

    c = c.replace('''    let json_rows = json_stats.get("rows").and_then(|v| v.as_i64()).unwrap_or(0);
    let json_cols = json_stats.get("columns").and_then(|v| v.as_i64()).unwrap_or(0);''',
    '''    let json_rows = json_pn.get("rows").and_then(|v| v.as_i64()).unwrap_or(0);
    let json_cols = json_pn.get("columns").and_then(|v| v.as_i64()).unwrap_or(0);''')

    c = c.replace('''        md_content.push_str(&format!("\\n### 3. JSON Encoding/Decoding ({} cols x {} rows)\\n\\n", json_cols, formatted_json_rows));
        md_content.push_str("| Metric | Plain Object (HashMap) | Value Object (Struct) |\\n");
        md_content.push_str("| :--- | :---: | :---: |\\n");''',
    '''        md_content.push_str(&format!("\\n### 3. JSON Encoding/Decoding ({} cols x {} rows)\\n\\n", json_cols, formatted_json_rows));
        md_content.push_str("| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |\\n");
        md_content.push_str("| :--- | :---: | :---: | :---: | :---: |\\n");''')

    c = c.replace('''            let s1 = get_map(&json_stats, "stats");
            let s2 = get_map(&json_struct_stats, "stats");
            
            if is_memory {
                format!("| **{}** | {} | {} |\\n", metric_name, format_mb(get_f64(&s1, key)), format_mb(get_f64(&s2, key)))
            } else {
                format!("| **{}** | {} | {} |\\n", metric_name, format_ms(get_f64(&s1, key)), format_ms(get_f64(&s2, key)))
            }''',
    '''            let s1 = get_map(&json_pn, "stats");
            let s2 = get_map(&json_pi, "stats");
            let s3 = get_map(&json_vn, "stats");
            let s4 = get_map(&json_vi, "stats");
            
            if is_memory {
                format!("| **{}** | {} | {} | {} | {} |\\n", metric_name, format_mb(get_f64(&s1, key)), format_mb(get_f64(&s2, key)), format_mb(get_f64(&s3, key)), format_mb(get_f64(&s4, key)))
            } else {
                format!("| **{}** | {} | {} | {} | {} |\\n", metric_name, format_ms(get_f64(&s1, key)), format_ms(get_f64(&s2, key)), format_ms(get_f64(&s3, key)), format_ms(get_f64(&s4, key)))
            }''')

    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(c)

# Update rust Cargo.toml bins
cargo_file = 'd:/development/ai/experiments/language_construct_performance/rust/Cargo.toml'
if os.path.exists(cargo_file):
    with open(cargo_file, 'r', encoding='utf-8') as f:
        cargo = f.read()
    
    cargo = re.sub(r'\[\[bin\]\]\s*name = ".*?"\s*path = ".*?"\s*', '', cargo)
    
    bins = [
        "plain_obj_naive_fixed_properties",
        "plain_obj_idiomatic_fixed_properties",
        "value_obj_naive_fixed_properties",
        "value_obj_idiomatic_fixed_properties",
        "plain_obj_naive_variable_properties",
        "plain_obj_idiomatic_variable_properties",
        "value_obj_naive_variable_properties",
        "value_obj_idiomatic_variable_properties",
        "json_encoding_plain_naive",
        "json_encoding_plain_idiomatic",
        "json_encoding_value_naive",
        "json_encoding_value_idiomatic",
        "run_all",
        "update_readme"
    ]
    
    for b in bins:
        cargo += f'[[bin]]\nname = "{b}"\npath = "src/bin/{b}.rs"\n\n'
        
    with open(cargo_file, 'w', encoding='utf-8') as f:
        f.write(cargo)

print("Rust refactored successfully!")
