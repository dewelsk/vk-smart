import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const superadminPassword = await bcrypt.hash('Hackaton25', 10)
  const testPassword = await bcrypt.hash('Test1234', 10)

  // 1. Create Institutions (Rezorty)
  console.log('Creating institutions...')

  const institutionMV = await prisma.institution.upsert({
    where: { code: 'MV' },
    update: {},
    create: {
      code: 'MV',
      name: 'Ministerstvo vnútra SR',
      description: 'Ministerstvo vnútra Slovenskej republiky',
      active: true,
    },
  })

  const institutionMZVEZ = await prisma.institution.upsert({
    where: { code: 'MZVEZ' },
    update: {},
    create: {
      code: 'MZVEZ',
      name: 'Ministerstvo zahraničných vecí a európskych záležitostí SR',
      description: 'Ministerstvo zahraničných vecí a európskych záležitostí Slovenskej republiky',
      active: true,
    },
  })

  const institutionMF = await prisma.institution.upsert({
    where: { code: 'MF' },
    update: {},
    create: {
      code: 'MF',
      name: 'Ministerstvo financií SR',
      description: 'Ministerstvo financií Slovenskej republiky',
      active: true,
    },
  })

  console.log(`✅ Created ${3} institutions`)

  // 2. Create Superadmin
  console.log('Creating superadmin...')

  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@retry.sk',
      password: superadminPassword,
      name: 'Super',
      surname: 'Admin',
      role: UserRole.SUPERADMIN,
      active: true,
      temporaryAccount: false,
    },
  })

  console.log(`✅ Created superadmin: ${superadmin.email}`)

  // 3. Create Admin for MV
  console.log('Creating admin for MV...')

  const adminMV = await prisma.user.upsert({
    where: { username: 'admin.mv' },
    update: {},
    create: {
      username: 'admin.mv',
      email: 'admin.mv@retry.sk',
      password: testPassword,
      name: 'Martin',
      surname: 'Správca',
      role: UserRole.ADMIN,
      active: true,
      temporaryAccount: false,
    },
  })

  // Assign admin to MV institution
  await prisma.userInstitution.upsert({
    where: {
      userId_institutionId: {
        userId: adminMV.id,
        institutionId: institutionMV.id,
      },
    },
    update: {},
    create: {
      userId: adminMV.id,
      institutionId: institutionMV.id,
      assignedBy: superadmin.id,
    },
  })

  console.log(`✅ Created admin: ${adminMV.email} (MV)`)

  // 4. Create Gestor for MV
  console.log('Creating gestor for MV...')

  const gestorMV = await prisma.user.upsert({
    where: { username: 'gestor.mv' },
    update: {},
    create: {
      username: 'gestor.mv',
      email: 'gestor.mv@retry.sk',
      password: testPassword,
      name: 'Jana',
      surname: 'Gestorová',
      role: UserRole.GESTOR,
      active: true,
      temporaryAccount: false,
    },
  })

  // Assign gestor to MV institution
  await prisma.userInstitution.upsert({
    where: {
      userId_institutionId: {
        userId: gestorMV.id,
        institutionId: institutionMV.id,
      },
    },
    update: {},
    create: {
      userId: gestorMV.id,
      institutionId: institutionMV.id,
      assignedBy: adminMV.id,
    },
  })

  console.log(`✅ Created gestor: ${gestorMV.email} (MV)`)

  // 5. Create Commission member for MV
  console.log('Creating commission member for MV...')

  const komisiaMV = await prisma.user.upsert({
    where: { username: 'komisia.mv' },
    update: {},
    create: {
      username: 'komisia.mv',
      email: 'komisia.mv@retry.sk',
      password: testPassword,
      name: 'Peter',
      surname: 'Hodnotiteľ',
      role: UserRole.KOMISIA,
      active: true,
      temporaryAccount: false,
    },
  })

  // Assign commission member to MV institution
  await prisma.userInstitution.upsert({
    where: {
      userId_institutionId: {
        userId: komisiaMV.id,
        institutionId: institutionMV.id,
      },
    },
    update: {},
    create: {
      userId: komisiaMV.id,
      institutionId: institutionMV.id,
      assignedBy: adminMV.id,
    },
  })

  console.log(`✅ Created commission member: ${komisiaMV.email} (MV)`)

  // 6. Create additional GESTORs and KOMISIA members for testing
  console.log('Creating additional gestors and commission members...')

  const gestorUsers = [
    { username: 'gestor.mzvez1', email: 'gestor.mzvez1@retry.sk', name: 'Eva', surname: 'Nováková', institution: institutionMZVEZ },
    { username: 'gestor.mzvez2', email: 'gestor.mzvez2@retry.sk', name: 'Marek', surname: 'Kováč', institution: institutionMZVEZ },
    { username: 'gestor.mf1', email: 'gestor.mf1@retry.sk', name: 'Lucia', surname: 'Horváthová', institution: institutionMF },
    { username: 'gestor.mf2', email: 'gestor.mf2@retry.sk', name: 'Tomáš', surname: 'Varga', institution: institutionMF },
    { username: 'gestor.mv2', email: 'gestor.mv2@retry.sk', name: 'Katarína', surname: 'Szabová', institution: institutionMV },
  ]

  for (const gestorData of gestorUsers) {
    const gestor = await prisma.user.upsert({
      where: { username: gestorData.username },
      update: {},
      create: {
        username: gestorData.username,
        email: gestorData.email,
        password: testPassword,
        name: gestorData.name,
        surname: gestorData.surname,
        role: UserRole.GESTOR,
        active: true,
        temporaryAccount: false,
      },
    })

    await prisma.userInstitution.upsert({
      where: {
        userId_institutionId: {
          userId: gestor.id,
          institutionId: gestorData.institution.id,
        },
      },
      update: {},
      create: {
        userId: gestor.id,
        institutionId: gestorData.institution.id,
        assignedBy: superadmin.id,
      },
    })

    console.log(`  ✅ Created gestor: ${gestor.email}`)
  }

  const komisiaUsers = [
    { username: 'komisia.mzvez1', email: 'komisia.mzvez1@retry.sk', name: 'Milan', surname: 'Baláž', institution: institutionMZVEZ },
    { username: 'komisia.mzvez2', email: 'komisia.mzvez2@retry.sk', name: 'Andrea', surname: 'Mináriková', institution: institutionMZVEZ },
    { username: 'komisia.mzvez3', email: 'komisia.mzvez3@retry.sk', name: 'Radovan', surname: 'Štefan', institution: institutionMZVEZ },
    { username: 'komisia.mzvez4', email: 'komisia.mzvez4@retry.sk', name: 'Simona', surname: 'Bartošová', institution: institutionMZVEZ },
    { username: 'komisia.mf1', email: 'komisia.mf1@retry.sk', name: 'Michal', surname: 'Polák', institution: institutionMF },
    { username: 'komisia.mf2', email: 'komisia.mf2@retry.sk', name: 'Zuzana', surname: 'Krajčírová', institution: institutionMF },
    { username: 'komisia.mf3', email: 'komisia.mf3@retry.sk', name: 'Vladimír', surname: 'Urban', institution: institutionMF },
    { username: 'komisia.mv2', email: 'komisia.mv2@retry.sk', name: 'Lenka', surname: 'Adamová', institution: institutionMV },
    { username: 'komisia.mv3', email: 'komisia.mv3@retry.sk', name: 'Ján', surname: 'Lakatoš', institution: institutionMV },
  ]

  for (const komisiaData of komisiaUsers) {
    const komisia = await prisma.user.upsert({
      where: { username: komisiaData.username },
      update: {},
      create: {
        username: komisiaData.username,
        email: komisiaData.email,
        password: testPassword,
        name: komisiaData.name,
        surname: komisiaData.surname,
        role: UserRole.KOMISIA,
        active: true,
        temporaryAccount: false,
      },
    })

    await prisma.userInstitution.upsert({
      where: {
        userId_institutionId: {
          userId: komisia.id,
          institutionId: komisiaData.institution.id,
        },
      },
      update: {},
      create: {
        userId: komisia.id,
        institutionId: komisiaData.institution.id,
        assignedBy: superadmin.id,
      },
    })

    console.log(`  ✅ Created komisia: ${komisia.email}`)
  }

  console.log(`\n✅ Created ${gestorUsers.length} additional gestors`)
  console.log(`✅ Created ${komisiaUsers.length} additional commission members`)

  console.log('\n✅ Seed completed!')
  console.log('\nTest accounts:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Superadmin: superadmin@retry.sk / Hackaton25')
  console.log('Admin (MV): admin.mv@retry.sk / Test1234')
  console.log('Gestor (MV): gestor.mv@retry.sk / Test1234')
  console.log('Komisia (MV): komisia.mv@retry.sk / Test1234')
  console.log('\nAll other users: [username]@retry.sk / Test1234')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
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
