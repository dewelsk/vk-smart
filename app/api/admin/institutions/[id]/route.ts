import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateInstitutionSchema = z.object({
  name: z.string().min(1, 'Názov je povinný').optional(),
  code: z.string().min(1, 'Kód je povinný').optional(),
  description: z.string().nullish(),
  active: z.boolean().optional(),
  allowedQuestionTypes: z.array(z.enum([
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'OPEN_ENDED'
  ])).min(1, 'Aspoň jeden typ otázky musí byť vybraný').optional(),
})

// GET /api/admin/institutions/[id] - Get institution detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const institutionId = params.id

    // Get institution
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                role: true,
              }
            }
          }
        }
      }
    })

    if (!institution) {
      return NextResponse.json({ error: 'Inštitúcia nenájdená' }, { status: 404 })
    }

    // ADMIN can only view institutions they belong to
    if (session.user.role === 'ADMIN') {
      const userInstitutions = await prisma.userInstitution.findMany({
        where: {
          userId: session.user.id
        },
        select: {
          institutionId: true
        }
      })

      const userInstitutionIds = userInstitutions.map(ui => ui.institutionId)

      if (!userInstitutionIds.includes(institutionId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json({ institution })
  } catch (error) {
    console.error('GET /api/admin/institutions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch institution' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/institutions/[id] - Update institution
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const institutionId = params.id

    // Check if institution exists
    const existingInstitution = await prisma.institution.findUnique({
      where: { id: institutionId }
    })

    if (!existingInstitution) {
      return NextResponse.json({ error: 'Inštitúcia nenájdená' }, { status: 404 })
    }

    // ADMIN can only update institutions they belong to
    if (session.user.role === 'ADMIN') {
      const userInstitutions = await prisma.userInstitution.findMany({
        where: {
          userId: session.user.id
        },
        select: {
          institutionId: true
        }
      })

      const userInstitutionIds = userInstitutions.map(ui => ui.institutionId)

      if (!userInstitutionIds.includes(institutionId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Validate input
    const validationResult = updateInstitutionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // If updating code, check for duplicates
    if (data.code && data.code !== existingInstitution.code) {
      const duplicateCode = await prisma.institution.findUnique({
        where: { code: data.code }
      })

      if (duplicateCode) {
        return NextResponse.json(
          { error: 'Inštitúcia s týmto kódom už existuje' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.code !== undefined) updateData.code = data.code
    if (data.description !== undefined) updateData.description = data.description
    if (data.active !== undefined) updateData.active = data.active
    if (data.allowedQuestionTypes !== undefined) {
      updateData.allowedQuestionTypes = data.allowedQuestionTypes
    }

    // Update institution
    const updatedInstitution = await prisma.institution.update({
      where: { id: institutionId },
      data: updateData,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                role: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ institution: updatedInstitution })
  } catch (error) {
    console.error('PUT /api/admin/institutions/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update institution' },
      { status: 500 }
    )
  }
}
