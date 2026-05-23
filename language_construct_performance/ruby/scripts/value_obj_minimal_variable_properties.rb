require_relative 'benchmark_utils'

# --- VALUE OBJECT CLASSES ---
# Minimal: only the top-level node is a class, details remain a plain Hash

class MinimalValueObjectNode
  attr_accessor :label, :id, :access_to, :details, :edge_to

  def initialize(label, id, access_to, details, edge_to: nil)
    @label = label
    @id = id
    @access_to = access_to
    @details = details
    @edge_to = edge_to if edge_to
  end
end

# --- FACTORIES ---

def create_value_object(index)
  edge_to = index % 2 == 0 ? ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"] : nil
  ut = index % 3 == 0 ? 2 : nil
  ag = index % 4 == 0 ? {
    s: { t: 167 },
    a: { t: 3187978, s: { t: 3187978, s: 3149311, r: 42506 } }
  } : nil

  details = {
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

  details[:ut] = ut if ut
  details[:ag] = ag if ag

  MinimalValueObjectNode.new(
    "user-dev-test-#{index}",
    "u.#{16406 + index}",
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    details,
    edge_to: edge_to
  )
end

# --- BENCHMARK RUNNER ---

stats = {}

puts "Starting Value Object Variable Properties Minimal Benchmark with #{NUM_ENTRIES.to_s.gsub(/(\d)(?=(\d{3})+$)/, '\\1,')} entries..."

value_obj_array = Array.new(NUM_ENTRIES)

puts "\n--- CREATION ---"
benchmark_stats("Value Object Minimal Creation", stats, "creationTimeMs", track_memory: true) do
  NUM_ENTRIES.times do |i|
    value_obj_array[i] = create_value_object(i)
  end
end

puts "\n--- PLAIN TRAVERSAL ---"
benchmark_stats("Plain Traversal (Value Object Minimal)", stats, "plainTraversalTimeMs") do
  dummy_count = 0
  NUM_ENTRIES.times do |i|
    dummy_count += 1 if value_obj_array[i]
  end
  dummy_count
end

puts "\n--- PROPERTY ACCESS ---"
benchmark_stats("Property Access (Value Object Minimal)", stats, "propAccessTimeMs") do
  sum = 0
  NUM_ENTRIES.times do |i|
    ag = value_obj_array[i].details[:ag]
    sum += (ag ? ag[:a][:s][:r] : 0)
  end
  sum
end

puts "\n--- FILTERING ---"
benchmark_stats("Filtering (Value Object Minimal)", stats, "filterTimeMs") do
  matched = 0
  NUM_ENTRIES.times do |i|
    matched += 1 if value_obj_array[i].details[:la] > 1772455500
  end
  matched
end

puts "\n--- MUTATION ---"
benchmark_stats("Mutation (Value Object Minimal)", stats, "mutationTimeMs") do
  NUM_ENTRIES.times do |i|
    value_obj_array[i].details[:la] += 1
  end
end

puts "\n--- DELETE PROPERTY ---"
benchmark_stats("Delete Property (Value Object Minimal)", stats, "deletePropertyTimeMs") do
  NUM_ENTRIES.times do |i|
    value_obj_array[i].details.delete(:ud)
  end
end

# Clear memory
value_obj_array.clear
value_obj_array = nil
GC.start

# Save Stats
save_stats("stats_variable.json", "value object minimal", stats)
