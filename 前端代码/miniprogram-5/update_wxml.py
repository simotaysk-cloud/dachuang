import os
import glob
import re

files_to_update = glob.glob('src/pages/**/*-form/index.wxml', recursive=True) + \
                  glob.glob('src/pages/batch/add-external/index.wxml', recursive=True) + \
                  glob.glob('src/pages/batch/trace/index.wxml', recursive=True) + \
                  glob.glob('src/pages/batch/lineage-detail/index.wxml', recursive=True)

# Add planting and processing to the list just in case
# The patterns are generic enough.
replacements = {
    # Layout and Aura
    r'ops-page': '',
    r'form-shell': '',
    r'ops-aura ops-aura-left': 'page-aura aura-left',
    r'ops-aura ops-aura-right': 'page-aura aura-right',
    r'ops-aura': 'page-aura',

    # Topbar
    r'ops-topbar': 'topbar',
    r'ops-nav': 'nav-ghost',
    r'ops-nav-arrow': 'nav-ghost-arrow',
    r'ops-brand': 'brand-title',
    r'ops-profile-chip': 'profile-chip',
    r'ops-profile-name': 'profile-name',
    r'ops-profile-role': 'profile-role',

    # Header
    r'ops-header': 'header',
    r'ops-title': 'title',
    r'ops-desc': 'desc',

    # Hero Card
    r'form-hero-card': 'hero-panel hero-panel-warning',
    r'ops-hero-pattern': 'hero-pattern',
    r'form-hero-title': 'hero-title',
    r'form-hero-desc': 'hero-subtitle',

    # form layout to generic layout
    r'form-card': 'card',
    r'form-section-title': 'section-title',
    r'form-subtitle': 'sub-title',
    r'form-meta': 'meta',
    r'form-grid-2': 'grid-2',
    
    # Chip row
    r'form-chip-row': 'chip-row',
    r'form-chip-active': 'chip-active',
    r'form-chip': 'chip',

    # Readonly
    r'form-readonly-label': 'readonly-label',
    r'form-readonly-value': 'readonly-value',
    r'form-readonly': 'readonly-row',

    # Actions
    r'form-action-row': 'action-row',
    r'form-single-action': 'single-action'
}

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for old, new in replacements.items():
        # simple regex replacement ignoring word boundaries to catch simple cases, but using word boundary for exact class names.
        content = re.sub(r'\b' + old + r'\b', new, content)

    # Specific fix: `<view class="">` after removing ops-page or form-shell
    content = re.sub(r'class="\s+"', '', content)
    content = re.sub(r'class="\s+([\w\s-]+)"', r'class="\1"', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Updated {len(files_to_update)} files.")
