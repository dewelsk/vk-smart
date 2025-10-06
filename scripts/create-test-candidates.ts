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
  { name: 'Pavol', surname: 'Kováčik' },
  { name: 'Katarína', surname: 'Hudecová' },
  { name: 'Miroslav', surname: 'Pavlík' },
  { name: 'Adriana', surname: 'Šimková' },
  { name: 'Róbert', surname: 'Lazár' },
  { name: 'Gabriela', surname: 'Nemcová' },
  { name: 'Dušan', surname: 'Čech' },
  { name: 'Monika', surname: 'Gáborová' },
  { name: 'Vladimír', surname: 'Urban' },
  { name: 'Renáta', surname: 'Lukáčová' },
]

async function main() {
  console.log('Creating test candidates...\n')

  const timestamp = Date.now()
  const hashedPassword = await bcrypt.hash('test123', 10)

  let created = 0
  let skipped = 0

  for (let i = 0; i < testCandidates.length; i++) {
    const candidate = testCandidates[i]
    const cisId = `CIS${timestamp + i}`
    const username = cisId
    const email = `${candidate.name.toLowerCase()}.${candidate.surname.toLowerCase()}.${timestamp + i}@test.sk`

    // Check if candidate already exists with the same name and surname
    const existingByName = await prisma.user.findFirst({
      where: {
        name: candidate.name,
        surname: candidate.surname,
        role: 'UCHADZAC',
      },
    })

    if (existingByName) {
      console.log(`⏭️  Skipped: ${candidate.name} ${candidate.surname} (already exists)`)
      skipped++
      continue
    }

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
    created++
  }

  console.log(`\n✨ Summary: Created ${created} new candidates, skipped ${skipped} duplicates`)

  const totalCandidates = await prisma.user.count({
    where: { role: 'UCHADZAC', active: true }
  })

  console.log(`📊 Total active UCHADZAC users: ${totalCandidates}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error:', e)
    prisma.$disconnect()
    process.exit(1)
  })
