group = ARGV[0] || "all"
puts "Running benchmarks (group: #{group}) sequentially in isolated processes...\n\n"

  objects_scripts = [
    'scripts/plain_obj_naive_fixed_properties.rb',
    'scripts/plain_obj_idiomatic_fixed_properties.rb',
    'scripts/value_obj_naive_fixed_properties.rb',
    'scripts/value_obj_idiomatic_fixed_properties.rb',
    'scripts/plain_obj_naive_variable_properties.rb',
    'scripts/plain_obj_idiomatic_variable_properties.rb',
    'scripts/value_obj_naive_variable_properties.rb',
    'scripts/value_obj_idiomatic_variable_properties.rb'
  ]

  json_scripts = [
    'scripts/json_encoding_naive.rb',
    'scripts/json_encoding_idiomatic.rb',
  ]

if group == "objects"
  scripts = objects_scripts
elsif group == "json"
  scripts = json_scripts
else
  scripts = objects_scripts + json_scripts
end

scripts.each do |script|
  puts "========================================="
  puts "Running #{script}..."
  puts "========================================="
  success = system("ruby", script)
  unless success
    $stderr.puts "Error running #{script}"
    exit(1)
  end
  puts "\n"
end

puts "All benchmarks completed!"

puts "========================================="
puts "Updating README.md from stats..."
puts "========================================="
success = system("ruby", "scripts/update_readme.rb")
if success
  puts "README.md successfully updated!"
else
  $stderr.puts "Error updating README.md"
end
