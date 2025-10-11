import fs from 'fs'
import path from 'path'
import { UserRole  } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { importQuestionBattery } from '@/lib/question-battery/importer'
import bcrypt from 'bcryptjs'


async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const superadminPassword = await bcrypt.hash('Hackaton25', 10)
  const testPassword = await bcrypt.hash('Test1234', 10)

  // 1. Create Superadmin
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

  // 2. Create Admin
  console.log('Creating admin...')

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

  console.log(`✅ Created admin: ${adminMV.email}`)

  // 3. Create Gestor
  console.log('Creating gestor...')

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

  console.log(`✅ Created gestor: ${gestorMV.email}`)

  // 4. Create Commission member
  console.log('Creating commission member...')

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

  console.log(`✅ Created commission member: ${komisiaMV.email}`)

  // 5. Create additional GESTORs and KOMISIA members for testing
  console.log('Creating additional gestors and commission members...')

  const gestorUsers = [
    { username: 'gestor.mzvez1', email: 'gestor.mzvez1@retry.sk', name: 'Eva', surname: 'Nováková' },
    { username: 'gestor.mzvez2', email: 'gestor.mzvez2@retry.sk', name: 'Marek', surname: 'Kováč' },
    { username: 'gestor.mf1', email: 'gestor.mf1@retry.sk', name: 'Lucia', surname: 'Horváthová' },
    { username: 'gestor.mf2', email: 'gestor.mf2@retry.sk', name: 'Tomáš', surname: 'Varga' },
    { username: 'gestor.mv2', email: 'gestor.mv2@retry.sk', name: 'Katarína', surname: 'Szabová' },
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

    console.log(`  ✅ Created gestor: ${gestor.email}`)
  }

  const komisiaUsers = [
    { username: 'komisia.mzvez1', email: 'komisia.mzvez1@retry.sk', name: 'Milan', surname: 'Baláž' },
    { username: 'komisia.mzvez2', email: 'komisia.mzvez2@retry.sk', name: 'Andrea', surname: 'Mináriková' },
    { username: 'komisia.mzvez3', email: 'komisia.mzvez3@retry.sk', name: 'Radovan', surname: 'Štefan' },
    { username: 'komisia.mzvez4', email: 'komisia.mzvez4@retry.sk', name: 'Simona', surname: 'Bartošová' },
    { username: 'komisia.mf1', email: 'komisia.mf1@retry.sk', name: 'Michal', surname: 'Polák' },
    { username: 'komisia.mf2', email: 'komisia.mf2@retry.sk', name: 'Zuzana', surname: 'Krajčírová' },
    { username: 'komisia.mf3', email: 'komisia.mf3@retry.sk', name: 'Vladimír', surname: 'Urban' },
    { username: 'komisia.mv2', email: 'komisia.mv2@retry.sk', name: 'Lenka', surname: 'Adamová' },
    { username: 'komisia.mv3', email: 'komisia.mv3@retry.sk', name: 'Ján', surname: 'Lakatoš' },
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

    console.log(`  ✅ Created komisia: ${komisia.email}`)
  }

  console.log(`\n✅ Created ${gestorUsers.length} additional gestors`)
  console.log(`✅ Created ${komisiaUsers.length} additional commission members`)

  // 6. Create Test Types
  console.log('\nCreating test types...')

  const testTypes = [
    {
      name: 'Odborný test',
      description: 'Overenie odborných znalostí a zručností viazaných na konkrétnu pozíciu.',
      legacyNames: ['Odborný'],
    },
    {
      name: 'Všeobecný test',
      description: 'Test všeobecných znalostí a orientácie v spoločenských témach.',
      legacyNames: ['Všeobecný'],
    },
    {
      name: 'Test zo štátneho jazyka',
      description: 'Overenie ovládania slovenského jazyka na úrovni požadovanej pre štátnu službu.',
      legacyNames: ['Štátny jazyk'],
    },
    {
      name: 'Test z cudzieho jazyka',
      description: 'Overenie ovládania cudzieho jazyka podľa definovanej jazykovej úrovne.',
      legacyNames: ['Cudzí jazyk'],
    },
    {
      name: 'Test z práce s informačnými technológiami',
      description: 'Praktické preverenie práce s informačnými technológiami a digitálnych zručností.',
      legacyNames: ['IT zručnosti'],
    },
    {
      name: 'Schopnosti a vlastnosti',
      description: 'Testy na overenie osobnostných schopností a kompetencií.',
      legacyNames: ['Schopnosti a vlastnosti'],
    },
  ]

  const testTypeMap = new Map<string, string>()

  for (const typeData of testTypes) {
    const lookupNames = [typeData.name, ...(typeData.legacyNames ?? [])]

    let existing = null
    for (const candidateName of lookupNames) {
      existing = await prisma.testType.findUnique({ where: { name: candidateName } })
      if (existing) {
        break
      }
    }

    const testType = existing
      ? await prisma.testType.update({
          where: { id: existing.id },
          data: {
            name: typeData.name,
            description: typeData.description,
          },
        })
      : await prisma.testType.create({
          data: {
            name: typeData.name,
            description: typeData.description,
          },
        })

    testTypeMap.set(typeData.name, testType.id)
    console.log(`  ✅ Upserted test type: ${typeData.name}`)
  }

  const testTypeConditionsSeed: Record<string, {
    name: string
    description: string
    minQuestions?: number
    maxQuestions?: number
    timeLimitMinutes?: number
    pointsPerQuestion?: number
    minimumScore?: number
  }[]> = {
    'Odborný test': [
      {
        name: 'Zamestnanec',
        description:
          'Najmenej 10 otázok a najviac 20 otázok / 20 minút / za každú správnu odpoveď 1 bod / je potrebné získať najmenej 12 bodov.',
        minQuestions: 10,
        maxQuestions: 20,
        timeLimitMinutes: 20,
        pointsPerQuestion: 1.0,
        minimumScore: 12,
      },
      {
        name: 'Vedúci zamestnanec',
        description:
          'Najmenej 15 otázok a najviac 30 otázok / 30 minút / za každú správnu odpoveď 1 bod / je potrebné získať najmenej 18 bodov.',
        minQuestions: 15,
        maxQuestions: 30,
        timeLimitMinutes: 30,
        pointsPerQuestion: 1.0,
        minimumScore: 18,
      },
    ],
    'Všeobecný test': [
      {
        name: 'Zamestnanec',
        description:
          '20 otázok / 20 minút / za každú správnu odpoveď 0,5 bodu / je potrebné získať najmenej 6 bodov.',
        minQuestions: 20,
        maxQuestions: 20,
        timeLimitMinutes: 20,
        pointsPerQuestion: 0.5,
        minimumScore: 6,
      },
      {
        name: 'Vedúci zamestnanec',
        description:
          '30 otázok / 30 minút / za každú správnu odpoveď 0,5 bodu / je potrebné získať najmenej 9 bodov.',
        minQuestions: 30,
        maxQuestions: 30,
        timeLimitMinutes: 30,
        pointsPerQuestion: 0.5,
        minimumScore: 9,
      },
    ],
    'Test zo štátneho jazyka': [
      {
        name: 'Štátny jazyk',
        description:
          'Test pozostáva z 5 otázok / najmenej 5 minút / za každú správnu odpoveď 1 bod / je potrebné získať najmenej 3 body.',
        minQuestions: 5,
        maxQuestions: 5,
        timeLimitMinutes: 5,
        pointsPerQuestion: 1.0,
        minimumScore: 3,
      },
    ],
    'Test z cudzieho jazyka': [
      {
        name: 'Úroveň A1 – A2',
        description:
          '30 otázok / 30 minút / za každú správnu odpoveď 0,5 bodu / je potrebné získať najmenej 9 bodov.',
        minQuestions: 30,
        maxQuestions: 30,
        timeLimitMinutes: 30,
        pointsPerQuestion: 0.5,
        minimumScore: 9,
      },
      {
        name: 'Úroveň B1',
        description:
          '40 otázok / 40 minút / za každú správnu odpoveď 0,5 bodu / je potrebné získať najmenej 12 bodov.',
        minQuestions: 40,
        maxQuestions: 40,
        timeLimitMinutes: 40,
        pointsPerQuestion: 0.5,
        minimumScore: 12,
      },
      {
        name: 'Úroveň B2 – C2',
        description:
          '40 otázok / 40 minút / za každú správnu odpoveď 0,5 bodu / je potrebné získať najmenej 14 bodov.',
        minQuestions: 40,
        maxQuestions: 40,
        timeLimitMinutes: 40,
        pointsPerQuestion: 0.5,
        minimumScore: 14,
      },
    ],
    'Test z práce s informačnými technológiami': [
      {
        name: 'IT zručnosti',
        description:
          'Najmenej 5 a najviac 10 písomných úloh / je potrebné získať najmenej 6 bodov.',
        minQuestions: 5,
        maxQuestions: 10,
        timeLimitMinutes: null, // Nie je špecifikované v zadaní
        pointsPerQuestion: null, // Rôzne bodovanie na úlohu
        minimumScore: 6,
      },
    ],
  }

  for (const [typeName, conditions] of Object.entries(testTypeConditionsSeed)) {
    const testTypeId = testTypeMap.get(typeName)
    if (!testTypeId) {
      console.warn(`⚠️  Test type not found for conditions seed: ${typeName}`)
      continue
    }

    await prisma.testTypeCondition.deleteMany({ where: { testTypeId } })

    if (conditions.length === 0) {
      continue
    }

    await prisma.testTypeCondition.createMany({
      data: conditions.map((condition, index) => ({
        testTypeId,
        name: condition.name,
        description: condition.description,
        sortOrder: index + 1,
        minQuestions: condition.minQuestions,
        maxQuestions: condition.maxQuestions,
        timeLimitMinutes: condition.timeLimitMinutes,
        pointsPerQuestion: condition.pointsPerQuestion,
        minimumScore: condition.minimumScore,
      })),
    })

    console.log(`  ✅ Seeded ${conditions.length} conditions for test type: ${typeName}`)
  }

  console.log(`✅ Seeded ${testTypes.length} test types`)

  // 7. Create sample VK (Výberové konania)
  console.log('\nCreating sample VK...')

  // Create a VK in PRIPRAVA status
  const vk1 = await prisma.vyberoveKonanie.upsert({
    where: { identifier: 'VK-2025-001' },
    update: {},
    create: {
      identifier: 'VK-2025-001',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Odbor verejného obstarávania',
      serviceField: 'Verejné obstarávanie',
      position: 'Hlavný štátny radca',
      serviceType: 'stála štátna služba',
      startDateTime: new Date('2025-02-15T09:00:00'),
      numberOfPositions: 2,
      status: 'PRIPRAVA',
      gestorId: (await prisma.user.findFirst({ where: { username: 'gestor.mv' }}))?.id,
      createdById: adminMV.id,
    }
  })

  // Create a VK in TESTOVANIE status
  const vk2 = await prisma.vyberoveKonanie.upsert({
    where: { identifier: 'VK-2025-002' },
    update: {},
    create: {
      identifier: 'VK-2025-002',
      selectionType: 'vnútorné',
      organizationalUnit: 'Odbor informatiky',
      serviceField: 'IT',
      position: 'Odborný radca',
      serviceType: 'dočasná štátna služba',
      startDateTime: new Date('2025-01-20T10:00:00'),
      numberOfPositions: 1,
      status: 'TESTOVANIE',
      gestorId: (await prisma.user.findFirst({ where: { username: 'gestor.mv' }}))?.id,
      createdById: adminMV.id,
    }
  })

  const vk3 = await prisma.vyberoveKonanie.upsert({
    where: { identifier: 'VK-2025-003' },
    update: {},
    create: {
      identifier: 'VK-2025-003',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Odbor financií',
      serviceField: 'Financie a účtovníctvo',
      position: 'Hlavný radca',
      serviceType: 'stála štátna služba',
      startDateTime: new Date('2025-03-10T09:00:00'),
      numberOfPositions: 3,
      status: 'PRIPRAVA',
      gestorId: (await prisma.user.findFirst({ where: { username: 'gestor.mf1' }}))?.id,
      createdById: adminMV.id,
    }
  })

  const vk4 = await prisma.vyberoveKonanie.upsert({
    where: { identifier: 'VK-2025-004' },
    update: {},
    create: {
      identifier: 'VK-2025-004',
      selectionType: 'vnútorné',
      organizationalUnit: 'Odbor zahraničných vecí',
      serviceField: 'Diplomacia',
      position: 'Radca',
      serviceType: 'dočasná štátna služba',
      startDateTime: new Date('2025-02-01T10:00:00'),
      numberOfPositions: 2,
      status: 'CAKA_NA_TESTY',
      gestorId: (await prisma.user.findFirst({ where: { username: 'gestor.mzvez1' }}))?.id,
      createdById: adminMV.id,
    }
  })

  const vk5 = await prisma.vyberoveKonanie.upsert({
    where: { identifier: 'VK-2025-005' },
    update: {},
    create: {
      identifier: 'VK-2025-005',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Odbor ľudských zdrojov',
      serviceField: 'Personalistika',
      position: 'Odborný radca',
      serviceType: 'stála štátna služba',
      startDateTime: new Date('2025-04-15T09:00:00'),
      numberOfPositions: 1,
      status: 'PRIPRAVA',
      gestorId: (await prisma.user.findFirst({ where: { username: 'gestor.mv2' }}))?.id,
      createdById: adminMV.id,
    }
  })

  console.log(`✅ Created 5 sample VK`)

  // 8. Create sample tests
  console.log('\nCreating sample tests...')

  // Get first test type for sample tests
  const odbornyTestType = await prisma.testType.findFirst({
    where: { name: { contains: 'Odborný' } }
  })
  const vseobecnyTestType = await prisma.testType.findFirst({
    where: { name: { contains: 'Všeobecný' } }
  })

  const testTypeId = odbornyTestType?.id || vseobecnyTestType?.id || (await prisma.testType.findFirst())?.id

  if (!testTypeId) {
    console.warn('⚠️  No test types found, skipping test creation')
  } else {
    const test1 = await prisma.test.upsert({
      where: { id: 'seed-test-1' },
      update: {},
      create: {
        id: 'seed-test-1',
        name: 'Test odborných znalostí - Verejné obstarávanie',
        testTypeId,
        description: 'Odborný test na verejné obstarávanie',
        questions: [
          {
            order: 1,
            text: 'Čo je verejné obstarávanie?',
            points: 2,
            questionType: 'SINGLE_CHOICE',
            answers: [
              { letter: 'A', text: 'Nákup tovarov a služieb', isCorrect: true },
              { letter: 'B', text: 'Predaj tovarov', isCorrect: false },
              { letter: 'C', text: 'Výroba tovarov', isCorrect: false },
              { letter: 'D', text: 'Distribúcia tovarov', isCorrect: false }
            ]
          },
          {
            order: 2,
            text: 'Aké sú základné princípy verejného obstarávania?',
            points: 3,
            questionType: 'SINGLE_CHOICE',
            answers: [
              { letter: 'A', text: 'Transparentnosť a rovnaký prístup', isCorrect: true },
              { letter: 'B', text: 'Utajenie a diskriminácia', isCorrect: false },
              { letter: 'C', text: 'Náhodný výber', isCorrect: false },
              { letter: 'D', text: 'Žiadne pravidlá', isCorrect: false }
            ]
          }
        ],
        allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'],
        recommendedDuration: 30,
        recommendedQuestionCount: 2,
        recommendedScore: 60,
        approved: true,
        approvedAt: new Date(),
        practiceEnabled: true,
        authorId: adminMV.id,
      }
    })

    const test2 = await prisma.test.upsert({
      where: { id: 'seed-test-2' },
      update: {},
      create: {
        id: 'seed-test-2',
        name: 'Test IT znalostí',
        testTypeId,
        description: 'Odborný test na IT znalosti',
        questions: [
          {
            order: 1,
            text: 'Čo je to IP adresa?',
            points: 2,
            questionType: 'SINGLE_CHOICE',
            answers: [
              { letter: 'A', text: 'Identifikátor zariadenia v sieti', isCorrect: true },
              { letter: 'B', text: 'Fyzická adresa', isCorrect: false },
              { letter: 'C', text: 'Email', isCorrect: false },
              { letter: 'D', text: 'Telefónne číslo', isCorrect: false }
            ]
          }
        ],
        allowedQuestionTypes: ['SINGLE_CHOICE', 'TRUE_FALSE'],
        recommendedDuration: 20,
        recommendedQuestionCount: 1,
        recommendedScore: 70,
        approved: true,
        approvedAt: new Date(),
        practiceEnabled: false,
        authorId: adminMV.id,
      }
    })

    console.log(`✅ Created 2 sample tests`)

    // 9. Assign tests to VK
    console.log('\nAssigning tests to VK...')

    // Assign test1 and test2 to vk1 (PRIPRAVA)
    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk1.id,
          level: 1
        }
      },
      update: {},
      create: {
        vkId: vk1.id,
        testId: test1.id,
        level: 1
      }
    })

    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk1.id,
          level: 2
        }
      },
      update: {},
      create: {
        vkId: vk1.id,
        testId: test2.id,
        level: 2
      }
    })

    // Assign test1 to vk2 (TESTOVANIE)
    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk2.id,
          level: 1
        }
      },
      update: {},
      create: {
        vkId: vk2.id,
        testId: test1.id,
        level: 1
      }
    })

    // Assign test2 to vk3 (PRIPRAVA)
    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk3.id,
          level: 1
        }
      },
      update: {},
      create: {
        vkId: vk3.id,
        testId: test2.id,
        level: 1
      }
    })

    // Assign test1 to vk4 (CAKA_NA_TESTY)
    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk4.id,
          level: 1
        }
      },
      update: {},
      create: {
        vkId: vk4.id,
        testId: test1.id,
        level: 1
      }
    })

    // Assign test1 and test2 to vk5 (PRIPRAVA)
    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk5.id,
          level: 1
        }
      },
      update: {},
      create: {
        vkId: vk5.id,
        testId: test1.id,
        level: 1
      }
    })

    await prisma.vKTest.upsert({
      where: {
        vkId_level: {
          vkId: vk5.id,
          level: 2
        }
      },
      update: {},
      create: {
        vkId: vk5.id,
        testId: test2.id,
        level: 2
      }
    })

    console.log(`✅ Assigned tests to VK`)
  }

  // 10. Create sample candidates
  console.log('\nCreating sample candidates...')

  const candidatePassword = await bcrypt.hash('Kandidat123', 10)

  // Candidates for VK1 (VK-2025-001)
  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-001/1' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-001/1',
      password: candidatePassword,
      name: 'Peter',
      surname: 'Novák',
      email: 'peter.novak@example.sk',
      vkId: vk1.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-001/2' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-001/2',
      password: candidatePassword,
      name: 'Jana',
      surname: 'Kováčová',
      email: 'jana.kovacova@example.sk',
      vkId: vk1.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-001/3' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-001/3',
      password: candidatePassword,
      name: 'Lucia',
      surname: 'Malá',
      email: 'lucia.mala@example.sk',
      vkId: vk1.id,
    }
  })

  // Candidates for VK2 (VK-2025-002)
  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-002/1' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-002/1',
      password: candidatePassword,
      name: 'Martin',
      surname: 'Horvát',
      email: 'martin.horvat@example.sk',
      vkId: vk2.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-002/2' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-002/2',
      password: candidatePassword,
      name: 'Eva',
      surname: 'Dvořáková',
      email: 'eva.dvorakova@example.sk',
      vkId: vk2.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-002/3' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-002/3',
      password: candidatePassword,
      name: 'Tomáš',
      surname: 'Veselý',
      email: 'tomas.vesely@example.sk',
      vkId: vk2.id,
    }
  })

  // Candidates for VK3 (VK-2025-003)
  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-003/1' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-003/1',
      password: candidatePassword,
      name: 'Andrea',
      surname: 'Tóthová',
      email: 'andrea.tothova@example.sk',
      vkId: vk3.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-003/2' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-003/2',
      password: candidatePassword,
      name: 'Michal',
      surname: 'Krajčí',
      email: 'michal.krajci@example.sk',
      vkId: vk3.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-003/3' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-003/3',
      password: candidatePassword,
      name: 'Simona',
      surname: 'Balogová',
      email: 'simona.balogova@example.sk',
      vkId: vk3.id,
    }
  })

  // Candidates for VK4 (VK-2025-004)
  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-004/1' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-004/1',
      password: candidatePassword,
      name: 'Marek',
      surname: 'Szabó',
      email: 'marek.szabo@example.sk',
      vkId: vk4.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-004/2' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-004/2',
      password: candidatePassword,
      name: 'Zuzana',
      surname: 'Nemcová',
      email: 'zuzana.nemcova@example.sk',
      vkId: vk4.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-004/3' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-004/3',
      password: candidatePassword,
      name: 'Vladimír',
      surname: 'Kubica',
      email: 'vladimir.kubica@example.sk',
      vkId: vk4.id,
    }
  })

  // Candidates for VK5 (VK-2025-005)
  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-005/1' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-005/1',
      password: candidatePassword,
      name: 'Katarína',
      surname: 'Poliaková',
      email: 'katarina.poliakova@example.sk',
      vkId: vk5.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-005/2' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-005/2',
      password: candidatePassword,
      name: 'Ján',
      surname: 'Baňas',
      email: 'jan.banas@example.sk',
      vkId: vk5.id,
    }
  })

  await prisma.candidate.upsert({
    where: { cisIdentifier: 'VK-2025-005/3' },
    update: {},
    create: {
      cisIdentifier: 'VK-2025-005/3',
      password: candidatePassword,
      name: 'Lenka',
      surname: 'Adamová',
      email: 'lenka.adamova@example.sk',
      vkId: vk5.id,
    }
  })

  console.log(`✅ Created 15 sample candidates (3 per VK)`)

  // 11. Import Question Battery (Categories + Questions)
  console.log('\nImporting question battery...')
  const questionBatteryPath = path.resolve(
    process.cwd(),
    'zadanie/subory/8. Hodnotiaci rozhovor/Batéria otázok RR - komisii.docx'
  )

  if (fs.existsSync(questionBatteryPath)) {
    await importQuestionBattery(prisma, questionBatteryPath)
    console.log('✅ Question battery imported')
  } else {
    console.warn(
      `⚠️  Question battery source file not found, import skipped: ${questionBatteryPath}`
    )
  }

  console.log('\n✅ Seed completed!')
  console.log('\nTest accounts:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Superadmin: superadmin@retry.sk / Hackaton25')
  console.log('Admin (MV): admin.mv@retry.sk / Test1234')
  console.log('Gestor (MV): gestor.mv@retry.sk / Test1234')
  console.log('Komisia (MV): komisia.mv@retry.sk / Test1234')
  console.log('\nAll other users: [username]@retry.sk / Test1234')
  console.log('\nCandidates (VK identifier login / Kandidat123):')
  console.log('VK-2025-001: VK-2025-001/1, VK-2025-001/2, VK-2025-001/3')
  console.log('VK-2025-002: VK-2025-002/1, VK-2025-002/2, VK-2025-002/3')
  console.log('VK-2025-003: VK-2025-003/1, VK-2025-003/2, VK-2025-003/3')
  console.log('VK-2025-004: VK-2025-004/1, VK-2025-004/2, VK-2025-004/3')
  console.log('VK-2025-005: VK-2025-005/1, VK-2025-005/2, VK-2025-005/3')
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
