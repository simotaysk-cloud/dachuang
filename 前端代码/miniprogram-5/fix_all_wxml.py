import os
import glob
import re

files_to_update = glob.glob('src/pages/**/*.wxml', recursive=True)

replacements = {
    # Layout and Aura
    r'ops-page': '',
    r'form-shell': '',
    r'ops-aura ops-aura-left': 'page-aura aura-left',
    r'ops-aura ops-aura-right': 'page-aura aura-right',
    r'ops-aura': 'page-aura',

    # Topbar generic replacements including custom list tops
    r'ops-topbar': 'topbar',
    r'planting-topbar': 'topbar',
    r'ops-nav': 'nav-ghost',
    r'nav-ghost': 'nav-ghost',       # already there in planting
    r'ops-nav-arrow': 'nav-ghost-arrow',
    r'ops-brand': 'brand-title',
    r'topbar-brand': 'brand-title',
    r'ops-profile-chip': 'profile-chip',
    r'ops-profile-name': 'profile-name',
    r'ops-profile-role': 'profile-role',

    # Header generic
    r'ops-header': 'header',
    r'planting-header': 'header',
    r'ops-title': 'title',
    r'planting-title': 'title',
    r'ops-desc': 'desc',
    r'planting-desc': 'desc',

    # Hero Card
    r'form-hero-card': 'hero-panel hero-panel-warning',
    r'ops-hero-pattern': 'hero-pattern',
    r'form-hero-title': 'hero-title',
    r'form-hero-desc': 'hero-subtitle',

    r'batch-hero': 'hero-panel hero-panel-warning',
    r'batch-hero-pattern': 'hero-pattern',
    r'batch-hero-head': 'hero-head',
    r'batch-hero-copy': 'hero-copy',
    r'batch-hero-eyebrow': 'hero-subtitle', # eyebrow -> subtitle
    r'batch-hero-number': 'hero-title',

    # form layout to generic layout
    r'form-card': 'card',
    r'ops-surface-card': 'card',
    r'action-card': 'card',
    r'records-card': 'card',

    r'form-section-title': 'section-title',
    r'ops-section-title': 'section-title',
    r'ops-section-meta': 'meta',
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
    r'form-single-action': 'single-action',
    
    # Lists
    r'ops-list': 'list',
    r'ops-list-item': 'list-item',
    r'ops-list-main': 'list-main',
    r'ops-list-title': 'list-title',
    r'ops-list-line-strong': 'list-title',
    r'ops-list-line': 'list-sub',
    r'ops-list-side': 'list-action',
    r'ops-list-pill': 'list-action',
    r'ops-list-head': 'list-head',
    
    r'ops-empty-state': 'empty-state',
    r'ops-empty-title': 'empty-title',
    r'ops-empty-desc': 'empty-desc',
    
    r'ops-list-index': 'list-index',
    r'ops-list-index-text': 'list-index-text'
}

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    for old, new in replacements.items():
        new_content = re.sub(r'\b' + old + r'\b', new, content)
        if new_content != content:
            content = new_content
            changed = True

    if changed:
        # Specific fix: `<view class="">`
        content = re.sub(r'class="\s+"', '', content)
        content = re.sub(r'class="\s+([\w\s-]+)"', r'class="\1"', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Finished processing all WXML.")
