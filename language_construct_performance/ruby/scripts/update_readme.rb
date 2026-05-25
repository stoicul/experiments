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

  
  stats_json_path = File.join(base_dir, 'data', 'stats_json.json')
  if File.exist?(stats_json_path)
    begin
      data_json = JSON.parse(File.read(stats_json_path))
      r = data_json['rows'] || 0
      c = data_json['columns'] || 0
      n = data_json['naive'] || {}
      i = data_json['idiomatic'] || {}
      new_section += "\n\n### 3. JSON Encoding/Decoding (#{c} cols x #{r.to_s.reverse.gsub(/...(?=.)/,'\&,').reverse} rows)\n\n"
      new_section += "| Metric | Naive | Idiomatic |\n"
      new_section += "| :--- | :---: | :---: |\n"
      new_section += "| **Creation Time** | #{format_ms(n['creationTimeMs'] || 0)} | #{format_ms(i['creationTimeMs'] || 0)} |\n"
      new_section += "| **Memory Used (Heap)** | #{format_mb(n['memoryUsedMB'] || 0)} | #{format_mb(i['memoryUsedMB'] || 0)} |\n"
      new_section += "| **JSON Encoding Time** | #{format_ms(n['jsonEncodeTimeMs'] || 0)} | #{format_ms(i['jsonEncodeTimeMs'] || 0)} |\n"
      new_section += "| **JSON Decoding Time** | #{format_ms(n['jsonDecodeTimeMs'] || 0)} | #{format_ms(i['jsonDecodeTimeMs'] || 0)} |\n"
      new_section += "| **JSON File Write Time** | #{format_ms(n['jsonFileWriteTimeMs'] || 0)} | #{format_ms(i['jsonFileWriteTimeMs'] || 0)} |\n"
      new_section += "| **JSON File Read Time** | #{format_ms(n['jsonFileReadTimeMs'] || 0)} | #{format_ms(i['jsonFileReadTimeMs'] || 0)} |\n"
      new_section += "| **JSON File Decode Time** | #{format_ms(n['jsonFileDecodeTimeMs'] || 0)} | #{format_ms(i['jsonFileDecodeTimeMs'] || 0)} |\n"
    rescue
    end
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
