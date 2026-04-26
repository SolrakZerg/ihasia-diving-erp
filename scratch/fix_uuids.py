import re
path = r'C:\Users\solra\Documents\Antigravity\diving-erp\scratch\import_april.sql'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def fix_uuid(match):
    uuid_str = match.group(0)
    parts = uuid_str.split('-')
    if len(parts) > 5:
        # Keep segments 1, 2, 3 and segments -2, -1 (total 5 segments)
        fixed = '-'.join(parts[:3] + parts[-2:])
        print(f"Fixed {uuid_str} -> {fixed}")
        return fixed
    return uuid_str

# Matches UUID-like strings with 5 or more segments
fixed_content = re.sub(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){2,}-[a-f0-9]{12}', fix_uuid, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(fixed_content)
