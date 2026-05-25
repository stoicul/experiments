import os
import shutil
import re

base = 'd:/development/ai/experiments/language_construct_performance/go/scripts'

# Remove minimal
for file in ['value_obj_minimal_fixed_properties.go', 'value_obj_minimal_variable_properties.go']:
    path = os.path.join(base, file)
    if os.path.exists(path):
        os.remove(path)

def cp_rename(src, dst1, dst2):
    src_path = os.path.join(base, src)
    if os.path.exists(src_path):
        shutil.copy(src_path, os.path.join(base, dst1))
        shutil.copy(src_path, os.path.join(base, dst2))
        os.remove(src_path)

# Plain fixed
cp_rename('plain_obj_fixed_properties.go', 'plain_obj_naive_fixed_properties.go', 'plain_obj_idiomatic_fixed_properties.go')
# Plain variable
cp_rename('plain_obj_variable_properties.go', 'plain_obj_naive_variable_properties.go', 'plain_obj_idiomatic_variable_properties.go')

# Value fixed
cp_rename('value_obj_fixed_properties.go', 'value_obj_naive_fixed_properties.go', 'value_obj_idiomatic_fixed_properties.go')
# Value variable
cp_rename('value_obj_variable_properties.go', 'value_obj_naive_variable_properties.go', 'value_obj_idiomatic_variable_properties.go')

# JSON encoding
cp_rename('json_encoding.go', 'json_encoding_plain_naive.go', 'json_encoding_plain_idiomatic.go')
cp_rename('json_encoding_struct.go', 'json_encoding_value_naive.go', 'json_encoding_value_idiomatic.go')

def rep(f, rs):
    p = os.path.join(base, f)
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as file:
            s = file.read()
        for o,n in rs:
            s = s.replace(o,n)
        with open(p,'w', encoding='utf-8') as file:
            file.write(s)

rep('plain_obj_naive_fixed_properties.go', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])
rep('plain_obj_naive_variable_properties.go', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])

rep('plain_obj_idiomatic_fixed_properties.go', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])
rep('plain_obj_idiomatic_variable_properties.go', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])

rep('value_obj_naive_fixed_properties.go', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])
rep('value_obj_naive_variable_properties.go', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])

rep('value_obj_idiomatic_fixed_properties.go', [
    ('Starting Value Object', 'Starting Value Object Idiomatic'),
    ('Value Object Creation', 'Value Object Idiomatic Creation'),
    ('(Value Object)', '(Value Object Idiomatic)'),
    ('"value object"', '"value object idiomatic"'),
    ('valueObjArray := make([]*ValueObjectNode', 'valueObjArray := make([]ValueObjectNode'),
    ('valueObjArray[i] = &obj', 'valueObjArray[i] = obj'),
    ('valueObjArray[i] != nil', 'valueObjArray[i].Id != ""')
])
rep('value_obj_idiomatic_variable_properties.go', [
    ('Starting Value Object', 'Starting Value Object Idiomatic'),
    ('Value Object Creation', 'Value Object Idiomatic Creation'),
    ('(Value Object)', '(Value Object Idiomatic)'),
    ('"value object"', '"value object idiomatic"'),
    ('valueObjArray := make([]*ValueObjectNode', 'valueObjArray := make([]ValueObjectNode'),
    ('valueObjArray[i] = &obj', 'valueObjArray[i] = obj'),
    ('valueObjArray[i] != nil', 'valueObjArray[i].Id != ""')
])

rep('json_encoding_plain_naive.go', [('stats_json.json', 'stats_json_plain_naive.json')])
rep('json_encoding_plain_idiomatic.go', [('stats_json.json', 'stats_json_plain_idiomatic.json')])

