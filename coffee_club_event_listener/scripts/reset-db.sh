#!/bin/bash
# reset_db.sh

# Directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PRISMA_DIR="$DIR/prisma"

echo "🗑️  Removing existing dev.db file..."
rm -f "$PRISMA_DIR/dev.db"

echo "🔄 Generating new Prisma client..."
npx prisma generate

echo "🚀 Creating new database and applying schema..."
npx prisma db push

# Optional: Add seed data if needed
# echo "🌱 Seeding database..."
# npx prisma db seed

echo "✅ Database has been reset and initialized!"