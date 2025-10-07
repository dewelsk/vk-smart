import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTestCategorySchema = z.object({
  name: z.string().min(1, 'Názov je povinný').optional(),
  typeId: z.string().min(1, 'Typ testu je povinný').optional(),
  description: z.string().nullable().optional(),
})

// GET /api/admin/test-categories/[id] - Get single test category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const testCategory = await prisma.testCategory.findUnique({
      where: { id: params.id },
      include: {
        type: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            tests: true
          }
        }
      }
    })

    if (!testCategory) {
      return NextResponse.json(
        { error: 'Kategória testu nebola nájdená' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: testCategory.id,
      name: testCategory.name,
      description: testCategory.description,
      typeId: testCategory.typeId,
      type: testCategory.type,
      testCount: testCategory._count.tests,
      createdAt: testCategory.createdAt,
      updatedAt: testCategory.updatedAt
    })
  } catch (error) {
    console.error('Error fetching test category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test category' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/test-categories/[id] - Update test category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - only SUPERADMIN and ADMIN can update test categories
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = updateTestCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, typeId, description } = validationResult.data

    // Check if test category exists
    const existing = await prisma.testCategory.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategória testu nebola nájdená' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with another test category
    if (name && name !== existing.name) {
      const nameConflict = await prisma.testCategory.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Kategória testu s týmto názvom už existuje' },
          { status: 400 }
        )
      }
    }

    // If typeId provided, verify it exists
    if (typeId !== undefined) {
      const typeExists = await prisma.testType.findUnique({
        where: { id: typeId }
      })

      if (!typeExists) {
        return NextResponse.json(
          { error: 'Zvolený typ testu neexistuje' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (typeId !== undefined) updateData.typeId = typeId
    if (description !== undefined) updateData.description = description

    // Update test category
    const testCategory = await prisma.testCategory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        type: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(testCategory)
  } catch (error) {
    console.error('Error updating test category:', error)
    return NextResponse.json(
      { error: 'Failed to update test category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/test-categories/[id] - Delete test category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - only SUPERADMIN and ADMIN can delete test categories
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if test category exists
    const existing = await prisma.testCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tests: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategória testu nebola nájdená' },
        { status: 404 }
      )
    }

    // Prevent deletion if test category has associated tests
    if (existing._count.tests > 0) {
      return NextResponse.json(
        { error: `Túto kategóriu nemožno vymazať, pretože je priradená k ${existing._count.tests} testom` },
        { status: 400 }
      )
    }

    // Delete test category
    await prisma.testCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test category:', error)
    return NextResponse.json(
      { error: 'Failed to delete test category' },
      { status: 500 }
    )
  }
}
