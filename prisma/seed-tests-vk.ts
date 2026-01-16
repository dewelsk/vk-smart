import { UserRole, VKStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Helper function to generate test questions
function generateQuestions(
  count: number,
  topic: string,
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' = 'SINGLE_CHOICE'
) {
  const questions = []
  for (let i = 1; i <= count; i++) {
    if (questionType === 'TRUE_FALSE') {
      questions.push({
        order: i,
        text: `${topic} - Otázka ${i}: Tvrdenie o danej téme.`,
        points: 1,
        questionType: 'TRUE_FALSE',
        answers: [
          { letter: 'A', text: 'Pravda', isCorrect: i % 2 === 1 },
          { letter: 'B', text: 'Nepravda', isCorrect: i % 2 === 0 },
        ],
      })
    } else if (questionType === 'MULTIPLE_CHOICE') {
      questions.push({
        order: i,
        text: `${topic} - Otázka ${i}: Vyberte všetky správne odpovede.`,
        points: 2,
        questionType: 'MULTIPLE_CHOICE',
        answers: [
          { letter: 'A', text: `Možnosť A pre otázku ${i}`, isCorrect: true },
          { letter: 'B', text: `Možnosť B pre otázku ${i}`, isCorrect: i % 3 === 0 },
          { letter: 'C', text: `Možnosť C pre otázku ${i}`, isCorrect: false },
          { letter: 'D', text: `Možnosť D pre otázku ${i}`, isCorrect: i % 2 === 0 },
        ],
      })
    } else {
      questions.push({
        order: i,
        text: `${topic} - Otázka ${i}: Ktorá odpoveď je správna?`,
        points: 1,
        questionType: 'SINGLE_CHOICE',
        answers: [
          { letter: 'A', text: `Správna odpoveď pre otázku ${i}`, isCorrect: true },
          { letter: 'B', text: `Nesprávna možnosť B pre otázku ${i}`, isCorrect: false },
          { letter: 'C', text: `Nesprávna možnosť C pre otázku ${i}`, isCorrect: false },
          { letter: 'D', text: `Nesprávna možnosť D pre otázku ${i}`, isCorrect: false },
        ],
      })
    }
  }
  return questions
}

async function main() {
  console.log('🌱 Seeding additional tests and VK...\n')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  })

  if (!admin) {
    console.error('❌ No admin user found. Please run main seed first.')
    process.exit(1)
  }

  console.log(`✅ Found admin: ${admin.email}`)

  // Get gestors for assigning to VK
  const gestors = await prisma.user.findMany({
    where: { role: UserRole.GESTOR },
    take: 10,
  })

  console.log(`✅ Found ${gestors.length} gestors`)

  // Get test types
  const testTypes = await prisma.testType.findMany({
    include: { conditions: true },
  })

  if (testTypes.length === 0) {
    console.error('❌ No test types found. Please run main seed first.')
    process.exit(1)
  }

  console.log(`✅ Found ${testTypes.length} test types`)

  // Create test categories
  console.log('\n📁 Creating test categories...')

  const categoryData = [
    { name: 'Verejné obstarávanie', description: 'Testy zamerané na verejné obstarávanie a zákon o VO' },
    { name: 'IT a digitálne zručnosti', description: 'Testy zamerané na informačné technológie' },
    { name: 'Financie a účtovníctvo', description: 'Testy z oblasti financií, účtovníctva a rozpočtu' },
    { name: 'Právo a legislatíva', description: 'Testy zo zákonov a právnych predpisov' },
    { name: 'Manažment a vedenie', description: 'Testy zamerané na manažérske zručnosti' },
    { name: 'Štátna správa', description: 'Testy zo štátnej správy a samosprávy' },
    { name: 'Personalistika', description: 'Testy z oblasti ľudských zdrojov' },
    { name: 'Komunikácia', description: 'Testy komunikačných zručností' },
    { name: 'Európska únia', description: 'Testy z oblasti EU a eurofondov' },
    { name: 'Bezpečnosť', description: 'Testy z oblasti bezpečnosti a ochrany údajov' },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const category = await prisma.testCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    categories[cat.name] = category.id
    console.log(`  ✅ Category: ${cat.name}`)
  }

  // Create 25 tests
  console.log('\n📝 Creating 25 tests...')

  // Status pre testy: approved + practiceEnabled kombinacie
  // SCHVALENY_AKTIVNY = approved=true, practiceEnabled=true
  // SCHVALENY_NEAKTIVNY = approved=true, practiceEnabled=false
  // ROZPRACOVANY = approved=false (čaká na schválenie)
  // DRAFT = approved=false + malý počet otázok (nedokončený)

  const testData = [
    // === SCHVÁLENÉ A AKTÍVNE TESTY (approved=true, practiceEnabled=true) ===
    {
      id: 'seed-test-vo-zakladny',
      name: 'Verejné obstarávanie - Základy',
      description: 'Základný test zo zákona o verejnom obstarávaní',
      typeName: 'Odborný test',
      categoryName: 'Verejné obstarávanie',
      questionCount: 15,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 3,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-vo-pokrocily',
      name: 'Verejné obstarávanie - Pokročilý',
      description: 'Pokročilý test z verejného obstarávania pre vedúcich zamestnancov',
      typeName: 'Odborný test',
      categoryName: 'Verejné obstarávanie',
      questionCount: 25,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 7,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-it-zakladny',
      name: 'IT zručnosti - Základy',
      description: 'Test základných IT zručností (MS Office, internet)',
      typeName: 'Test z práce s informačnými technológiami',
      categoryName: 'IT a digitálne zručnosti',
      questionCount: 10,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 2,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-it-pokrocily',
      name: 'IT zručnosti - Pokročilý',
      description: 'Pokročilý test IT zručností (databázy, siete, bezpečnosť)',
      typeName: 'Test z práce s informačnými technológiami',
      categoryName: 'IT a digitálne zručnosti',
      questionCount: 15,
      questionType: 'MULTIPLE_CHOICE' as const,
      difficulty: 8,
      approved: true,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-financie-zakladny',
      name: 'Financie a rozpočet - Základy',
      description: 'Základný test z financií a rozpočtových pravidiel',
      typeName: 'Odborný test',
      categoryName: 'Financie a účtovníctvo',
      questionCount: 20,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 4,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-financie-uctovnictvo',
      name: 'Účtovníctvo pre štátnu správu',
      description: 'Test z účtovníctva pre štátne organizácie',
      typeName: 'Odborný test',
      categoryName: 'Financie a účtovníctvo',
      questionCount: 25,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 6,
      approved: true,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-pravo-zakladny',
      name: 'Správne právo - Základy',
      description: 'Základy správneho práva pre štátnych zamestnancov',
      typeName: 'Odborný test',
      categoryName: 'Právo a legislatíva',
      questionCount: 20,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-pravo-pracovne',
      name: 'Zákonník práce',
      description: 'Test zo Zákonníka práce a pracovnoprávnych vzťahov',
      typeName: 'Odborný test',
      categoryName: 'Právo a legislatíva',
      questionCount: 18,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-manazment',
      name: 'Manažérske zručnosti',
      description: 'Test manažérskych a vodcovských zručností',
      typeName: 'Schopnosti a vlastnosti',
      categoryName: 'Manažment a vedenie',
      questionCount: 15,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 6,
      approved: true,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-statna-sprava',
      name: 'Základy štátnej služby',
      description: 'Test zo zákona o štátnej službe a organizácie štátnej správy',
      typeName: 'Odborný test',
      categoryName: 'Štátna správa',
      questionCount: 20,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 4,
      approved: true,
      practiceEnabled: true,
    },
    // Všeobecné testy
    {
      id: 'seed-test-vseobecny-zamestnanec',
      name: 'Všeobecný test pre zamestnancov',
      description: 'Všeobecný vedomostný test pre bežných zamestnancov',
      typeName: 'Všeobecný test',
      categoryName: 'Štátna správa',
      questionCount: 20,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 3,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-vseobecny-veduci',
      name: 'Všeobecný test pre vedúcich',
      description: 'Všeobecný vedomostný test pre vedúcich zamestnancov',
      typeName: 'Všeobecný test',
      categoryName: 'Štátna správa',
      questionCount: 30,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    // Jazykové testy
    {
      id: 'seed-test-slovensky-jazyk',
      name: 'Test zo slovenského jazyka',
      description: 'Test ovládania slovenského jazyka',
      typeName: 'Test zo štátneho jazyka',
      categoryName: 'Komunikácia',
      questionCount: 5,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 3,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-anglictina-a1',
      name: 'Anglický jazyk - Úroveň A1-A2',
      description: 'Test z anglického jazyka na úrovni A1-A2',
      typeName: 'Test z cudzieho jazyka',
      categoryName: 'Komunikácia',
      questionCount: 30,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 2,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-anglictina-b1',
      name: 'Anglický jazyk - Úroveň B1',
      description: 'Test z anglického jazyka na úrovni B1',
      typeName: 'Test z cudzieho jazyka',
      categoryName: 'Komunikácia',
      questionCount: 40,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-anglictina-b2',
      name: 'Anglický jazyk - Úroveň B2-C2',
      description: 'Test z anglického jazyka na úrovni B2 a vyššej',
      typeName: 'Test z cudzieho jazyka',
      categoryName: 'Komunikácia',
      questionCount: 40,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 8,
      approved: true,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-nemcina-b1',
      name: 'Nemecký jazyk - Úroveň B1',
      description: 'Test z nemeckého jazyka na úrovni B1',
      typeName: 'Test z cudzieho jazyka',
      categoryName: 'Komunikácia',
      questionCount: 40,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    // Ďalšie odborné testy
    {
      id: 'seed-test-personalistika',
      name: 'Personalistika a HR',
      description: 'Test z oblasti ľudských zdrojov a personálneho manažmentu',
      typeName: 'Odborný test',
      categoryName: 'Personalistika',
      questionCount: 20,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-eu-fondy',
      name: 'Eurofondy a EU legislatíva',
      description: 'Test z oblasti eurofondov a európskej legislatívy',
      typeName: 'Odborný test',
      categoryName: 'Európska únia',
      questionCount: 25,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 7,
      approved: true,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-gdpr',
      name: 'GDPR a ochrana údajov',
      description: 'Test z ochrany osobných údajov a GDPR',
      typeName: 'Odborný test',
      categoryName: 'Bezpečnosť',
      questionCount: 15,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: true,
      practiceEnabled: true,
    },
    {
      id: 'seed-test-kyberneticka-bezpecnost',
      name: 'Kybernetická bezpečnosť',
      description: 'Test z kybernetickej bezpečnosti a informačnej bezpečnosti',
      typeName: 'Odborný test',
      categoryName: 'Bezpečnosť',
      questionCount: 20,
      questionType: 'MULTIPLE_CHOICE' as const,
      difficulty: 7,
      approved: true,
      practiceEnabled: false,
    },
    // === SCHVÁLENÉ ALE NEAKTÍVNE TESTY (approved=true, practiceEnabled=false) ===
    {
      id: 'seed-test-true-false',
      name: 'Právne otázky - Pravda/Nepravda',
      description: 'Test s otázkami typu pravda/nepravda z právnej oblasti',
      typeName: 'Odborný test',
      categoryName: 'Právo a legislatíva',
      questionCount: 20,
      questionType: 'TRUE_FALSE' as const,
      difficulty: 4,
      approved: true,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-zmiesany',
      name: 'Komplexný test štátnej správy',
      description: 'Komplexný test kombinujúci rôzne oblasti štátnej správy',
      typeName: 'Všeobecný test',
      categoryName: 'Štátna správa',
      questionCount: 30,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 6,
      approved: true,
      practiceEnabled: false,
    },

    // === ROZPRACOVANÉ TESTY - ČAKAJÚ NA SCHVÁLENIE (approved=false) ===
    {
      id: 'seed-test-rozpracovany-ekonomia',
      name: 'Ekonomické základy - čaká na schválenie',
      description: 'Kompletný test z ekonomických základov, čaká na schválenie administrátorom',
      typeName: 'Odborný test',
      categoryName: 'Financie a účtovníctvo',
      questionCount: 20,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 4,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-rozpracovany-diplomacia',
      name: 'Diplomatický protokol - čaká na schválenie',
      description: 'Test z diplomatického protokolu pripravený na schválenie',
      typeName: 'Odborný test',
      categoryName: 'Komunikácia',
      questionCount: 18,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 6,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-rozpracovany-sprava',
      name: 'Správne konanie - v schvaľovacom procese',
      description: 'Test zo správneho konania odoslaný na schválenie',
      typeName: 'Odborný test',
      categoryName: 'Právo a legislatíva',
      questionCount: 15,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-rozpracovany-archiv',
      name: 'Archívnictvo a spisová služba - na schválenie',
      description: 'Test z archívnictva pripravený na review',
      typeName: 'Odborný test',
      categoryName: 'Štátna správa',
      questionCount: 12,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 3,
      approved: false,
      practiceEnabled: false,
    },

    // === NEDOKONČENÉ TESTY - DRAFT (approved=false, málo otázok) ===
    {
      id: 'seed-test-draft-it-siete',
      name: '[DRAFT] Počítačové siete',
      description: 'Rozpracovaný test - potrebné doplniť otázky',
      typeName: 'Test z práce s informačnými technológiami',
      categoryName: 'IT a digitálne zručnosti',
      questionCount: 5,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 6,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-draft-dane',
      name: '[DRAFT] Daňový systém SR',
      description: 'Začatý test - v príprave, potrebné doplniť ďalšie otázky',
      typeName: 'Odborný test',
      categoryName: 'Financie a účtovníctvo',
      questionCount: 8,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 7,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-draft-stavebny-zakon',
      name: '[DRAFT] Stavebný zákon - nový',
      description: 'Nový test v príprave - zatiaľ len pilotné otázky',
      typeName: 'Odborný test',
      categoryName: 'Právo a legislatíva',
      questionCount: 6,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-draft-francuzstina',
      name: '[DRAFT] Francúzsky jazyk B1',
      description: 'Začatý test francúzskeho jazyka - prebieha tvorba',
      typeName: 'Test z cudzieho jazyka',
      categoryName: 'Komunikácia',
      questionCount: 10,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 5,
      approved: false,
      practiceEnabled: false,
    },
    {
      id: 'seed-test-draft-ochrana-prirody',
      name: '[DRAFT] Ochrana prírody a krajiny',
      description: 'Rozpracovaný test - v počiatočnej fáze',
      typeName: 'Odborný test',
      categoryName: 'Bezpečnosť',
      questionCount: 4,
      questionType: 'SINGLE_CHOICE' as const,
      difficulty: 4,
      approved: false,
      practiceEnabled: false,
    },
  ]

  const createdTests: Record<string, string> = {}

  for (const test of testData) {
    const testType = testTypes.find((t) => t.name === test.typeName)
    if (!testType) {
      console.warn(`  ⚠️ Test type not found: ${test.typeName}`)
      continue
    }

    const condition = testType.conditions[0]

    const existingTest = await prisma.test.findUnique({ where: { id: test.id } })
    if (existingTest) {
      console.log(`  ⏭️ Test already exists: ${test.name}`)
      createdTests[test.id] = existingTest.id
      continue
    }

    const createdTest = await prisma.test.create({
      data: {
        id: test.id,
        name: test.name,
        description: test.description,
        testTypeId: testType.id,
        testTypeConditionId: condition?.id,
        categoryId: categories[test.categoryName],
        questions: generateQuestions(test.questionCount, test.name, test.questionType),
        allowedQuestionTypes: [test.questionType],
        recommendedQuestionCount: test.questionCount,
        recommendedDuration: Math.ceil(test.questionCount * 1.5),
        recommendedScore: 60,
        difficulty: test.difficulty,
        approved: test.approved,
        approvedAt: test.approved ? new Date() : null,
        practiceEnabled: test.practiceEnabled,
        authorId: admin.id,
      },
    })

    createdTests[test.id] = createdTest.id
    const status = test.approved ? (test.practiceEnabled ? 'SCHVÁLENÝ+AKTÍVNY' : 'SCHVÁLENÝ') : (test.questionCount < 10 ? 'DRAFT' : 'ROZPRACOVANÝ')
    console.log(`  ✅ Created test: ${test.name} [${status}] (${test.questionCount} otázok)`)
  }

  console.log(`\n✅ Created ${Object.keys(createdTests).length} tests`)

  // Create 20 VK
  console.log('\n📋 Creating 20 výberové konania...')

  const vkData = [
    {
      identifier: 'VK-2025-101',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo vnútra SR - Odbor IT',
      serviceField: 'Informatika',
      position: 'IT špecialista',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-it-zakladny', 'seed-test-vseobecny-zamestnanec'],
    },
    {
      identifier: 'VK-2025-102',
      selectionType: 'vnútorné',
      organizationalUnit: 'Ministerstvo financií SR',
      serviceField: 'Financie',
      position: 'Finančný analytik',
      serviceType: 'stála štátna služba',
      numberOfPositions: 1,
      status: VKStatus.TESTOVANIE,
      tests: ['seed-test-financie-zakladny', 'seed-test-vseobecny-zamestnanec'],
    },
    {
      identifier: 'VK-2025-103',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Úrad vlády SR',
      serviceField: 'Legislatíva',
      position: 'Právnik',
      serviceType: 'stála štátna služba',
      numberOfPositions: 3,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-pravo-zakladny', 'seed-test-slovensky-jazyk'],
    },
    {
      identifier: 'VK-2025-104',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo zahraničných vecí SR',
      serviceField: 'Diplomacia',
      position: 'Diplomat',
      serviceType: 'dočasná štátna služba',
      numberOfPositions: 2,
      status: VKStatus.CAKA_NA_TESTY,
      tests: ['seed-test-anglictina-b2', 'seed-test-vseobecny-veduci'],
    },
    {
      identifier: 'VK-2025-105',
      selectionType: 'vnútorné',
      organizationalUnit: 'Ministerstvo hospodárstva SR',
      serviceField: 'Ekonomika',
      position: 'Ekonóm',
      serviceType: 'stála štátna služba',
      numberOfPositions: 1,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-financie-uctovnictvo'],
    },
    {
      identifier: 'VK-2025-106',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo práce SR',
      serviceField: 'Personalistika',
      position: 'HR špecialista',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.TESTOVANIE,
      tests: ['seed-test-personalistika', 'seed-test-pravo-pracovne'],
    },
    {
      identifier: 'VK-2025-107',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Úrad pre verejné obstarávanie',
      serviceField: 'Verejné obstarávanie',
      position: 'Odborný referent VO',
      serviceType: 'stála štátna služba',
      numberOfPositions: 4,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-vo-zakladny', 'seed-test-vseobecny-zamestnanec'],
    },
    {
      identifier: 'VK-2025-108',
      selectionType: 'vnútorné',
      organizationalUnit: 'Úrad pre verejné obstarávanie',
      serviceField: 'Verejné obstarávanie',
      position: 'Vedúci oddelenia VO',
      serviceType: 'stála štátna služba',
      numberOfPositions: 1,
      status: VKStatus.HODNOTENIE,
      tests: ['seed-test-vo-pokrocily', 'seed-test-manazment', 'seed-test-vseobecny-veduci'],
    },
    {
      identifier: 'VK-2025-109',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo investícií SR',
      serviceField: 'Eurofondy',
      position: 'Projektový manažér',
      serviceType: 'dočasná štátna služba',
      numberOfPositions: 3,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-eu-fondy', 'seed-test-anglictina-b1'],
    },
    {
      identifier: 'VK-2025-110',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Národný bezpečnostný úrad',
      serviceField: 'Bezpečnosť',
      position: 'Bezpečnostný analytik',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.TESTOVANIE,
      tests: ['seed-test-kyberneticka-bezpecnost', 'seed-test-gdpr'],
    },
    {
      identifier: 'VK-2025-111',
      selectionType: 'vnútorné',
      organizationalUnit: 'Ministerstvo vnútra SR - Sekcia informatiky',
      serviceField: 'IT',
      position: 'Systémový administrátor',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-it-pokrocily', 'seed-test-kyberneticka-bezpecnost'],
    },
    {
      identifier: 'VK-2025-112',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo spravodlivosti SR',
      serviceField: 'Právo',
      position: 'Právny analytik',
      serviceType: 'stála štátna služba',
      numberOfPositions: 1,
      status: VKStatus.CAKA_NA_TESTY,
      tests: ['seed-test-pravo-zakladny', 'seed-test-true-false'],
    },
    {
      identifier: 'VK-2025-113',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Štatistický úrad SR',
      serviceField: 'Štatistika',
      position: 'Dátový analytik',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-it-zakladny', 'seed-test-financie-zakladny'],
    },
    {
      identifier: 'VK-2025-114',
      selectionType: 'vnútorné',
      organizationalUnit: 'Ministerstvo kultúry SR',
      serviceField: 'Kultúra',
      position: 'Kultúrny manažér',
      serviceType: 'dočasná štátna služba',
      numberOfPositions: 1,
      status: VKStatus.DOKONCENE,
      tests: ['seed-test-manazment', 'seed-test-vseobecny-veduci'],
    },
    {
      identifier: 'VK-2025-115',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo školstva SR',
      serviceField: 'Školstvo',
      position: 'Metodik',
      serviceType: 'stála štátna služba',
      numberOfPositions: 3,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-statna-sprava', 'seed-test-vseobecny-zamestnanec'],
    },
    {
      identifier: 'VK-2025-116',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo životného prostredia SR',
      serviceField: 'Životné prostredie',
      position: 'Environmentálny špecialista',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.TESTOVANIE,
      tests: ['seed-test-eu-fondy', 'seed-test-vseobecny-zamestnanec'],
    },
    {
      identifier: 'VK-2025-117',
      selectionType: 'vnútorné',
      organizationalUnit: 'Ministerstvo dopravy SR',
      serviceField: 'Doprava',
      position: 'Dopravný inžinier',
      serviceType: 'stála štátna služba',
      numberOfPositions: 1,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-zmiesany'],
    },
    {
      identifier: 'VK-2025-118',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Ministerstvo zdravotníctva SR',
      serviceField: 'Zdravotníctvo',
      position: 'Zdravotnícky analytik',
      serviceType: 'dočasná štátna služba',
      numberOfPositions: 2,
      status: VKStatus.ZRUSENE,
      tests: ['seed-test-statna-sprava'],
    },
    {
      identifier: 'VK-2025-119',
      selectionType: 'vonkajšie',
      organizationalUnit: 'Protimonopolný úrad SR',
      serviceField: 'Hospodárska súťaž',
      position: 'Analytik hospodárskej súťaže',
      serviceType: 'stála štátna služba',
      numberOfPositions: 2,
      status: VKStatus.PRIPRAVA,
      tests: ['seed-test-financie-zakladny', 'seed-test-pravo-zakladny'],
    },
    {
      identifier: 'VK-2025-120',
      selectionType: 'vnútorné',
      organizationalUnit: 'Úrad vlády SR - Sekcia informatizácie',
      serviceField: 'eGovernment',
      position: 'eGovernment špecialista',
      serviceType: 'stála štátna služba',
      numberOfPositions: 3,
      status: VKStatus.CAKA_NA_TESTY,
      tests: ['seed-test-it-pokrocily', 'seed-test-gdpr', 'seed-test-vseobecny-veduci'],
    },
  ]

  const createdVKs: { id: string; identifier: string }[] = []
  let vkIndex = 0

  for (const vk of vkData) {
    const existing = await prisma.vyberoveKonanie.findUnique({
      where: { identifier: vk.identifier },
    })

    if (existing) {
      console.log(`  ⏭️ VK already exists: ${vk.identifier}`)
      createdVKs.push({ id: existing.id, identifier: existing.identifier })
      continue
    }

    const gestorIndex = vkIndex % gestors.length
    const gestor = gestors[gestorIndex]

    const startDate = new Date('2025-02-01')
    startDate.setDate(startDate.getDate() + vkIndex * 7)

    const createdVK = await prisma.vyberoveKonanie.create({
      data: {
        identifier: vk.identifier,
        selectionType: vk.selectionType,
        organizationalUnit: vk.organizationalUnit,
        serviceField: vk.serviceField,
        position: vk.position,
        serviceType: vk.serviceType,
        startDateTime: startDate,
        numberOfPositions: vk.numberOfPositions,
        status: vk.status,
        gestorId: gestor?.id,
        createdById: admin.id,
      },
    })

    // Assign tests to VK
    for (let i = 0; i < vk.tests.length; i++) {
      const testId = createdTests[vk.tests[i]]
      if (testId) {
        await prisma.vKTest.create({
          data: {
            vkId: createdVK.id,
            testId,
            level: i + 1,
          },
        })
      }
    }

    createdVKs.push({ id: createdVK.id, identifier: createdVK.identifier })
    console.log(
      `  ✅ Created VK: ${vk.identifier} - ${vk.position} (${vk.status}, ${vk.tests.length} testov)`
    )
    vkIndex++
  }

  console.log(`\n✅ Created ${createdVKs.length} výberové konania`)

  // Create candidates for new VKs
  console.log('\n👥 Creating candidates for new VKs...')

  const candidatePassword = await bcrypt.hash('Kandidat123', 10)
  const candidateNames = [
    { name: 'Andrej', surname: 'Martinec' },
    { name: 'Barbora', surname: 'Sedláková' },
    { name: 'Cyril', surname: 'Ondrejka' },
    { name: 'Daniela', surname: 'Rajčanová' },
    { name: 'Erik', surname: 'Chovan' },
    { name: 'Frederika', surname: 'Blahová' },
    { name: 'Gabriel', surname: 'Ružička' },
    { name: 'Helena', surname: 'Mikulášová' },
    { name: 'Igor', surname: 'Záborský' },
    { name: 'Júlia', surname: 'Vavrová' },
    { name: 'Karol', surname: 'Šimek' },
    { name: 'Lenka', surname: 'Kučerová' },
    { name: 'Marcel', surname: 'Tomáš' },
    { name: 'Natália', surname: 'Pavelková' },
    { name: 'Oliver', surname: 'Hrušovský' },
    { name: 'Petra', surname: 'Lakatošová' },
    { name: 'Quido', surname: 'Jakubec' },
    { name: 'Renáta', surname: 'Dušková' },
    { name: 'Samuel', surname: 'Kováčik' },
    { name: 'Tatiana', surname: 'Bartoňová' },
  ]

  let candidateCount = 0

  for (const vk of createdVKs) {
    // Create 2-4 candidates per VK
    const numCandidates = 2 + (candidateCount % 3)

    for (let i = 1; i <= numCandidates; i++) {
      const cisIdentifier = `${vk.identifier}/${i}`
      const nameIndex = (candidateCount + i) % candidateNames.length
      const { name, surname } = candidateNames[nameIndex]

      const existing = await prisma.candidate.findUnique({
        where: { cisIdentifier },
      })

      if (existing) {
        continue
      }

      await prisma.candidate.create({
        data: {
          cisIdentifier,
          password: candidatePassword,
          name,
          surname,
          email: `${name.toLowerCase()}.${surname.toLowerCase()}@example.sk`,
          vkId: vk.id,
          active: true,
        },
      })
      candidateCount++
    }
  }

  console.log(`✅ Created ${candidateCount} candidates`)

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('📊 SÚHRN SEED DATA')
  console.log('═'.repeat(60))
  console.log(`✅ Test kategórie: ${Object.keys(categories).length}`)
  console.log(`✅ Testy: ${Object.keys(createdTests).length}`)
  console.log(`✅ Výberové konania: ${createdVKs.length}`)
  console.log(`✅ Kandidáti: ${candidateCount}`)
  console.log('═'.repeat(60))

  console.log('\n🎉 Seed completed!')
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
