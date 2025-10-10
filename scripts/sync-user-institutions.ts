/**
 * Sync user_institutions table with user_role_assignments
 *
 * This script ensures that every user who has a role assignment with an institution
 * also has a corresponding record in user_institutions table.
 *
 * Usage: npx tsx scripts/sync-user-institutions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncUserInstitutions() {
  console.log('🔄 Starting user institutions sync...\n')

  try {
    // Get all user role assignments with institutions
    const roleAssignments = await prisma.userRoleAssignment.findMany({
      where: {
        institutionId: { not: null }
      },
      include: {
        user: {
          include: {
            institutions: true
          }
        },
        institution: true
      }
    })

    console.log(`Found ${roleAssignments.length} role assignments with institutions\n`)

    let syncedCount = 0
    let alreadyExistsCount = 0

    for (const assignment of roleAssignments) {
      if (!assignment.institutionId || !assignment.institution) {
        continue
      }

      const userId = assignment.userId
      const institutionId = assignment.institutionId

      // Check if user already has this institution
      const existingLink = assignment.user.institutions.find(
        ui => ui.institutionId === institutionId
      )

      if (existingLink) {
        alreadyExistsCount++
        continue
      }

      // Create user-institution link
      await prisma.userInstitution.create({
        data: {
          userId,
          institutionId
        }
      })

      console.log(`✅ Linked user ${assignment.user.username} to ${assignment.institution.name}`)
      syncedCount++
    }

    console.log(`\n📊 Summary:`)
    console.log(`   - Already linked: ${alreadyExistsCount}`)
    console.log(`   - Newly linked: ${syncedCount}`)
    console.log(`   - Total: ${roleAssignments.length}`)
    console.log(`\n✅ Sync completed successfully!`)

  } catch (error) {
    console.error('❌ Error during sync:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
syncUserInstitutions()
