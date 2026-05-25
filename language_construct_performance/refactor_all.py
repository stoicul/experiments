import os
import shutil

def refactor_language(lang, ext):
    base = f'd:/development/ai/experiments/language_construct_performance/{lang}/scripts'
    
    # Remove minimal
    for file in [f'value_obj_minimal_fixed_properties{ext}', f'value_obj_minimal_variable_properties{ext}']:
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
    cp_rename(f'plain_obj_fixed_properties{ext}', f'plain_obj_naive_fixed_properties{ext}', f'plain_obj_idiomatic_fixed_properties{ext}')
    # Plain variable
    cp_rename(f'plain_obj_variable_properties{ext}', f'plain_obj_naive_variable_properties{ext}', f'plain_obj_idiomatic_variable_properties{ext}')
    # NodeJS typo fallback
    cp_rename(f'plane_obj_variable_properties{ext}', f'plain_obj_naive_variable_properties{ext}', f'plain_obj_idiomatic_variable_properties{ext}')

    # Value fixed
    cp_rename(f'value_obj_fixed_properties{ext}', f'value_obj_naive_fixed_properties{ext}', f'value_obj_idiomatic_fixed_properties{ext}')
    # Value variable
    cp_rename(f'value_obj_variable_properties{ext}', f'value_obj_naive_variable_properties{ext}', f'value_obj_idiomatic_variable_properties{ext}')

    # JSON encoding
    cp_rename(f'json_encoding{ext}', f'json_encoding_plain_naive{ext}', f'json_encoding_plain_idiomatic{ext}')

    def rep(f, rs):
        p = os.path.join(base, f)
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as file:
                s = file.read()
            for o,n in rs:
                s = s.replace(o,n)
            with open(p,'w', encoding='utf-8') as file:
                file.write(s)

    rep(f'plain_obj_naive_fixed_properties{ext}', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])
    rep(f'plain_obj_naive_variable_properties{ext}', [('Starting Plain', 'Starting Plain Naive'), ('Plain Creation', 'Plain Naive Creation'), ('(Plain)', '(Plain Naive)'), ('"plain object"', '"plain object naive"')])

    rep(f'plain_obj_idiomatic_fixed_properties{ext}', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])
    rep(f'plain_obj_idiomatic_variable_properties{ext}', [('Starting Plain', 'Starting Plain Idiomatic'), ('Plain Creation', 'Plain Idiomatic Creation'), ('(Plain)', '(Plain Idiomatic)'), ('"plain object"', '"plain object idiomatic"')])

    rep(f'value_obj_naive_fixed_properties{ext}', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])
    rep(f'value_obj_naive_variable_properties{ext}', [('Starting Value Object', 'Starting Value Object Naive'), ('Value Object Creation', 'Value Object Naive Creation'), ('(Value Object)', '(Value Object Naive)'), ('"value object"', '"value object naive"')])

    rep(f'value_obj_idiomatic_fixed_properties{ext}', [('Starting Value Object', 'Starting Value Object Idiomatic'), ('Value Object Creation', 'Value Object Idiomatic Creation'), ('(Value Object)', '(Value Object Idiomatic)'), ('"value object"', '"value object idiomatic"')])
    rep(f'value_obj_idiomatic_variable_properties{ext}', [('Starting Value Object', 'Starting Value Object Idiomatic'), ('Value Object Creation', 'Value Object Idiomatic Creation'), ('(Value Object)', '(Value Object Idiomatic)'), ('"value object"', '"value object idiomatic"')])

    rep(f'json_encoding_plain_naive{ext}', [('stats_json.json', 'stats_json_plain_naive.json')])
    rep(f'json_encoding_plain_idiomatic{ext}', [('stats_json.json', 'stats_json_plain_idiomatic.json')])

# Refactor remaining scripted languages
refactor_language('nodejs', '.mjs')
refactor_language('bun', '.mjs')
refactor_language('php', '.php')

print("Refactored Node, Bun, and PHP!")
