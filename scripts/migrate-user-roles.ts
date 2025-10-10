/**
 * Data migration: Create UserRoleAssignment records for all existing users
 * Based on their primary role field
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting user roles migration...')

  // Get all users
  const users = await prisma.user.findMany({
    where: {
      deleted: false,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  })

  console.log(`Found ${users.length} users to migrate`)

  let migrated = 0
  let skipped = 0

  for (const user of users) {
    // Check if user already has role assignment
    const existing = await prisma.userRoleAssignment.findFirst({
      where: {
        userId: user.id,
        role: user.role,
        institutionId: null, // Global role
      },
    })

    if (existing) {
      console.log(`  Skipping ${user.username} - already has role assignment`)
      skipped++
      continue
    }

    // Create global role assignment based on primary role
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        role: user.role,
        institutionId: null, // Global role
        assignedAt: new Date(),
        assignedBy: null, // System migration
      },
    })

    console.log(`  ✅ Migrated ${user.username} (${user.role})`)
    migrated++
  }

  console.log(`\nMigration complete:`)
  console.log(`  - Migrated: ${migrated} users`)
  console.log(`  - Skipped: ${skipped} users (already migrated)`)
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
