#!/bin/bash

# Find all .ts files in app/api and replace PrismaClient imports
find app/api -name "*.ts" -type f | while read file; do
  # Check if file contains 'new PrismaClient()'
  if grep -q "new PrismaClient()" "$file"; then
    echo "Fixing: $file"

    # Replace import statement
    sed -i '' 's/import { PrismaClient\(.*\) } from .*@prisma\/client.*/import {\1 } from '\''@prisma\/client'\''\nimport { prisma } from '\''@\/lib\/prisma'\''/g' "$file"

    # Remove 'const prisma = new PrismaClient()' line
    sed -i '' '/^const prisma = new PrismaClient()/d' "$file"

    # Remove empty lines that might be left
    sed -i '' '/^$/N;/^\n$/D' "$file"
  fi
done

echo "Done!"
