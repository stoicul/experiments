require_relative 'benchmark_utils'

# --- VALUE OBJECT CLASSES ---

class AgSType
  attr_accessor :t

  def initialize(t)
    @t = t
  end
end

class AgASubSType
  attr_accessor :t, :s, :r

  def initialize(t, s, r)
    @t = t
    @s = s
    @r = r
  end
end

class AgAType
  attr_accessor :t, :s

  def initialize(t, s)
    @t = t
    @s = s
  end
end

class AgType
  attr_accessor :s, :a

  def initialize(s, a)
    @s = s
    @a = a
  end
end

class DetailsType
  attr_accessor :provider, :account_id, :principal, :tags, :mfas,
                :la, :s, :cpd, :pcb, :lld, :cd, :cb, :ub, :ud, :ua,
                :ut, :ag

  def initialize(provider, account_id, principal, tags, mfas, la, s, cpd, pcb,
                 lld, cd, cb, ub, ud, ua, ut: nil, ag: nil)
    @provider = provider
    @account_id = account_id
    @principal = principal
    @tags = tags
    @mfas = mfas
    @la = la
    @s = s
    @cpd = cpd
    @pcb = pcb
    @lld = lld
    @cd = cd
    @cb = cb
    @ub = ub
    @ud = ud
    @ua = ua
    # Conditionally set to force different object shapes (polymorphism)
    @ut = ut if ut
    @ag = ag if ag
  end
end

class ValueObjectNode
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
  ag = index % 4 == 0 ? AgType.new(
    AgSType.new(167),
    AgAType.new(
      3187978,
      AgASubSType.new(3187978, 3149311, 42506)
    )
  ) : nil

  ValueObjectNode.new(
    "user-dev-test-#{index}",
    "u.#{16406 + index}",
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    DetailsType.new(
      "aws", "568709751681", true, ["aKIAYI2NaRQPOT", "dev testing local"], "",
      1772454942 + (index % 1000), 1, 0, "-", 0, 1763097939000, "-", "-", 0, 1772526871591,
      ut: ut, ag: ag
    ),
    edge_to: edge_to
  )
end

# --- BENCHMARK RUNNER ---

stats = {}

puts "Starting Value Object Idiomatic Variable Properties Benchmark with #{NUM_ENTRIES.to_s.gsub(/(\d)(?=(\d{3})+$)/, '\\1,')} entries..."

value_obj_array = Array.new(NUM_ENTRIES)

puts "\n--- CREATION ---"
benchmark_stats("Value Object Idiomatic Creation", stats, "creationTimeMs", track_memory: true) do
  NUM_ENTRIES.times do |i|
    value_obj_array[i] = create_value_object(i)
  end
end

puts "\n--- PLAIN TRAVERSAL ---"
benchmark_stats("Plain Traversal (Value Object Idiomatic)", stats, "plainTraversalTimeMs") do
  dummy_count = 0
  NUM_ENTRIES.times do |i|
    dummy_count += 1 if value_obj_array[i]
  end
  dummy_count
end

puts "\n--- PROPERTY ACCESS ---"
benchmark_stats("Property Access (Value Object Idiomatic)", stats, "propAccessTimeMs") do
  sum = 0
  NUM_ENTRIES.times do |i|
    ag = value_obj_array[i].details.ag
    sum += (ag ? ag.a.s.r : 0)
  end
  sum
end

puts "\n--- FILTERING ---"
benchmark_stats("Filtering (Value Object Idiomatic)", stats, "filterTimeMs") do
  matched = 0
  NUM_ENTRIES.times do |i|
    matched += 1 if value_obj_array[i].details.la > 1772455500
  end
  matched
end

puts "\n--- MUTATION ---"
benchmark_stats("Mutation (Value Object Idiomatic)", stats, "mutationTimeMs") do
  NUM_ENTRIES.times do |i|
    value_obj_array[i].details.la += 1
  end
end

puts "\n--- DELETE PROPERTY ---"
benchmark_stats("Delete Property (Value Object Idiomatic)", stats, "deletePropertyTimeMs") do
  NUM_ENTRIES.times do |i|
    value_obj_array[i].details.remove_instance_variable(:@ud) if value_obj_array[i].details.instance_variable_defined?(:@ud)
  end
end

# Clear memory
value_obj_array.clear
value_obj_array = nil
GC.start

# Save Stats
save_stats("stats_variable.json", "value object idiomatic", stats)
