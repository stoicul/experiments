require 'json'
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
                :la, :ut, :s, :cpd, :pcb, :lld, :cd, :cb, :ub, :ud, :ua, :ag

  def initialize(provider, account_id, principal, tags, mfas, la, ut, s, cpd, pcb,
                 lld, cd, cb, ub, ud, ua, ag)
    @provider = provider
    @account_id = account_id
    @principal = principal
    @tags = tags
    @mfas = mfas
    @la = la
    @ut = ut
    @s = s
    @cpd = cpd
    @pcb = pcb
    @lld = lld
    @cd = cd
    @cb = cb
    @ub = ub
    @ud = ud
    @ua = ua
    @ag = ag
  end
end

class ValueObjectNode
  attr_accessor :label, :id, :edge_to, :access_to, :details

  def initialize(label, id, edge_to, access_to, details)
    @label = label
    @id = id
    @edge_to = edge_to
    @access_to = access_to
    @details = details
  end
end

# --- FACTORIES ---

def create_value_object(index)
  ValueObjectNode.new(
    "user-dev-test-#{index}",
    "u.#{16406 + index}",
    ["r.392", "r.40", "r.41", "update", "administrator", "create", "delete", "read"],
    ["s.[s3].UACDR", "a.[s3].DARC", "s.[secretsmanager].RACDU", "s.[dynamodb].RCDAU"],
    DetailsType.new(
      "aws", "568709751681", true, ["aKIAYI2NaRQPOT", "dev testing local"], "",
      1772454942 + (index % 1000), 2, 1, 0, "-", 0, 1763097939000, "-", "-", 0, 1772526871591,
      AgType.new(
        AgSType.new(167),
        AgAType.new(
          3187978,
          AgASubSType.new(3187978, 3149311, 42506)
        )
      )
    )
  )
end



# Add to_json to the classes so they can be encoded
class AgSType; def to_json(*a); {t: @t}.to_json(*a); end; end
class AgASubSType; def to_json(*a); {t: @t, s: @s, r: @r}.to_json(*a); end; end
class AgAType; def to_json(*a); {t: @t, s: @s}.to_json(*a); end; end
class AgType; def to_json(*a); {s: @s, a: @a}.to_json(*a); end; end
class DetailsType; def to_json(*a); {provider: @provider, accountId: @account_id, principal: @principal, tags: @tags, mfas: @mfas, la: @la, ut: @ut, s: @s, cpd: @cpd, pcb: @pcb, lld: @lld, cd: @cd, cb: @cb, ub: @ub, ud: @ud, ua: @ua, ag: @ag}.to_json(*a); end; end
class ValueObjectNode; def to_json(*a); {label: @label, id: @id, edgeTo: @edge_to, accessTo: @access_to, details: @details}.to_json(*a); end; end

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
      column_array[r] = create_value_object(c * rows + r)
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
File.write("data/stats_json_value_idiomatic.json", JSON.pretty_generate(json_stats))
puts "\nSaved json stats to data/stats_json_value_idiomatic.json"
