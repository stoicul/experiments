require 'json'
require 'fileutils'

NUM_ENTRIES = (ENV['NUM_ENTRIES'] || '20000000').to_i

def measure_memory
  GC.start(full_mark: true, immediate_sweep: true)

  rss_kb = 0
  if File.exist?('/proc/self/status')
    # Linux (Docker container)
    File.read('/proc/self/status').each_line do |line|
      if line.start_with?('VmRSS:')
        rss_kb = line.split[1].to_i
        break
      end
    end
  else
    # Windows fallback
    mem = `powershell -Command "(Get-Process -Id #{Process.pid}).WorkingSet64"`.strip.to_i
    rss_kb = mem / 1024
  end

  rss_mb = (rss_kb / 1024.0).round
  {
    rss: rss_mb,
    heap_used: rss_mb  # Ruby doesn't expose heap breakdown like JS; use RSS as proxy
  }
end

def benchmark_stats(name, stat_group, stat_key, track_memory: false)
  mem_before = track_memory ? measure_memory : nil
  t0 = Process.clock_gettime(Process::CLOCK_MONOTONIC, :millisecond)
  result = yield
  t1 = Process.clock_gettime(Process::CLOCK_MONOTONIC, :millisecond)
  mem_after = track_memory ? measure_memory : nil

  time_ms = t1 - t0
  stat_group[stat_key] = time_ms

  if track_memory
    memory_mb = mem_after[:rss] - mem_before[:rss]
    stat_group['memoryUsedMB'] = memory_mb
    puts "#{name} - Time: #{time_ms}ms, Memory Used (RSS): #{memory_mb} MB #{mem_after.to_json}"
  else
    puts "#{name}: #{time_ms}ms"
  end

  result
end

def save_stats(file_name, key, data)
  FileUtils.mkdir_p('data')
  stats_path = File.join('data', file_name)
  existing_stats = {
    'numEntries' => NUM_ENTRIES,
    'plain object' => {},
    'value object' => {},
    'value object minimal' => {}
  }

  if File.exist?(stats_path)
    begin
      existing_stats = JSON.parse(File.read(stats_path))
    rescue JSON::ParserError => e
      $stderr.puts "Error parsing existing stats in #{stats_path}: #{e.message}"
    end
  end

  existing_stats[key] = data
  existing_stats['numEntries'] = NUM_ENTRIES

  File.write(stats_path, JSON.pretty_generate(existing_stats))
  puts "\nSaved #{key} stats to data/#{file_name}"
end
