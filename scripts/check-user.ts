import { prisma } from '../lib/prisma'

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'cmgdya94g0000bvykvnfqh611' },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      surname: true,
      role: true,
      active: true,
      temporaryAccount: true,
      createdAt: true,
      candidates: {
        select: {
          id: true,
          vkId: true,
          cisIdentifier: true,
        }
      }
    }
  })
  
  console.log('User:', JSON.stringify(user, null, 2))
  
  if (user) {
    // Check if there are any candidates with this user
    const candidateCount = await prisma.candidate.count({
      where: { userId: user.id }
    })
    
    console.log('\nCandidate records count:', candidateCount)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