rep('json_encoding_value_naive.go', [
    ('stats_json_struct.json', 'stats_json_value_naive.json'),
    ('twoDArray := make([][]*ValueObjectNode', 'twoDArray := make([][]*ValueObjectNode'),
    ('columnArray[r] = &obj', 'columnArray[r] = &obj')
])
rep('json_encoding_value_idiomatic.go', [
    ('stats_json_struct.json', 'stats_json_value_idiomatic.json'),
    ('twoDArray := make([][]*ValueObjectNode, columns)', 'twoDArray := make([][]ValueObjectNode, columns)'),
    ('columnArray := make([]*ValueObjectNode, rows)', 'columnArray := make([]ValueObjectNode, rows)'),
    ('columnArray[r] = &obj', 'columnArray[r] = obj')
])

# UPDATE RUN_ALL
run_file = f'{base}/run_all.go'
if os.path.exists(run_file):
    with open(run_file, 'r', encoding='utf-8') as f:
        run_code = f.read()
    
    run_code = re.sub(r'objectsScripts := \[\]string\{.*?\}', '''objectsScripts := []string{
		"scripts/plain_obj_naive_fixed_properties.go",
		"scripts/plain_obj_idiomatic_fixed_properties.go",
		"scripts/value_obj_naive_fixed_properties.go",
		"scripts/value_obj_idiomatic_fixed_properties.go",
		"scripts/plain_obj_naive_variable_properties.go",
		"scripts/plain_obj_idiomatic_variable_properties.go",
		"scripts/value_obj_naive_variable_properties.go",
		"scripts/value_obj_idiomatic_variable_properties.go",
	}''', run_code, flags=re.DOTALL)
    
    run_code = re.sub(r'jsonScripts := \[\]string\{.*?\}', '''jsonScripts := []string{
		"scripts/json_encoding_plain_naive.go",
		"scripts/json_encoding_plain_idiomatic.go",
		"scripts/json_encoding_value_naive.go",
		"scripts/json_encoding_value_idiomatic.go",
	}''', run_code, flags=re.DOTALL)

    with open(run_file, 'w', encoding='utf-8') as f:
        f.write(run_code)

