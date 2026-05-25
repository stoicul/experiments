import os
import sys
import subprocess

def run_all():
    group = "all"
    if len(sys.argv) > 1:
        group = sys.argv[1]

    print(f"Running Python benchmarks (group: {group}) sequentially in isolated processes...\n")
    
    objects_scripts = [
        'scripts/naive/plain_obj_fixed_properties.py',
        'scripts/idiomatic/plain_obj_fixed_properties.py',
        'scripts/naive/value_obj_fixed_properties.py',
        'scripts/idiomatic/value_obj_fixed_properties.py',
        'scripts/naive/plain_obj_variable_properties.py',
        'scripts/idiomatic/plain_obj_variable_properties.py',
        'scripts/naive/value_obj_variable_properties.py',
        'scripts/idiomatic/value_obj_variable_properties.py'
    ]

    json_scripts = [
        'scripts/naive/json_encoding.py',
        'scripts/idiomatic/json_encoding.py',
    ]

    if group == "objects":
        scripts = objects_scripts
    elif group == "json":
        scripts = json_scripts
    else:
        scripts = objects_scripts + json_scripts
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    for script in scripts:
        print("=========================================")
        print(f"Running {script}...")
        print("=========================================")
        
        script_path = os.path.join(base_dir, script)
        result = subprocess.run([sys.executable, script_path], cwd=base_dir)
        
        if result.returncode != 0:
            print(f"Error running {script}")
            sys.exit(result.returncode)
            
        print()
        
    print("All benchmarks completed!")
    print("=========================================")
    print("Updating README.md from stats...")
    print("=========================================")
    
    update_readme_path = os.path.join(base_dir, 'scripts', 'update_readme.py')
    result = subprocess.run([sys.executable, update_readme_path], cwd=base_dir)
    
    if result.returncode != 0:
        print("Error updating README.md")
    else:
        print("README.md successfully updated!")
        
if __name__ == "__main__":
    run_all()
