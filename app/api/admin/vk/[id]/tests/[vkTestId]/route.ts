import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/vk/[id]/tests/[vkTestId]
// Updates VKTest configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; vkTestId: string } }
) {
  try {
    const vkId = params.id
    const vkTestId = params.vkTestId
    const body = await request.json()

    const {
      questionCount,
      durationMinutes,
      scorePerQuestion,
      minScore,
      questionSelectionMode
    } = body

    // Check VKTest exists
    const existingVkTest = await prisma.vKTest.findUnique({
      where: { id: vkTestId },
      include: {
        test: {
          select: {
            questions: true
          }
        },
        vk: {
          select: {
            status: true
          }
        }
      }
    })

    if (!existingVkTest) {
      return NextResponse.json(
        { error: 'Test nenájdený' },
        { status: 404 }
      )
    }

    if (existingVkTest.vkId !== vkId) {
      return NextResponse.json(
        { error: 'Test nepatrí k tomuto VK' },
        { status: 400 }
      )
    }

    // Check VK status
    if (existingVkTest.vk.status !== 'PRIPRAVA') {
      return NextResponse.json(
        { error: 'Testy možno upravovať len ak VK je v stave PRIPRAVA' },
        { status: 400 }
      )
    }

    const questions = existingVkTest.test.questions as any[]
    const totalQuestions = questions.length

    // Build update data
    const updateData: any = {}

    if (questionCount !== undefined) {
      if (questionCount > totalQuestions) {
        return NextResponse.json(
          { error: `Počet otázok nemôže presiahnuť celkový počet otázok v teste (${totalQuestions})` },
          { status: 400 }
        )
      }
      if (questionCount < 1) {
        return NextResponse.json(
          { error: 'Počet otázok musí byť aspoň 1' },
          { status: 400 }
        )
      }
      updateData.questionCount = questionCount
    }

    if (durationMinutes !== undefined) {
      if (durationMinutes < 5 || durationMinutes > 60) {
        return NextResponse.json(
          { error: 'Trvanie musí byť medzi 5 a 60 minút' },
          { status: 400 }
        )
      }
      updateData.durationMinutes = durationMinutes
    }

    if (scorePerQuestion !== undefined) {
      if (scorePerQuestion !== 0.5 && scorePerQuestion !== 1) {
        return NextResponse.json(
          { error: 'Body za otázku musia byť 0.5 alebo 1' },
          { status: 400 }
        )
      }
      updateData.scorePerQuestion = scorePerQuestion
    }

    if (minScore !== undefined) {
      // Calculate max score with updated values
      const finalQuestionCount = questionCount !== undefined ? questionCount : existingVkTest.questionCount
      const finalScorePerQuestion = scorePerQuestion !== undefined ? scorePerQuestion : existingVkTest.scorePerQuestion
      const maxScore = finalQuestionCount * finalScorePerQuestion

      if (minScore > maxScore) {
        return NextResponse.json(
          { error: `Minimálne skóre (${minScore}) nemôže presiahnuť maximálne skóre (${maxScore})` },
          { status: 400 }
        )
      }
      if (minScore < 0) {
        return NextResponse.json(
          { error: 'Minimálne skóre nemôže byť záporné' },
          { status: 400 }
        )
      }
      updateData.minScore = minScore
    }

    if (questionSelectionMode !== undefined) {
      updateData.questionSelectionMode = questionSelectionMode
    }

    // Update VKTest
    const updatedVkTest = await prisma.vKTest.update({
      where: { id: vkTestId },
      data: updateData,
      include: {
        test: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      vkTest: {
        id: updatedVkTest.id,
        level: updatedVkTest.level,
        test: updatedVkTest.test,
        questionCount: updatedVkTest.questionCount,
        durationMinutes: updatedVkTest.durationMinutes,
        scorePerQuestion: updatedVkTest.scorePerQuestion,
        minScore: updatedVkTest.minScore,
        questionSelectionMode: updatedVkTest.questionSelectionMode
      }
    })
  } catch (error) {
    console.error('PATCH /api/admin/vk/[id]/tests/[vkTestId] error:', error)
    return NextResponse.json(
      { error: 'Chyba pri úprave testu' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/vk/[id]/tests/[vkTestId]
// Removes test from VK
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; vkTestId: string } }
) {
  try {
    const vkId = params.id
    const vkTestId = params.vkTestId

    // Check VKTest exists
    const existingVkTest = await prisma.vKTest.findUnique({
      where: { id: vkTestId },
      include: {
        vk: {
          select: {
            status: true
          }
        }
      }
    })

    if (!existingVkTest) {
      return NextResponse.json(
        { error: 'Test nenájdený' },
        { status: 404 }
      )
    }

    if (existingVkTest.vkId !== vkId) {
      return NextResponse.json(
        { error: 'Test nepatrí k tomuto VK' },
        { status: 400 }
      )
    }

    // Check VK status
    if (existingVkTest.vk.status !== 'PRIPRAVA') {
      return NextResponse.json(
        { error: 'Testy možno odstrániť len ak VK je v stave PRIPRAVA' },
        { status: 400 }
      )
    }

    // Delete VKTest
    await prisma.vKTest.delete({
      where: { id: vkTestId }
    })

    return NextResponse.json({
      success: true,
      message: 'Test bol odstránený'
    })
  } catch (error) {
    console.error('DELETE /api/admin/vk/[id]/tests/[vkTestId] error:', error)
    return NextResponse.json(
      { error: 'Chyba pri odstraňovaní testu' },
      { status: 500 }
    )
  }
}
