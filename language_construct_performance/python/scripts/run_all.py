import os
import sys
import subprocess

def run_all():
    print("Running all Python benchmarks sequentially in isolated processes...\n")
    
    scripts = [
        'scripts/plain_obj_fixed_properties.py',
        'scripts/value_obj_fixed_properties.py',
        'scripts/value_obj_minimal_fixed_properties.py',
        'scripts/plain_obj_variable_properties.py',
        'scripts/value_obj_variable_properties.py',
        'scripts/value_obj_minimal_variable_properties.py'
    ]
    
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
