puts "Running all benchmarks sequentially in isolated processes...\n\n"

scripts = [
  "scripts/plain_obj_fixed_properties.rb",
  "scripts/value_obj_fixed_properties.rb",
  "scripts/value_obj_minimal_fixed_properties.rb",
  "scripts/plain_obj_variable_properties.rb",
  "scripts/value_obj_variable_properties.rb",
  "scripts/value_obj_minimal_variable_properties.rb"
]

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
