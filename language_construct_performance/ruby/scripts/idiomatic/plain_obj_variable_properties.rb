require_relative '../benchmark_utils'

# --- FACTORIES ---

def create_plain_object(index)
  obj = {
    label: "user-dev-test-#{index}",
    id: "u.#{16406 + index}",
    access_to: ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    details: {
      provider: "aws",
      account_id: "568709751681",
      principal: true,
      tags: ["aKIAYI2NaRQPOT", "dev testing local"],
      mfas: "",
      la: 1772454942 + (index % 1000),
      s: 1,
      cpd: 0,
      pcb: "-",
      lld: 0,
      cd: 1763097939000,
      cb: "-",
      ub: "-",
      ud: 0,
      ua: 1772526871591
    }
  }

  if index % 2 == 0
    obj[:edge_to] = ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"]
  end

  if index % 3 == 0
    obj[:details][:ut] = 2
  end

  if index % 4 == 0
    obj[:details][:ag] = {
      s: { t: 167 },
      a: { t: 3187978, s: { t: 3187978, s: 3149311, r: 42506 } }
    }
  end

  obj
end

# --- BENCHMARK RUNNER ---

stats = {}

puts "Starting Plain Idiomatic Variable Properties Benchmark with #{NUM_ENTRIES.to_s.gsub(/(\d)(?=(\d{3})+$)/, '\\1,')} entries..."

plain_array = Array.new(NUM_ENTRIES)

puts "\n--- CREATION ---"
benchmark_stats("Plain Idiomatic Creation", stats, "creationTimeMs", track_memory: true) do
  NUM_ENTRIES.times do |i|
    plain_array[i] = create_plain_object(i)
  end
end

puts "\n--- PLAIN TRAVERSAL ---"
benchmark_stats("Plain Traversal (Plain Idiomatic)", stats, "plainTraversalTimeMs") do
  dummy_count = 0
  NUM_ENTRIES.times do |i|
    dummy_count += 1 if plain_array[i]
  end
  dummy_count
end

puts "\n--- PROPERTY ACCESS ---"
benchmark_stats("Property Access (Plain Idiomatic)", stats, "propAccessTimeMs") do
  sum = 0
  NUM_ENTRIES.times do |i|
    ag = plain_array[i][:details][:ag]
    sum += (ag ? ag[:a][:s][:r] : 0)
  end
  sum
end

puts "\n--- FILTERING ---"
benchmark_stats("Filtering (Plain Idiomatic)", stats, "filterTimeMs") do
  matched = 0
  NUM_ENTRIES.times do |i|
    matched += 1 if plain_array[i][:details][:la] > 1772455500
  end
  matched
end

puts "\n--- MUTATION ---"
benchmark_stats("Mutation (Plain Idiomatic)", stats, "mutationTimeMs") do
  NUM_ENTRIES.times do |i|
    plain_array[i][:details][:la] += 1
  end
end

puts "\n--- DELETE PROPERTY ---"
benchmark_stats("Delete Property (Plain Idiomatic)", stats, "deletePropertyTimeMs") do
  NUM_ENTRIES.times do |i|
    plain_array[i][:details].delete(:ud)
  end
end

# Clear memory
plain_array.clear
plain_array = nil
GC.start

# Save Stats
save_stats("stats_variable.json", "plain object idiomatic", stats)
