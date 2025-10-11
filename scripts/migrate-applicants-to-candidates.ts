import { prisma } from '../lib/prisma'

/**
 * Data Migration Script: Move Applicants from Users to Candidates
 *
 * This script:
 * 1. Finds all User(UCHADZAC) records
 * 2. Copies auth + personal data to their Candidate records
 * 3. Deletes User(UCHADZAC) records
 *
 * Run: node --loader ts-node/esm scripts/migrate-applicants-to-candidates.ts
 */

async function migrateApplicantsToCandidates() {
  console.log('Starting migration: Move Applicants to Candidates...\n')

  try {
    // Step 1: Find all UCHADZAC users
    console.log('Step 1: Finding UCHADZAC users...')
    const applicantUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: 'UCHADZAC'
          }
        }
      },
      include: {
        candidates: true,
        userRoles: true,
      }
    })

    console.log(`Found ${applicantUsers.length} UCHADZAC users\n`)

    if (applicantUsers.length === 0) {
      console.log('No UCHADZAC users found. Migration not needed.')
      return
    }

    // Step 2: For each User(UCHADZAC), update their Candidate records
    console.log('Step 2: Copying auth + personal data to Candidates...')
    let updatedCount = 0

    for (const user of applicantUsers) {
      console.log(`Processing User: ${user.username} (${user.name} ${user.surname})`)

      for (const candidate of user.candidates) {
        console.log(`  - Updating Candidate: ${candidate.id} (VK: ${candidate.vkId})`)

        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            password: user.password,
            name: user.name,
            surname: user.surname,
            email: candidate.email || user.email,
            phone: user.phone,
            active: user.active,
            lastLoginAt: user.lastLoginAt,
            updatedAt: new Date(),
          }
        })

        updatedCount++
      }
    }

    console.log(`\nUpdated ${updatedCount} Candidate records\n`)

    // Step 3: Delete User(UCHADZAC) records
    console.log('Step 3: Deleting UCHADZAC users...')

    // First delete user role assignments
    const deletedRoles = await prisma.userRoleAssignment.deleteMany({
      where: {
        role: 'UCHADZAC'
      }
    })
    console.log(`Deleted ${deletedRoles.count} UCHADZAC role assignments`)

    // Then delete users (only those who have no other roles and aren't referenced elsewhere)
    const userIdsToDelete = applicantUsers
      .filter(user => user.userRoles.length === 1 && user.userRoles[0].role === 'UCHADZAC')
      .map(user => user.id)

    if (userIdsToDelete.length > 0) {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          id: { in: userIdsToDelete }
        }
      })
      console.log(`Deleted ${deletedUsers.count} User records\n`)
    } else {
      console.log('No users to delete (all have multiple roles or are referenced)\n')
    }

    // Step 4: Verify migration
    console.log('Step 4: Verifying migration...')
    const remainingUchadzaci = await prisma.user.count({
      where: {
        userRoles: {
          some: {
            role: 'UCHADZAC'
          }
        }
      }
    })

    if (remainingUchadzaci > 0) {
      console.warn(`WARNING: ${remainingUchadzaci} UCHADZAC users still exist!`)
    } else {
      console.log('SUCCESS: All UCHADZAC users have been migrated\n')
    }

    // Check candidates with missing data
    const candidatesWithoutAuth = await prisma.candidate.count({
      where: {
        OR: [
          { password: null },
          { name: { equals: '' } },
          { surname: { equals: '' } }
        ]
      }
    })

    if (candidatesWithoutAuth > 0) {
      console.warn(`WARNING: ${candidatesWithoutAuth} candidates have missing auth/personal data`)
    } else {
      console.log('SUCCESS: All candidates have auth + personal data\n')
    }

    console.log('Migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateApplicantsToCandidates()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
