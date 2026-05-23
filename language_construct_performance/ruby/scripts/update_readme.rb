require 'json'
require 'fileutils'

def format_mb(mb)
  gb = (mb / 1024.0).round(1)
  "#{mb.to_s.gsub(/(\d)(?=(\d{3})+$)/, '\\1,')} MB (~#{gb} GB)"
end

def format_ms(ms)
  "#{ms.to_s.gsub(/(\d)(?=(\d{3})+$)/, '\\1,')} ms"
end

def run
  readme_path = File.join(Dir.pwd, "README.md")
  stats_path = File.join(Dir.pwd, "data", "stats.json")
  stats_var_path = File.join(Dir.pwd, "data", "stats_variable.json")

  unless File.exist?(readme_path)
    $stderr.puts "README.md not found!"
    exit(1)
  end

  stats = nil
  stats_var = nil

  if File.exist?(stats_path)
    begin
      stats = JSON.parse(File.read(stats_path))
    rescue JSON::ParserError => e
      $stderr.puts "Error parsing #{stats_path}: #{e.message}"
    end
  end

  if File.exist?(stats_var_path)
    begin
      stats_var = JSON.parse(File.read(stats_var_path))
    rescue JSON::ParserError => e
      $stderr.puts "Error parsing #{stats_var_path}: #{e.message}"
    end
  end

  if stats.nil? && stats_var.nil?
    $stderr.puts "No valid stats files found in data/ directory!"
    exit(1)
  end

  num_entries = (stats && stats['numEntries']) || (stats_var && stats_var['numEntries']) || 20_000_000
  formatted_entries = num_entries.to_s.gsub(/(\d)(?=(\d{3})+$)/, '\\1,')

  new_section = "<!-- BENCHMARK_RESULTS_START -->
## Benchmark Results (#{formatted_entries} Entries)

Here are the actual measured results from running the isolated benchmark suite under Ruby with **#{formatted_entries} entries**:"

  if stats
    new_section += "

### 1. Fixed Properties (Uniform Structural Shape)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | #{format_ms(stats['plain object']['creationTimeMs'])} | #{format_ms(stats['value object']['creationTimeMs'])} | #{format_ms(stats['value object minimal']['creationTimeMs'])} |
| **Memory Used (RSS)** | #{format_mb(stats['plain object']['memoryUsedMB'])} | #{format_mb(stats['value object']['memoryUsedMB'])} | #{format_mb(stats['value object minimal']['memoryUsedMB'])} |
| **Traversal Time** | #{format_ms(stats['plain object']['plainTraversalTimeMs'])} | #{format_ms(stats['value object']['plainTraversalTimeMs'])} | #{format_ms(stats['value object minimal']['plainTraversalTimeMs'])} |
| **Property Access Time** | #{format_ms(stats['plain object']['propAccessTimeMs'])} | #{format_ms(stats['value object']['propAccessTimeMs'])} | #{format_ms(stats['value object minimal']['propAccessTimeMs'])} |
| **Filtering Time** | #{format_ms(stats['plain object']['filterTimeMs'])} | #{format_ms(stats['value object']['filterTimeMs'])} | #{format_ms(stats['value object minimal']['filterTimeMs'])} |
| **Mutation Time** | #{format_ms(stats['plain object']['mutationTimeMs'])} | #{format_ms(stats['value object']['mutationTimeMs'])} | #{format_ms(stats['value object minimal']['mutationTimeMs'])} |
| **Delete Property Time** | #{format_ms(stats['plain object']['deletePropertyTimeMs'])} | #{format_ms(stats['value object']['deletePropertyTimeMs'])} | #{format_ms(stats['value object minimal']['deletePropertyTimeMs'])} |"
  end

  if stats_var
    new_section += "

### 2. Variable Properties (Polymorphic Shapes)

| Metric | Plain Object | Value Object | Value Object Minimal |
| :--- | :---: | :---: | :---: |
| **Creation Time** | #{format_ms(stats_var['plain object']['creationTimeMs'])} | #{format_ms(stats_var['value object']['creationTimeMs'])} | #{format_ms(stats_var['value object minimal']['creationTimeMs'])} |
| **Memory Used (RSS)** | #{format_mb(stats_var['plain object']['memoryUsedMB'])} | #{format_mb(stats_var['value object']['memoryUsedMB'])} | #{format_mb(stats_var['value object minimal']['memoryUsedMB'])} |
| **Traversal Time** | #{format_ms(stats_var['plain object']['plainTraversalTimeMs'])} | #{format_ms(stats_var['value object']['plainTraversalTimeMs'])} | #{format_ms(stats_var['value object minimal']['plainTraversalTimeMs'])} |
| **Property Access Time** | #{format_ms(stats_var['plain object']['propAccessTimeMs'])} | #{format_ms(stats_var['value object']['propAccessTimeMs'])} | #{format_ms(stats_var['value object minimal']['propAccessTimeMs'])} |
| **Filtering Time** | #{format_ms(stats_var['plain object']['filterTimeMs'])} | #{format_ms(stats_var['value object']['filterTimeMs'])} | #{format_ms(stats_var['value object minimal']['filterTimeMs'])} |
| **Mutation Time** | #{format_ms(stats_var['plain object']['mutationTimeMs'])} | #{format_ms(stats_var['value object']['mutationTimeMs'])} | #{format_ms(stats_var['value object minimal']['mutationTimeMs'])} |
| **Delete Property Time** | #{format_ms(stats_var['plain object']['deletePropertyTimeMs'])} | #{format_ms(stats_var['value object']['deletePropertyTimeMs'])} | #{format_ms(stats_var['value object minimal']['deletePropertyTimeMs'])} |"
  end

  new_section += "\n<!-- BENCHMARK_RESULTS_END -->"

  readme_content = File.read(readme_path)

  start_marker = "<!-- BENCHMARK_RESULTS_START -->"
  end_marker = "<!-- BENCHMARK_RESULTS_END -->"

  if readme_content.include?(start_marker) && readme_content.include?(end_marker)
    start_index = readme_content.index(start_marker)
    end_index = readme_content.index(end_marker) + end_marker.length
    readme_content = readme_content[0...start_index] + new_section + readme_content[end_index..]
  else
    regex = /## Benchmark Results \([\d,]+ Entries\)[\s\S]*?(?=## Key Findings)/
    if readme_content.match?(regex)
      readme_content = readme_content.sub(regex, new_section + "\n\n")
    else
      $stderr.puts "Could not find ## Benchmark Results section. Appending to end of file."
      readme_content += "\n\n" + new_section
    end
  end

  File.write(readme_path, readme_content)
  puts "Successfully updated README.md from stats!"
end

run
