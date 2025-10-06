import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

const testCandidates = [
  { name: 'Peter', surname: 'Kováč' },
  { name: 'Mária', surname: 'Nováková' },
  { name: 'Ján', surname: 'Horvát' },
  { name: 'Anna', surname: 'Tóthová' },
  { name: 'Michal', surname: 'Varga' },
  { name: 'Eva', surname: 'Molnárová' },
  { name: 'Martin', surname: 'Baláž' },
  { name: 'Zuzana', surname: 'Králová' },
  { name: 'Tomáš', surname: 'Szabó' },
  { name: 'Lucia', surname: 'Fabiánová' },
]

async function main() {
  console.log('Creating 10 test candidates...\n')

  const timestamp = Date.now()
  const hashedPassword = await bcrypt.hash('test123', 10)

  for (let i = 0; i < testCandidates.length; i++) {
    const candidate = testCandidates[i]
    const cisId = `CIS${timestamp + i}`
    const username = cisId
    const email = `${candidate.name.toLowerCase()}.${candidate.surname.toLowerCase()}.${timestamp + i}@test.sk`

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: candidate.name,
        surname: candidate.surname,
        role: 'UCHADZAC',
        active: true,
        temporaryAccount: false,
      }
    })

    console.log(`✅ Created: ${user.name} ${user.surname} (${user.username}, ${user.email})`)
  }

  console.log('\n✨ Successfully created 10 test candidates!')

  const totalCandidates = await prisma.user.count({
    where: { role: 'UCHADZAC', active: true }
  })

  console.log(`\n📊 Total active UCHADZAC users: ${totalCandidates}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error:', e)
    prisma.$disconnect()
    process.exit(1)
  })