# UPDATE README
readme_file = f'{base}/update_readme.go'
if os.path.exists(readme_file):
    with open(readme_file, 'r', encoding='utf-8') as f:
        c = f.read()

    # Just search and replace for the struct that extracts metrics
    c = c.replace('''	plain := getMap(group, "plain object")
	value := getMap(group, "value object")
	minimal := getMap(group, "value object minimal")''', 
    '''	plain_naive := getMap(group, "plain object naive")
	plain_idiomatic := getMap(group, "plain object idiomatic")
	value_naive := getMap(group, "value object naive")
	value_idiomatic := getMap(group, "value object idiomatic")''')
    
    c = c.replace('| Metric | Plain Object (Map) | Value Object (Struct) | Value Object Minimal |', '| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |')
    c = c.replace('| :--- | :---: | :---: | :---: |', '| :--- | :---: | :---: | :---: | :---: |')
    
    c = c.replace('''func(metricName, key string, isMemory bool) string {
		if isMemory {
			return fmt.Sprintf("| **%s** | %s | %s | %s |\\n", metricName, formatMB(getFloat(plain, key)), formatMB(getFloat(value, key)), formatMB(getFloat(minimal, key)))
		}
		return fmt.Sprintf("| **%s** | %s | %s | %s |\\n", metricName, formatMs(getFloat(plain, key)), formatMs(getFloat(value, key)), formatMs(getFloat(minimal, key)))
	}''', '''func(metricName, key string, isMemory bool) string {
		if isMemory {
			return fmt.Sprintf("| **%s** | %s | %s | %s | %s |\\n", metricName, formatMB(getFloat(plain_naive, key)), formatMB(getFloat(plain_idiomatic, key)), formatMB(getFloat(value_naive, key)), formatMB(getFloat(value_idiomatic, key)))
		}
		return fmt.Sprintf("| **%s** | %s | %s | %s | %s |\\n", metricName, formatMs(getFloat(plain_naive, key)), formatMs(getFloat(plain_idiomatic, key)), formatMs(getFloat(value_naive, key)), formatMs(getFloat(value_idiomatic, key)))
	}''')
    
    # JSON replacements
    c = c.replace('''		var jsonStructStats map[string]interface{}
		jsonStructStatsBytes, err := ioutil.ReadFile(filepath.Join(dataDir, "stats_json_struct.json"))
		if err == nil {
			json.Unmarshal(jsonStructStatsBytes, &jsonStructStats)
		}''',
    '''		
		var jsonStatsPN, jsonStatsPI, jsonStatsVN, jsonStatsVI map[string]interface{}
		loadJson := func(name string, dest *map[string]interface{}) {
			b, err := ioutil.ReadFile(filepath.Join(dataDir, name))
			if err == nil {
				json.Unmarshal(b, dest)
			}
		}
		loadJson("stats_json_plain_naive.json", &jsonStatsPN)
		loadJson("stats_json_plain_idiomatic.json", &jsonStatsPI)
		loadJson("stats_json_value_naive.json", &jsonStatsVN)
		loadJson("stats_json_value_idiomatic.json", &jsonStatsVI)
    ''')

    c = c.replace('''		mdContent += fmt.Sprintf("\\n### 3. JSON Encoding/Decoding (%v cols x %s rows)\\n\\n", jsonCols, formattedJsonRows)
		mdContent += "| Metric | Plain Object (Map) | Value Object (Struct) |\\n"
		mdContent += "| :--- | :---: | :---: |\\n"''',
    '''		mdContent += fmt.Sprintf("\\n### 3. JSON Encoding/Decoding (%v cols x %s rows)\\n\\n", jsonCols, formattedJsonRows)
		mdContent += "| Metric | Plain Object (Naive) | Plain Object (Idiomatic) | Value Object (Naive) | Value Object (Idiomatic) |\\n"
		mdContent += "| :--- | :---: | :---: | :---: | :---: |\\n"''')

    c = c.replace('''		formatJsonRow := func(metricName, key string, isMemory bool) string {
			s1 := getMap(jsonStats, "stats")
			s2 := getMap(jsonStructStats, "stats")
			if isMemory {
				return fmt.Sprintf("| **%s** | %s | %s |\\n", metricName, formatMB(getFloat(s1, key)), formatMB(getFloat(s2, key)))
			}
			return fmt.Sprintf("| **%s** | %s | %s |\\n", metricName, formatMs(getFloat(s1, key)), formatMs(getFloat(s2, key)))
		}''',
    '''		formatJsonRow := func(metricName, key string, isMemory bool) string {
			s1 := getMap(jsonStatsPN, "stats")
			s2 := getMap(jsonStatsPI, "stats")
			s3 := getMap(jsonStatsVN, "stats")
			s4 := getMap(jsonStatsVI, "stats")
			
			if isMemory {
				return fmt.Sprintf("| **%s** | %s | %s | %s | %s |\\n", metricName, formatMB(getFloat(s1, key)), formatMB(getFloat(s2, key)), formatMB(getFloat(s3, key)), formatMB(getFloat(s4, key)))
			}
			return fmt.Sprintf("| **%s** | %s | %s | %s | %s |\\n", metricName, formatMs(getFloat(s1, key)), formatMs(getFloat(s2, key)), formatMs(getFloat(s3, key)), formatMs(getFloat(s4, key)))
		}''')

    # Also handle the fact that jsonStats is still referenced, instead of jsonStatsPN for rows/cols
    c = c.replace('''		jsonRows := jsonStats["rows"]
		jsonCols := jsonStats["columns"]''',
    '''		var jsonRows, jsonCols interface{} = 0, 0
		if jsonStatsPN != nil {
			jsonRows = jsonStatsPN["rows"]
			jsonCols = jsonStatsPN["columns"]
		}''')

    # Remove ioutil which is deprecated since go1.16, wait this might not compile if they used it originally. 
    # Let's leave ioutil if they imported it. It should be fine.

    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(c)

print("Go refactored successfully!")
