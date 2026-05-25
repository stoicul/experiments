require 'json'
require_relative 'benchmark_utils'

def create_plain_object(index)
  {
    label: "user-dev-test-#{index}",
    id: "u.#{16406 + index}",
    edge_to: ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"],
    access_to: ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    details: {
      provider: "aws",
      account_id: "568709751681",
      principal: true,
      tags: ["aKIAYI2NaRQPOT", "dev testing local"],
      mfas: "",
      la: 1772454942 + (index % 1000),
      ut: 2,
      s: 1,
      cpd: 0,
      pcb: "-",
      lld: 0,
      cd: 1763097939000,
      cb: "-",
      ub: "-",
      ud: 0,
      ua: 1772526871591,
      ag: {
        s: { t: 167 },
        a: {
          t: 3187978,
          s: { t: 3187978, s: 3149311, r: 42506 }
        }
      }
    }
  }
end

stats = {}
columns = 3
rows = 50000

puts "Starting JSON Encoding/Decoding Benchmark with #{columns} columns x #{rows} rows...\n"

two_d_array = Array.new(columns)

puts "\n--- CREATION ---"
benchmark_stats("Creation", stats, "creationTimeMs", track_memory: true) do
  columns.times do |c|
    column_array = Array.new(rows)
    rows.times do |r|
      column_array[r] = create_plain_object(c * rows + r)
    end
    two_d_array[c] = column_array
  end
end

encoded_json = nil

puts "\n--- JSON ENCODING ---"
benchmark_stats("JSON Encoding", stats, "jsonEncodeTimeMs", track_memory: true) do
  encoded_json = JSON.generate(two_d_array)
end

puts "\n--- JSON DECODING ---"
benchmark_stats("JSON Decoding", stats, "jsonDecodeTimeMs", track_memory: true) do
  decoded = JSON.parse(encoded_json)
end


  puts "\n--- JSON FILE WRITE ---"
  benchmark_stats("JSON File Write", stats, "jsonFileWriteTimeMs", track_memory: true) do
    File.write("data/test_dump.json", encoded_json[0])
  end

  read_json = [nil]
  puts "\n--- JSON FILE READ ---"
  benchmark_stats("JSON File Read", stats, "jsonFileReadTimeMs", track_memory: true) do
    read_json[0] = File.read("data/test_dump.json")
  end

  puts "\n--- JSON FILE DECODE ---"
  benchmark_stats("JSON File Decode", stats, "jsonFileDecodeTimeMs", track_memory: true) do
    decoded = JSON.parse(read_json[0])
  end

    File.delete("data/test_dump.json") if File.exist?("data/test_dump.json")
  # Clear memory
two_d_array.clear
two_d_array = nil
encoded_json = nil
GC.start

# Save Stats
require 'fileutils'
FileUtils.mkdir_p("data")
json_stats = {
  columns: columns,
  rows: rows,
  stats: stats
}
File.write("data/stats_json.json", JSON.pretty_generate(json_stats))
puts "\nSaved json stats to data/stats_json.json"
