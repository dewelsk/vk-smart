import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/vk/[id]/tests
// Returns all tests assigned to VK
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vkId = params.id

    // Get VK info
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      select: {
        id: true,
        identifier: true,
        status: true,
        position: true
      }
    })

    if (!vk) {
      return NextResponse.json(
        { error: 'VK nenájdené' },
        { status: 404 }
      )
    }

    // Get assigned tests
    const assignedTests = await prisma.vKTest.findMany({
      where: { vkId },
      orderBy: { level: 'asc' },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            type: true,
            questions: true,
            recommendedQuestionCount: true,
            recommendedDuration: true,
            recommendedScore: true
          }
        }
      }
    })

    const assignedTestsData = assignedTests.map(vkTest => {
      const questions = vkTest.test.questions as any[]
      const totalQuestions = questions.length
      const questionCount = vkTest.test.recommendedQuestionCount || totalQuestions
      const durationMinutes = vkTest.test.recommendedDuration || 30
      const scorePerQuestion = 1
      const minScore = vkTest.test.recommendedScore || (questionCount * scorePerQuestion * 0.6)

      return {
        id: vkTest.id,
        level: vkTest.level,
        test: {
          id: vkTest.test.id,
          name: vkTest.test.name,
          type: vkTest.test.type,
          totalQuestions
        },
        questionCount,
        durationMinutes,
        scorePerQuestion,
        minScore,
        questionSelectionMode: 'RANDOM'
      }
    })

    return NextResponse.json({
      vk,
      assignedTests: assignedTestsData
    })
  } catch (error) {
    console.error('GET /api/admin/vk/[id]/tests error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní testov' },
      { status: 500 }
    )
  }
}

// POST /api/admin/vk/[id]/tests
// Assigns a test to VK (uses test's fixed configuration)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vkId = params.id
    const body = await request.json()

    const { testId } = body

    // Validation
    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    // Check VK exists and is in PRIPRAVA status
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId }
    })

    if (!vk) {
      return NextResponse.json(
        { error: 'VK nenájdené' },
        { status: 404 }
      )
    }

    if (vk.status !== 'PRIPRAVA') {
      return NextResponse.json(
        { error: 'Testy možno pridávať len ak VK je v stave PRIPRAVA' },
        { status: 400 }
      )
    }

    // Check test exists and is approved
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        name: true,
        type: true,
        approved: true,
        questions: true,
        recommendedQuestionCount: true,
        recommendedDuration: true,
        recommendedScore: true
      }
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test nenájdený' },
        { status: 404 }
      )
    }

    if (!test.approved) {
      return NextResponse.json(
        { error: 'Test musí byť schválený' },
        { status: 400 }
      )
    }

    // Calculate next level automatically
    const existingTests = await prisma.vKTest.findMany({
      where: { vkId },
      orderBy: { level: 'desc' },
      take: 1
    })

    const nextLevel = existingTests.length > 0 ? existingTests[0].level + 1 : 1

    // Create VKTest with auto-calculated level
    // Configuration is read from Test model, not stored in VKTest
    const vkTest = await prisma.vKTest.create({
      data: {
        vkId,
        testId,
        level: nextLevel
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            type: true,
            questions: true,
            recommendedQuestionCount: true,
            recommendedDuration: true,
            recommendedScore: true
          }
        }
      }
    })

    // Calculate configuration from test
    const questions = vkTest.test.questions as any[]
    const totalQuestions = questions.length
    const questionCount = vkTest.test.recommendedQuestionCount || totalQuestions
    const durationMinutes = vkTest.test.recommendedDuration || 30
    const scorePerQuestion = 1
    const minScore = vkTest.test.recommendedScore || (questionCount * scorePerQuestion * 0.6)

    return NextResponse.json({
      success: true,
      vkTest: {
        id: vkTest.id,
        level: vkTest.level,
        test: {
          id: vkTest.test.id,
          name: vkTest.test.name,
          type: vkTest.test.type,
          totalQuestions
        },
        questionCount,
        durationMinutes,
        scorePerQuestion,
        minScore,
        questionSelectionMode: 'RANDOM'
      }
    })
  } catch (error) {
    console.error('POST /api/admin/vk/[id]/tests error:', error)
    return NextResponse.json(
      { error: 'Chyba pri pridávaní testu' },
      { status: 500 }
    )
  }
}
