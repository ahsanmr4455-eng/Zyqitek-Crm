import os
import re

files_to_check = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            files_to_check.append(os.path.join(root, file))

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix buttons
    content = re.sub(r'bg-([a-z]+)-([6789]00)\b([^>]*?)text-\[var\(--crm-heading\)\]', r'bg-\1-\2\3text-white', content)
    
    # Also bg-black text-[var(--crm-heading)] if it's a button, wait no, let's just fix text-[var(--crm-heading)] inside buttons with dark backgrounds.
    content = re.sub(r'bg-black\b([^>]*?)text-\[var\(--crm-heading\)\]', r'bg-black\1text-white', content)
    
    # Also bg-zinc-900 or bg-slate-900 might have been replaced to bg-[var(--crm-card)]
    # but my python script earlier replaced bg-zinc-900 to bg-[var(--crm-card)] directly, so bg-zinc-900 might be gone in those files.
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed buttons in {filepath}")

