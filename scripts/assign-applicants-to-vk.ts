import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Assigning applicants to VK...\n')

  // Get all UCHADZAC users without any candidate assignments
  const applicants = await prisma.user.findMany({
    where: {
      role: 'UCHADZAC',
      deleted: false,
      candidates: {
        none: {}
      }
    },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
    }
  })

  console.log(`Found ${applicants.length} applicants without VK assignments`)

  if (applicants.length === 0) {
    console.log('All applicants are already assigned to VK')
    return
  }

  // Get all VK ordered by creation date
  const vks = await prisma.vyberoveKonanie.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      identifier: true,
      position: true,
    }
  })

  console.log(`Found ${vks.length} VK to assign to\n`)

  if (vks.length === 0) {
    console.log('No VK found to assign applicants to')
    return
  }

  let assignedCount = 0

  // Assign each applicant to a VK (round-robin)
  for (let i = 0; i < applicants.length; i++) {
    const applicant = applicants[i]
    const vk = vks[i % vks.length] // Round-robin assignment

    // Generate unique CIS identifier
    const cisIdentifier = `CIS${Date.now()}-${i}`

    try {
      const candidate = await prisma.candidate.create({
        data: {
          userId: applicant.id,
          vkId: vk.id,
          cisIdentifier,
          email: applicant.email,
        }
      })

      console.log(`✅ ${applicant.name} ${applicant.surname} → ${vk.identifier} (${cisIdentifier})`)
      assignedCount++
    } catch (error: any) {
      console.error(`❌ Failed to assign ${applicant.name} ${applicant.surname}:`, error.message)
    }
  }

  console.log(`\n✅ Assigned ${assignedCount}/${applicants.length} applicants to VK`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
