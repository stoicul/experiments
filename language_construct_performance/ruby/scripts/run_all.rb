group = ARGV[0] || "all"
puts "Running benchmarks (group: #{group}) sequentially in isolated processes...\n\n"

  objects_scripts = [
    'scripts/naive/plain_obj_fixed_properties.rb',
    'scripts/idiomatic/plain_obj_fixed_properties.rb',
    'scripts/naive/value_obj_fixed_properties.rb',
    'scripts/idiomatic/value_obj_fixed_properties.rb',
    'scripts/naive/plain_obj_variable_properties.rb',
    'scripts/idiomatic/plain_obj_variable_properties.rb',
    'scripts/naive/value_obj_variable_properties.rb',
    'scripts/idiomatic/value_obj_variable_properties.rb'
  ]

  json_scripts = [
    'scripts/naive/json_encoding.rb',
    'scripts/idiomatic/json_encoding.rb',
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
