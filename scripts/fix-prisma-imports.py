#!/usr/bin/env python3
import os
import re
from pathlib import Path

# Directories to process
directories = [
    'app/api',
    'tests/backend',
    'prisma'
]

base_path = Path('/Users/jozo/WebstormProjects/Hackaton - vyberove konania')

def fix_file(file_path):
    """Fix PrismaClient imports in a single file"""
    with open(file_path, 'r') as f:
        content = f.read()

    # Skip if already using lib/prisma
    if 'from \'@/lib/prisma\'' in content or 'from "@/lib/prisma"' in content:
        return False

    # Skip if no new PrismaClient()
    if 'new PrismaClient()' not in content:
        return False

    print(f'Fixing: {file_path}')

    # Pattern 1: import { PrismaClient, ... } from '@prisma/client'
    # Replace with separate imports
    pattern1 = r"import \{ PrismaClient,\s*([^}]+)\s*\} from ['\"]@prisma/client['\"]"
    replacement1 = r"import { \1 } from '@prisma/client'\nimport { prisma } from '@/lib/prisma'"
    content = re.sub(pattern1, replacement1, content)

    # Pattern 2: import { PrismaClient } from '@prisma/client'
    # Replace entirely
    pattern2 = r"import \{ PrismaClient \} from ['\"]@prisma/client['\"]"
    replacement2 = "import { prisma } from '@/lib/prisma'"
    content = re.sub(pattern2, replacement2, content)

    # Remove const prisma = new PrismaClient()
    content = re.sub(r'\nconst prisma = new PrismaClient\(\)\n', '\n', content)

    # Write back
    with open(file_path, 'w') as f:
        f.write(content)

    return True

# Process all directories
fixed_count = 0
for directory in directories:
    dir_path = base_path / directory
    if not dir_path.exists():
        continue

    # Find all .ts files
    for file_path in dir_path.rglob('*.ts'):
        if fix_file(file_path):
            fixed_count += 1

print(f'\nFixed {fixed_count} files')
