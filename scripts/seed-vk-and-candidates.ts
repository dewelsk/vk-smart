import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding VK and Candidates...\n')

  // Get admin user to create VKs
  const admin = await prisma.user.findFirst({
    where: { userRoles: { some: { role: 'ADMIN' } } },
  })

  if (!admin) {
    console.error('❌ No admin user found. Please run main seed first.')
    process.exit(1)
  }

  console.log(`✅ Found admin: ${admin.email}`)

  // Create 5 test VK
  console.log('\n📋 Creating test VK...')

  const vkData = [
    {
      identifier: 'VK-2025-001',
      selectionType: 'Výberové konanie na pozíciu IT špecialista',
      organizationalUnit: 'Ministerstvo vnútra SR - Odbor IT',
      serviceField: 'Informatika',
      position: 'IT špecialista',
      serviceType: 'Štátna služba',
      startDateTime: new Date('2025-11-15T09:00:00Z'),
    },
    {
      identifier: 'VK-2025-002',
      selectionType: 'Výberové konanie na pozíciu Analytik dát',
      organizationalUnit: 'Ministerstvo financií SR - Analytický útvar',
      serviceField: 'Analytika',
      position: 'Analytik dát',
      serviceType: 'Štátna služba',
      startDateTime: new Date('2025-11-20T10:00:00Z'),
    },
    {
      identifier: 'VK-2025-003',
      selectionType: 'Výberové konanie na pozíciu Právnik',
      organizationalUnit: 'Ministerstvo spravodlivosti SR',
      serviceField: 'Právo',
      position: 'Právnik',
      serviceType: 'Štátna služba',
      startDateTime: new Date('2025-12-01T09:30:00Z'),
    },
    {
      identifier: 'VK-2025-004',
      selectionType: 'Výberové konanie na pozíciu Ekonóm',
      organizationalUnit: 'Ministerstvo hospodárstva SR',
      serviceField: 'Ekonómia',
      position: 'Ekonóm',
      serviceType: 'Štátna služba',
      startDateTime: new Date('2025-12-10T10:00:00Z'),
    },
    {
      identifier: 'VK-2025-005',
      selectionType: 'Výberové konanie na pozíciu Personálny špecialista',
      organizationalUnit: 'Ministerstvo práce SR - Personálne oddelenie',
      serviceField: 'Ľudské zdroje',
      position: 'Personálny špecialista',
      serviceType: 'Štátna služba',
      startDateTime: new Date('2025-12-15T09:00:00Z'),
    },
  ]

  const createdVKs = []
  for (const vk of vkData) {
    const existing = await prisma.vyberoveKonanie.findUnique({
      where: { identifier: vk.identifier },
    })

    if (existing) {
      console.log(`  ⏭️  VK ${vk.identifier} already exists, skipping`)
      createdVKs.push(existing)
      continue
    }

    const created = await prisma.vyberoveKonanie.create({
      data: {
        ...vk,
        createdById: admin.id,
      },
    })

    console.log(`  ✅ Created VK: ${created.identifier} - ${created.position}`)
    createdVKs.push(created)
  }

  console.log(`\n✅ Created ${createdVKs.length} VK`)

  // Create test candidates
  console.log('\n👥 Creating test candidates...')

  const candidateData = [
    { name: 'Peter', surname: 'Kováč', email: 'peter.kovac@test.sk', phone: '+421901234567' },
    { name: 'Mária', surname: 'Nováková', email: 'maria.novakova@test.sk', phone: '+421901234568' },
    { name: 'Ján', surname: 'Horváth', email: 'jan.horvath@test.sk', phone: '+421901234569' },
    { name: 'Anna', surname: 'Tóthová', email: 'anna.tothova@test.sk', phone: '+421901234570' },
    { name: 'Michal', surname: 'Varga', email: 'michal.varga@test.sk', phone: '+421901234571' },
    { name: 'Eva', surname: 'Molnárová', email: 'eva.molnarova@test.sk', phone: '+421901234572' },
    { name: 'Martin', surname: 'Baláž', email: 'martin.balaz@test.sk', phone: '+421901234573' },
    { name: 'Zuzana', surname: 'Králová', email: 'zuzana.kralova@test.sk', phone: '+421901234574' },
    { name: 'Tomáš', surname: 'Szabó', email: 'tomas.szabo@test.sk', phone: '+421901234575' },
    { name: 'Lucia', surname: 'Fabiánová', email: 'lucia.fabianova@test.sk', phone: '+421901234576' },
    { name: 'Pavol', surname: 'Kováčik', email: 'pavol.kovacik@test.sk', phone: '+421901234577' },
    { name: 'Katarína', surname: 'Hudecová', email: 'katarina.hudecova@test.sk', phone: '+421901234578' },
    { name: 'Miroslav', surname: 'Pavlík', email: 'miroslav.pavlik@test.sk', phone: '+421901234579' },
    { name: 'Adriana', surname: 'Šimková', email: 'adriana.simkova@test.sk', phone: '+421901234580' },
    { name: 'Róbert', surname: 'Lazár', email: 'robert.lazar@test.sk', phone: '+421901234581' },
  ]

  const hashedPassword = await bcrypt.hash('test123', 10)
  let createdCandidates = 0

  // Distribute candidates across VKs (3 candidates per VK)
  // Track candidate count per VK
  const vkCandidateCounts: Record<string, number> = {}

  for (let i = 0; i < candidateData.length; i++) {
    const candidate = candidateData[i]
    const vk = createdVKs[i % createdVKs.length] // Rotate through VKs

    // Initialize or increment counter for this VK
    if (!vkCandidateCounts[vk.id]) {
      vkCandidateCounts[vk.id] = 0
    }
    vkCandidateCounts[vk.id]++

    // CIS ID format: VK-identifier/candidate-number
    const cisIdentifier = `${vk.identifier}/${vkCandidateCounts[vk.id]}`

    // Check if candidate already exists
    const existing = await prisma.candidate.findUnique({
      where: { cisIdentifier },
    })

    if (existing) {
      console.log(`  ⏭️  Candidate ${cisIdentifier} already exists, skipping`)
      continue
    }

    await prisma.candidate.create({
      data: {
        vkId: vk.id,
        cisIdentifier,
        password: hashedPassword,
        name: candidate.name,
        surname: candidate.surname,
        email: candidate.email,
        phone: candidate.phone,
        birthDate: new Date(1985 + (i % 15), i % 12, 1 + (i % 28)),
        active: true,
      },
    })

    console.log(`  ✅ Created candidate: ${candidate.name} ${candidate.surname} (${cisIdentifier}) for VK ${vk.identifier}`)
    createdCandidates++
  }

  console.log(`\n✅ Created ${createdCandidates} candidates`)

  const totalCandidates = await prisma.candidate.count({
    where: { deleted: false },
  })

  console.log(`📊 Total active candidates in database: ${totalCandidates}`)
  console.log('\n🎉 Seed completed!')
  console.log('\nTest candidates login: {VK-identifier}/{number} / test123')
  console.log('Example: VK-2025-001/1 / test123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
