/**
 * Seed pre kompletne ukončené výberové konanie
 *
 * Tento seed vytvára VK v stave DOKONCENE s:
 * - Priradenou komisiou vrátane predsedu
 * - 5 uchádzačmi s rôznymi výsledkami
 * - Vyplnenými testami (TestSession + TestResult)
 * - Vyplnenou ústnou časťou (EvaluationConfig + Evaluation)
 * - Správne nastavenými stavmi
 *
 * Použitie:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-completed-vk.ts
 *
 * Alebo cez npm script (pridať do package.json):
 *   "seed:completed-vk": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed-completed-vk.ts"
 */

import { UserRole, VKStatus, SessionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Identifikátor pre ukončené VK
const VK_IDENTIFIER = 'VK-2025-COMPLETED'

// Vlastnosti na hodnotenie v ústnej časti
const EVALUATED_TRAITS = [
  'Odborné znalosti',
  'Komunikačné schopnosti',
  'Analytické myslenie',
  'Schopnosť riešiť problémy',
  'Motivácia a záujem',
  'Tímová spolupráca',
]

// Batéria otázok pre ústny pohovor
const QUESTION_BATTERY = {
  categories: [
    {
      name: 'Odborné znalosti',
      questions: [
        'Popíšte svoju skúsenosť v oblasti verejného obstarávania.',
        'Ako by ste riešili situáciu, keď dodávateľ nedodržiava podmienky zmluvy?',
        'Aké sú hlavné princípy verejného obstarávania podľa zákona?',
      ],
    },
    {
      name: 'Komunikácia',
      questions: [
        'Ako komunikujete s náročnými klientmi alebo kolegami?',
        'Popíšte situáciu, keď ste museli prezentovať komplexný problém.',
        'Ako riešite konflikty v tíme?',
      ],
    },
    {
      name: 'Motivácia',
      questions: [
        'Prečo ste sa rozhodli uchádzať o túto pozíciu?',
        'Kde sa vidíte o 5 rokov?',
        'Čo vás najviac motivuje v práci?',
      ],
    },
  ],
}

// Generovanie testových otázok
function generateQuestions(count: number, topic: string) {
  const questions = []
  for (let i = 1; i <= count; i++) {
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
  return questions
}

// Generovanie odpovedí uchádzača (s určitou úspešnosťou)
function generateAnswers(
  questions: Array<{ order: number; answers: Array<{ letter: string; isCorrect: boolean }> }>,
  successRate: number
) {
  const answers: Record<string, string> = {}
  questions.forEach((q) => {
    const isCorrect = Math.random() < successRate
    if (isCorrect) {
      const correctAnswer = q.answers.find((a) => a.isCorrect)
      answers[q.order.toString()] = correctAnswer?.letter || 'A'
    } else {
      const wrongAnswers = q.answers.filter((a) => !a.isCorrect)
      const randomWrong = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]
      answers[q.order.toString()] = randomWrong?.letter || 'B'
    }
  })
  return answers
}

// Výpočet skóre na základe odpovedí
function calculateScore(
  questions: Array<{ order: number; points: number; answers: Array<{ letter: string; isCorrect: boolean }> }>,
  answers: Record<string, string>
) {
  let score = 0
  let maxScore = 0

  questions.forEach((q) => {
    maxScore += q.points
    const selectedAnswer = answers[q.order.toString()]
    const correctAnswer = q.answers.find((a) => a.isCorrect)
    if (selectedAnswer === correctAnswer?.letter) {
      score += q.points
    }
  })

  return { score, maxScore, successRate: maxScore > 0 ? (score / maxScore) * 100 : 0 }
}

// Generovanie hodnotenia ústnej časti
function generateOralEvaluation(successLevel: 'excellent' | 'good' | 'average' | 'poor') {
  const scoreRanges = {
    excellent: { min: 8, max: 10 },
    good: { min: 6, max: 8 },
    average: { min: 4, max: 6 },
    poor: { min: 1, max: 4 },
  }

  const range = scoreRanges[successLevel]
  const evaluation: Record<string, number> = {}
  let totalScore = 0
  const maxScorePerTrait = 10

  EVALUATED_TRAITS.forEach((trait) => {
    const score = range.min + Math.random() * (range.max - range.min)
    const roundedScore = Math.round(score * 10) / 10
    evaluation[trait] = roundedScore
    totalScore += roundedScore
  })

  const maxScore = EVALUATED_TRAITS.length * maxScorePerTrait

  return {
    evaluation,
    totalScore: Math.round(totalScore * 10) / 10,
    maxScore,
    successRate: Math.round((totalScore / maxScore) * 100 * 10) / 10,
  }
}

async function main() {
  console.log('🌱 Seeding completed VK (výberové konanie)...\n')

  // 1. Získanie potrebných používateľov
  console.log('📋 Získavam existujúcich používateľov...')

  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  })

  if (!admin) {
    console.error('❌ Nenašiel sa admin používateľ. Spustite najprv hlavný seed.')
    process.exit(1)
  }

  const gestor = await prisma.user.findFirst({
    where: { role: UserRole.GESTOR },
  })

  // Získame členov komisie
  const komisiaMembers = await prisma.user.findMany({
    where: { role: UserRole.KOMISIA },
    take: 4,
  })

  if (komisiaMembers.length < 3) {
    console.error('❌ Potrebujeme aspoň 3 členov komisie. Spustite najprv hlavný seed.')
    process.exit(1)
  }

  console.log(`  ✅ Admin: ${admin.email}`)
  console.log(`  ✅ Gestor: ${gestor?.email || 'neurčený'}`)
  console.log(`  ✅ Členovia komisie: ${komisiaMembers.length}`)

  // 2. Získanie test type
  const testType = await prisma.testType.findFirst({
    where: { name: { contains: 'Odborný' } },
    include: { conditions: true },
  })

  if (!testType) {
    console.error('❌ Nenašiel sa typ testu. Spustite najprv hlavný seed.')
    process.exit(1)
  }

  // 3. Vytvorenie/aktualizácia VK
  console.log('\n📋 Vytváram výberové konanie...')

  // Najprv vymazať existujúce dáta ak existujú
  const existingVK = await prisma.vyberoveKonanie.findUnique({
    where: { identifier: VK_IDENTIFIER },
    include: {
      candidates: true,
      commission: { include: { members: true } },
    },
  })

  if (existingVK) {
    console.log('  🗑️ Mažem existujúce VK a súvisiace dáta...')

    // Vymazať evaluations
    await prisma.evaluation.deleteMany({
      where: { candidate: { vkId: existingVK.id } },
    })

    // Vymazať test sessions
    await prisma.testSession.deleteMany({
      where: { candidate: { vkId: existingVK.id } },
    })

    // Vymazať test results
    await prisma.testResult.deleteMany({
      where: { candidate: { vkId: existingVK.id } },
    })

    // Vymazať evaluation config
    await prisma.evaluationConfig.deleteMany({
      where: { vkId: existingVK.id },
    })

    // Vymazať commission members a commission
    if (existingVK.commission) {
      await prisma.commissionMember.deleteMany({
        where: { commissionId: existingVK.commission.id },
      })
      await prisma.commission.delete({
        where: { id: existingVK.commission.id },
      })
    }

    // Vymazať VK tests
    await prisma.vKTest.deleteMany({
      where: { vkId: existingVK.id },
    })

    // Vymazať candidates
    await prisma.candidate.deleteMany({
      where: { vkId: existingVK.id },
    })

    // Vymazať VK
    await prisma.vyberoveKonanie.delete({
      where: { id: existingVK.id },
    })
  }

  // Vymazať staré testy pre toto VK
  await prisma.test.deleteMany({
    where: { id: { startsWith: 'completed-vk-test-' } },
  })

  // Vytvorenie nového VK
  const vk = await prisma.vyberoveKonanie.create({
    data: {
      identifier: VK_IDENTIFIER,
      selectionType: 'vonkajšie',
      organizationalUnit: 'Úrad pre verejné obstarávanie - Odbor kontroly',
      serviceField: 'Verejné obstarávanie',
      position: 'Hlavný štátny radca - špecialista na verejné obstarávanie',
      serviceType: 'stála štátna služba',
      startDateTime: new Date('2024-12-01T09:00:00'),
      numberOfPositions: 2,
      status: VKStatus.DOKONCENE,
      gestorId: gestor?.id,
      createdById: admin.id,
    },
  })

  console.log(`  ✅ VK vytvorené: ${vk.identifier} (${vk.status})`)

  // 4. Vytvorenie testov pre VK
  console.log('\n📝 Vytváram testy...')

  const test1Questions = generateQuestions(15, 'Verejné obstarávanie - Základy')
  const test1 = await prisma.test.create({
    data: {
      id: 'completed-vk-test-1',
      name: 'Verejné obstarávanie - Základy zákonov',
      description: 'Test základných znalostí zo zákona o verejnom obstarávaní',
      testTypeId: testType.id,
      testTypeConditionId: testType.conditions[0]?.id,
      questions: test1Questions,
      allowedQuestionTypes: ['SINGLE_CHOICE'],
      recommendedQuestionCount: 15,
      recommendedDuration: 20,
      recommendedScore: 60,
      difficulty: 4,
      approved: true,
      approvedAt: new Date('2024-11-15'),
      practiceEnabled: false,
      authorId: admin.id,
    },
  })

  const test2Questions = generateQuestions(20, 'Verejné obstarávanie - Postupy')
  const test2 = await prisma.test.create({
    data: {
      id: 'completed-vk-test-2',
      name: 'Verejné obstarávanie - Postupy a procesy',
      description: 'Pokročilý test z postupov verejného obstarávania',
      testTypeId: testType.id,
      testTypeConditionId: testType.conditions[0]?.id,
      questions: test2Questions,
      allowedQuestionTypes: ['SINGLE_CHOICE'],
      recommendedQuestionCount: 20,
      recommendedDuration: 30,
      recommendedScore: 65,
      difficulty: 6,
      approved: true,
      approvedAt: new Date('2024-11-15'),
      practiceEnabled: false,
      authorId: admin.id,
    },
  })

  console.log(`  ✅ Test 1: ${test1.name} (${test1Questions.length} otázok)`)
  console.log(`  ✅ Test 2: ${test2.name} (${test2Questions.length} otázok)`)

  // Priradenie testov k VK
  const vkTest1 = await prisma.vKTest.create({
    data: {
      vkId: vk.id,
      testId: test1.id,
      level: 1,
      questionCount: 15,
      durationMinutes: 20,
      minScore: 60,
    },
  })

  const vkTest2 = await prisma.vKTest.create({
    data: {
      vkId: vk.id,
      testId: test2.id,
      level: 2,
      questionCount: 20,
      durationMinutes: 30,
      minScore: 65,
    },
  })

  console.log('  ✅ Testy priradené k VK')

  // 5. Vytvorenie komisie
  console.log('\n👥 Vytváram komisiu...')

  const chairman = komisiaMembers[0]
  const commission = await prisma.commission.create({
    data: {
      vkId: vk.id,
      chairmanId: chairman.id,
    },
  })

  // Pridanie členov komisie
  const commissionMemberRecords = []
  for (let i = 0; i < komisiaMembers.length; i++) {
    const member = await prisma.commissionMember.create({
      data: {
        commissionId: commission.id,
        userId: komisiaMembers[i].id,
        isChairman: i === 0,
      },
    })
    commissionMemberRecords.push(member)
    console.log(`  ✅ ${i === 0 ? 'Predseda' : 'Člen'}: ${komisiaMembers[i].name} ${komisiaMembers[i].surname}`)
  }

  // 6. Vytvorenie uchádzačov
  console.log('\n👤 Vytváram uchádzačov...')

  const candidatePassword = await bcrypt.hash('Kandidat123', 10)

  const candidatesData = [
    {
      name: 'Ján',
      surname: 'Výborný',
      email: 'jan.vyborny@example.sk',
      testSuccessRate: 0.9,
      oralLevel: 'excellent' as const,
    },
    {
      name: 'Mária',
      surname: 'Šikovná',
      email: 'maria.sikovna@example.sk',
      testSuccessRate: 0.85,
      oralLevel: 'good' as const,
    },
    {
      name: 'Peter',
      surname: 'Priemerný',
      email: 'peter.priemerny@example.sk',
      testSuccessRate: 0.65,
      oralLevel: 'average' as const,
    },
    {
      name: 'Anna',
      surname: 'Dobrá',
      email: 'anna.dobra@example.sk',
      testSuccessRate: 0.75,
      oralLevel: 'good' as const,
    },
    {
      name: 'Martin',
      surname: 'Slabší',
      email: 'martin.slabsi@example.sk',
      testSuccessRate: 0.45,
      oralLevel: 'poor' as const,
    },
  ]

  const createdCandidates = []

  for (let i = 0; i < candidatesData.length; i++) {
    const data = candidatesData[i]
    const candidate = await prisma.candidate.create({
      data: {
        cisIdentifier: `${VK_IDENTIFIER}/${i + 1}`,
        password: candidatePassword,
        name: data.name,
        surname: data.surname,
        email: data.email,
        birthDate: new Date(1985 + i * 3, i, 15),
        phone: `+421 9${i}0 ${100 + i * 111} ${200 + i * 111}`,
        vkId: vk.id,
        active: true,
        registeredAt: new Date('2024-11-20'),
        lastLoginAt: new Date('2024-12-10'),
      },
    })

    createdCandidates.push({ candidate, data })
    console.log(`  ✅ ${data.name} ${data.surname} (${candidate.cisIdentifier})`)
  }

  // 7. Vytvorenie TestSession a TestResult pre každého uchádzača
  console.log('\n📊 Vytváram výsledky testov...')

  for (const { candidate, data } of createdCandidates) {
    // Test 1
    const answers1 = generateAnswers(test1Questions as any, data.testSuccessRate)
    const score1 = calculateScore(test1Questions as any, answers1)

    const startedAt1 = new Date('2024-12-01T09:05:00')
    const completedAt1 = new Date('2024-12-01T09:22:00')
    const durationSeconds1 = Math.floor((completedAt1.getTime() - startedAt1.getTime()) / 1000)

    await prisma.testSession.create({
      data: {
        candidateId: candidate.id,
        vkTestId: vkTest1.id,
        testId: test1.id,
        status: SessionStatus.COMPLETED,
        answers: answers1,
        startedAt: startedAt1,
        completedAt: completedAt1,
        serverStartTime: startedAt1,
        durationSeconds: durationSeconds1,
        score: score1.score,
        maxScore: score1.maxScore,
        passed: score1.successRate >= 60,
      },
    })

    await prisma.testResult.create({
      data: {
        candidateId: candidate.id,
        testId: test1.id,
        userId: admin.id,
        answers: Object.entries(answers1).map(([questionOrder, answer]) => ({
          questionOrder: parseInt(questionOrder),
          selectedAnswer: answer,
        })),
        score: score1.score,
        maxScore: score1.maxScore,
        successRate: score1.successRate,
        passed: score1.successRate >= 60,
        startedAt: startedAt1,
        completedAt: completedAt1,
        durationSeconds: durationSeconds1,
      },
    })

    // Test 2
    const answers2 = generateAnswers(test2Questions as any, data.testSuccessRate)
    const score2 = calculateScore(test2Questions as any, answers2)

    const startedAt2 = new Date('2024-12-01T09:35:00')
    const completedAt2 = new Date('2024-12-01T10:02:00')
    const durationSeconds2 = Math.floor((completedAt2.getTime() - startedAt2.getTime()) / 1000)

    await prisma.testSession.create({
      data: {
        candidateId: candidate.id,
        vkTestId: vkTest2.id,
        testId: test2.id,
        status: SessionStatus.COMPLETED,
        answers: answers2,
        startedAt: startedAt2,
        completedAt: completedAt2,
        serverStartTime: startedAt2,
        durationSeconds: durationSeconds2,
        score: score2.score,
        maxScore: score2.maxScore,
        passed: score2.successRate >= 65,
      },
    })

    await prisma.testResult.create({
      data: {
        candidateId: candidate.id,
        testId: test2.id,
        userId: admin.id,
        answers: Object.entries(answers2).map(([questionOrder, answer]) => ({
          questionOrder: parseInt(questionOrder),
          selectedAnswer: answer,
        })),
        score: score2.score,
        maxScore: score2.maxScore,
        successRate: score2.successRate,
        passed: score2.successRate >= 65,
        startedAt: startedAt2,
        completedAt: completedAt2,
        durationSeconds: durationSeconds2,
      },
    })

    const totalTestScore = score1.score + score2.score
    const totalTestMax = score1.maxScore + score2.maxScore
    const avgSuccessRate = ((score1.successRate + score2.successRate) / 2).toFixed(1)

    console.log(
      `  ✅ ${data.name} ${data.surname}: Test1=${score1.score}/${score1.maxScore} (${score1.successRate.toFixed(0)}%), ` +
        `Test2=${score2.score}/${score2.maxScore} (${score2.successRate.toFixed(0)}%), ` +
        `Celkom=${totalTestScore}/${totalTestMax} (${avgSuccessRate}%)`
    )
  }

  // 8. Vytvorenie EvaluationConfig pre ústnu časť
  console.log('\n📋 Vytváram konfiguráciu ústnej časti...')

  await prisma.evaluationConfig.create({
    data: {
      vkId: vk.id,
      evaluatedTraits: EVALUATED_TRAITS,
      questionBattery: QUESTION_BATTERY,
    },
  })

  console.log(`  ✅ EvaluationConfig vytvorený (${EVALUATED_TRAITS.length} vlastností na hodnotenie)`)

  // 9. Vytvorenie Evaluation - ústne hodnotenie od každého člena komisie
  console.log('\n🎤 Vytváram hodnotenia ústnej časti...')

  for (const { candidate, data } of createdCandidates) {
    console.log(`  👤 ${data.name} ${data.surname}:`)

    for (const memberRecord of commissionMemberRecords) {
      const user = komisiaMembers.find((u) => u.id === memberRecord.userId)!
      const evalData = generateOralEvaluation(data.oralLevel)

      await prisma.evaluation.create({
        data: {
          candidateId: candidate.id,
          memberId: memberRecord.id,
          userId: user.id,
          evaluation: evalData.evaluation,
          totalScore: evalData.totalScore,
          maxScore: evalData.maxScore,
          successRate: evalData.successRate,
          finalized: true,
          finalizedAt: new Date('2024-12-05T16:00:00'),
        },
      })

      console.log(
        `    ✅ ${memberRecord.isChairman ? '👑' : '  '} ${user.name} ${user.surname}: ` +
          `${evalData.totalScore}/${evalData.maxScore} (${evalData.successRate}%)`
      )
    }
  }

  // 10. Súhrn
  console.log('\n' + '═'.repeat(70))
  console.log('📊 SÚHRN KOMPLETNÉHO VÝBEROVÉHO KONANIA')
  console.log('═'.repeat(70))
  console.log(`\n🏷️  Identifikátor: ${VK_IDENTIFIER}`)
  console.log(`📌 Pozícia: ${vk.position}`)
  console.log(`🏢 Organizačná jednotka: ${vk.organizationalUnit}`)
  console.log(`📋 Status: ${vk.status}`)
  console.log(`👥 Počet miest: ${vk.numberOfPositions}`)
  console.log(`\n📝 Testy: 2`)
  console.log(`   • ${test1.name} (${test1Questions.length} otázok)`)
  console.log(`   • ${test2.name} (${test2Questions.length} otázok)`)
  console.log(`\n👔 Komisia: ${commissionMemberRecords.length} členov`)
  for (let i = 0; i < komisiaMembers.length; i++) {
    const m = komisiaMembers[i]
    console.log(`   ${i === 0 ? '👑' : '• '} ${m.name} ${m.surname}${i === 0 ? ' (predseda)' : ''}`)
  }
  console.log(`\n👤 Uchádzači: ${createdCandidates.length}`)
  for (const { candidate, data } of createdCandidates) {
    console.log(`   • ${candidate.cisIdentifier}: ${data.name} ${data.surname}`)
  }

  console.log('\n═'.repeat(70))
  console.log('🎉 Seed pre ukončené VK bol úspešne dokončený!')
  console.log('═'.repeat(70))

  console.log('\n📋 Prihlasovacie údaje uchádzačov:')
  console.log('━'.repeat(50))
  for (const { candidate } of createdCandidates) {
    console.log(`  ${candidate.cisIdentifier} / Kandidat123`)
  }
  console.log('━'.repeat(50))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed zlyhal:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
