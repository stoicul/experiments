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
        new_section += "| Metric | Plain Object (Dict) | Value Object (Dataclass) | Value Object Minimal |\n"
        new_section += "| :--- | :---: | :---: | :---: |\n"
        new_section += f"| **Creation Time** | {format_ms(get_stat(stats, 'plain object', 'creationTimeMs'))} | {format_ms(get_stat(stats, 'value object', 'creationTimeMs'))} | {format_ms(get_stat(stats, 'value object minimal', 'creationTimeMs'))} |\n"
        new_section += f"| **Memory Used (Heap)** | {format_mb(get_stat(stats, 'plain object', 'memoryUsedMB'))} | {format_mb(get_stat(stats, 'value object', 'memoryUsedMB'))} | {format_mb(get_stat(stats, 'value object minimal', 'memoryUsedMB'))} |\n"
        new_section += f"| **Traversal Time** | {format_ms(get_stat(stats, 'plain object', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats, 'value object', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats, 'value object minimal', 'plainTraversalTimeMs'))} |\n"
        new_section += f"| **Property Access Time** | {format_ms(get_stat(stats, 'plain object', 'propAccessTimeMs'))} | {format_ms(get_stat(stats, 'value object', 'propAccessTimeMs'))} | {format_ms(get_stat(stats, 'value object minimal', 'propAccessTimeMs'))} |\n"
        new_section += f"| **Filtering Time** | {format_ms(get_stat(stats, 'plain object', 'filterTimeMs'))} | {format_ms(get_stat(stats, 'value object', 'filterTimeMs'))} | {format_ms(get_stat(stats, 'value object minimal', 'filterTimeMs'))} |\n"
        new_section += f"| **Mutation Time** | {format_ms(get_stat(stats, 'plain object', 'mutationTimeMs'))} | {format_ms(get_stat(stats, 'value object', 'mutationTimeMs'))} | {format_ms(get_stat(stats, 'value object minimal', 'mutationTimeMs'))} |\n"
        new_section += f"| **Delete Property Time** | {format_ms(get_stat(stats, 'plain object', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats, 'value object', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats, 'value object minimal', 'deletePropertyTimeMs'))} |\n"

    if stats_var:
        new_section += "\n### 2. Variable Properties (Polymorphic Shapes)\n\n"
        new_section += "| Metric | Plain Object (Dict) | Value Object (Dataclass) | Value Object Minimal |\n"
        new_section += "| :--- | :---: | :---: | :---: |\n"
        new_section += f"| **Creation Time** | {format_ms(get_stat(stats_var, 'plain object', 'creationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object', 'creationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object minimal', 'creationTimeMs'))} |\n"
        new_section += f"| **Memory Used (Heap)** | {format_mb(get_stat(stats_var, 'plain object', 'memoryUsedMB'))} | {format_mb(get_stat(stats_var, 'value object', 'memoryUsedMB'))} | {format_mb(get_stat(stats_var, 'value object minimal', 'memoryUsedMB'))} |\n"
        new_section += f"| **Traversal Time** | {format_ms(get_stat(stats_var, 'plain object', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats_var, 'value object', 'plainTraversalTimeMs'))} | {format_ms(get_stat(stats_var, 'value object minimal', 'plainTraversalTimeMs'))} |\n"
        new_section += f"| **Property Access Time** | {format_ms(get_stat(stats_var, 'plain object', 'propAccessTimeMs'))} | {format_ms(get_stat(stats_var, 'value object', 'propAccessTimeMs'))} | {format_ms(get_stat(stats_var, 'value object minimal', 'propAccessTimeMs'))} |\n"
        new_section += f"| **Filtering Time** | {format_ms(get_stat(stats_var, 'plain object', 'filterTimeMs'))} | {format_ms(get_stat(stats_var, 'value object', 'filterTimeMs'))} | {format_ms(get_stat(stats_var, 'value object minimal', 'filterTimeMs'))} |\n"
        new_section += f"| **Mutation Time** | {format_ms(get_stat(stats_var, 'plain object', 'mutationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object', 'mutationTimeMs'))} | {format_ms(get_stat(stats_var, 'value object minimal', 'mutationTimeMs'))} |\n"
        new_section += f"| **Delete Property Time** | {format_ms(get_stat(stats_var, 'plain object', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats_var, 'value object', 'deletePropertyTimeMs'))} | {format_ms(get_stat(stats_var, 'value object minimal', 'deletePropertyTimeMs'))} |\n"

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
