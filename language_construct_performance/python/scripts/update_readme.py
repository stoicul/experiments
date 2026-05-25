import os
import json
import re

def format_mb(mb: int) -> str:
    gb = mb / 1024
    return f"{mb:,} MB (~{gb:.1f} GB)"

def format_ms(ms: int) -> str:
    return f"{ms:,} ms"

def run():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    readme_path = os.path.join(base_dir, 'README.md')
    stats_path = os.path.join(base_dir, 'data', 'stats.json')
    stats_var_path = os.path.join(base_dir, 'data', 'stats_variable.json')

    stats = None
    stats_var = None

    if os.path.exists(stats_path):
        try:
            with open(stats_path, 'r', encoding='utf-8') as f:
                stats = json.load(f)
        except Exception as e:
            print(f"Error parsing {stats_path}: {e}")

    if os.path.exists(stats_var_path):
        try:
            with open(stats_var_path, 'r', encoding='utf-8') as f:
                stats_var = json.load(f)
        except Exception as e:
            print(f"Error parsing {stats_var_path}: {e}")

    if not stats and not stats_var:
        print("No valid stats files found in data/ directory!")
        import sys
        sys.exit(1)

    num_entries = 1000000
    if stats and 'numEntries' in stats:
        num_entries = stats['numEntries']
    elif stats_var and 'numEntries' in stats_var:
        num_entries = stats_var['numEntries']

    formatted_entries = f"{num_entries:,}"

    new_section = "<!-- BENCHMARK_RESULTS_START -->\n"
    new_section += f"## Benchmark Results ({formatted_entries} Entries)\n\n"
    new_section += f"Here are the actual measured results from running the isolated benchmark suite under Python with **{formatted_entries} entries**:\n"

    def get_stat(st, cat, key):
        if not st or cat not in st or key not in st[cat]:
            return 0
        return st[cat][key]

    if stats:
        new_section += "\n### 1. Fixed Properties (Uniform Structural Shape)\n\n"
        new_section += "| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |\n"
        new_section += "| :--- | :---: | :---: | :---: | :---: |\n"
        new_section += f"| **Creation Time** | {format_ms(get_stat(stats, 'plain object naive', 'creationTimeMs'))} | {format_ms(get_stat(stats, 'plain object idiomatic', 'creationTimeMs'))} | {format_ms(get_stat(stats, 'value object naive', 'creationTimeMs'))} | {format_ms(get_stat(stats, 'value object idiomatic', 'creationTimeMs'))} |\n"
        new_section += f"| **Memory Used (Heap)** | {format_mb(get_stat(stats, 'plain object naive', 'memoryUsedMB'))} | {format_mb(get_stat(stats, 'plain object idiomatic', 'memoryUsedMB'))} | {format_mb(get_stat(stats, 'value object naive', 'memoryUsedMB'))} | {format_mb(get_stat(stats, 'value object idiomatic', 'memoryUsedMB'))} |\n"
        new_section += f"| **Traversal Time** | {format_ms(get_stat(stats, 'plain object naive', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats, 'plain object idiomatic', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats, 'value object naive', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats, 'value object idiomatic', 'plainTraversalTimeMs'))} |\n"
        new_section += f"| **Property Access Time** | {format_ms(get_stat(stats, 'plain object naive', 'propAccessTimeMs'))} | {format_ms(get_stat(stats, 'plain object idiomatic', 'propAccessTimeMs'))} | {format_ms(get_stat(stats, 'value object naive', 'propAccessTimeMs'))} | {format_ms(get_stat(stats, 'value object idiomatic', 'propAccessTimeMs'))} |\n"
        new_section += f"| **Filtering Time** | {format_ms(get_stat(stats, 'plain object naive', 'filterTimeMs'))} | {format_ms(get_stat(stats, 'plain object idiomatic', 'filterTimeMs'))} | {format_ms(get_stat(stats, 'value object naive', 'filterTimeMs'))} | {format_ms(get_stat(stats, 'value object idiomatic', 'filterTimeMs'))} |\n"
        new_section += f"| **Mutation Time** | {format_ms(get_stat(stats, 'plain object naive', 'mutationTimeMs'))} | {format_ms(get_stat(stats, 'plain object idiomatic', 'mutationTimeMs'))} | {format_ms(get_stat(stats, 'value object naive', 'mutationTimeMs'))} | {format_ms(get_stat(stats, 'value object idiomatic', 'mutationTimeMs'))} |\n"
        new_section += f"| **Delete Property Time** | {format_ms(get_stat(stats, 'plain object naive', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats, 'plain object idiomatic', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats, 'value object naive', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats, 'value object idiomatic', 'deletePropertyTimeMs'))} |\n"

    if stats_var:
        new_section += "\n### 2. Variable Properties (Polymorphic Shapes)\n\n"
        new_section += "| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |\n"
        new_section += "| :--- | :---: | :---: | :---: | :---: |\n"
        new_section += f"| **Creation Time** | {format_ms(get_stat(stats_var, 'plain object naive', 'creationTimeMs'))} | {format_ms(get_stat(stats_var, 'plain object idiomatic', 'creationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object naive', 'creationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object idiomatic', 'creationTimeMs'))} |\n"
        new_section += f"| **Memory Used (Heap)** | {format_mb(get_stat(stats_var, 'plain object naive', 'memoryUsedMB'))} | {format_mb(get_stat(stats_var, 'plain object idiomatic', 'memoryUsedMB'))} | {format_mb(get_stat(stats_var, 'value object naive', 'memoryUsedMB'))} | {format_mb(get_stat(stats_var, 'value object idiomatic', 'memoryUsedMB'))} |\n"
        new_section += f"| **Traversal Time** | {format_ms(get_stat(stats_var, 'plain object naive', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats_var, 'plain object idiomatic', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats_var, 'value object naive', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats_var, 'value object idiomatic', 'plainTraversalTimeMs'))} |\n"
        new_section += f"| **Property Access Time** | {format_ms(get_stat(stats_var, 'plain object naive', 'propAccessTimeMs'))} | {format_ms(get_stat(stats_var, 'plain object idiomatic', 'propAccessTimeMs'))} | {format_ms(get_stat(stats_var, 'value object naive', 'propAccessTimeMs'))} | {format_ms(get_stat(stats_var, 'value object idiomatic', 'propAccessTimeMs'))} |\n"
        new_section += f"| **Filtering Time** | {format_ms(get_stat(stats_var, 'plain object naive', 'filterTimeMs'))} | {format_ms(get_stat(stats_var, 'plain object idiomatic', 'filterTimeMs'))} | {format_ms(get_stat(stats_var, 'value object naive', 'filterTimeMs'))} | {format_ms(get_stat(stats_var, 'value object idiomatic', 'filterTimeMs'))} |\n"
        new_section += f"| **Mutation Time** | {format_ms(get_stat(stats_var, 'plain object naive', 'mutationTimeMs'))} | {format_ms(get_stat(stats_var, 'plain object idiomatic', 'mutationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object naive', 'mutationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object idiomatic', 'mutationTimeMs'))} |\n"
        new_section += f"| **Delete Property Time** | {format_ms(get_stat(stats_var, 'plain object naive', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats_var, 'plain object idiomatic', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats_var, 'value object naive', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats_var, 'value object idiomatic', 'deletePropertyTimeMs'))} |\n"


    # Add JSON Decoding
    def load_json_stat(filename):
        path = os.path.join(base_dir, 'data', filename)
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    data_pn = load_json_stat('stats_json_plain_naive.json')
    data_pi = load_json_stat('stats_json_plain_idiomatic.json')
    data_vn = load_json_stat('stats_json_value_naive.json')
    data_vi = load_json_stat('stats_json_value_idiomatic.json')

    json_rows, json_cols = 0, 0
    if data_pn:
        json_rows = data_pn.get('rows', 0)
        json_cols = data_pn.get('columns', 0)

    if data_pn or data_pi or data_vn or data_vi:
        new_section += f"\n### 3. JSON Encoding/Decoding ({json_cols} cols x {json_rows:,} rows)\n\n"
        new_section += "| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |\n"
        new_section += "| :--- | :---: | :---: | :---: | :---: |\n"
        
        s_pn = data_pn.get('stats', {})
        s_pi = data_pi.get('stats', {})
        s_vn = data_vn.get('stats', {})
        s_vi = data_vi.get('stats', {})
        
        new_section += f"| **Creation Time** | {format_ms(s_pn.get('creationTimeMs', 0))} | {format_ms(s_pi.get('creationTimeMs', 0))} | {format_ms(s_vn.get('creationTimeMs', 0))} | {format_ms(s_vi.get('creationTimeMs', 0))} |\n"
        new_section += f"| **Memory Used (Heap)** | {format_mb(s_pn.get('memoryUsedMB', 0))} | {format_mb(s_pi.get('memoryUsedMB', 0))} | {format_mb(s_vn.get('memoryUsedMB', 0))} | {format_mb(s_vi.get('memoryUsedMB', 0))} |\n"
        new_section += f"| **JSON Encoding Time** | {format_ms(s_pn.get('jsonEncodeTimeMs', 0))} | {format_ms(s_pi.get('jsonEncodeTimeMs', 0))} | {format_ms(s_vn.get('jsonEncodeTimeMs', 0))} | {format_ms(s_vi.get('jsonEncodeTimeMs', 0))} |\n"
        new_section += f"| **JSON Decoding Time** | {format_ms(s_pn.get('jsonDecodeTimeMs', 0))} | {format_ms(s_pi.get('jsonDecodeTimeMs', 0))} | {format_ms(s_vn.get('jsonDecodeTimeMs', 0))} | {format_ms(s_vi.get('jsonDecodeTimeMs', 0))} |\n"

    new_section += "\n<!-- BENCHMARK_RESULTS_END -->"

    readme_content = ""
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            readme_content = f.read()
    else:
        # Create a new README.md with some basic structure if it doesn't exist
        readme_content = "# Python Language Construct Performance\n\n"

    start_marker = "<!-- BENCHMARK_RESULTS_START -->"
    end_marker = "<!-- BENCHMARK_RESULTS_END -->"

    if start_marker in readme_content and end_marker in readme_content:
        start_index = readme_content.find(start_marker)
        end_index = readme_content.find(end_marker) + len(end_marker)
        readme_content = readme_content[:start_index] + new_section + readme_content[end_index:]
    else:
        # Look for ## Benchmark Results
        regex = re.compile(r'## Benchmark Results \([\d,]+ Entries\)[\s\S]*?(?=## Key Findings)', re.MULTILINE)
        if regex.search(readme_content):
            readme_content = regex.sub(new_section + "\n\n", readme_content)
        else:
            key_findings_pos = readme_content.find("## Key Findings")
            if key_findings_pos != -1:
                readme_content = readme_content[:key_findings_pos] + new_section + "\n\n" + readme_content[key_findings_pos:]
            else:
                readme_content += "\n\n" + new_section

    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("Successfully updated README.md from stats!")

if __name__ == "__main__":
    run()
