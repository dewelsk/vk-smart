import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTestTypeSchema = z.object({
  name: z.string().min(1, 'Názov je povinný').optional(),
  description: z.string().optional(),
})

// GET /api/admin/test-types/[id] - Get single test type
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

    const testType = await prisma.testType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            categories: true
          }
        }
      }
    })

    if (!testType) {
      return NextResponse.json(
        { error: 'Typ testu nebol nájdený' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: testType.id,
      name: testType.name,
      description: testType.description,
      categoryCount: testType._count.categories,
      createdAt: testType.createdAt,
      updatedAt: testType.updatedAt
    })
  } catch (error) {
    console.error('Error fetching test type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test type' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/test-types/[id] - Update test type
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - only SUPERADMIN and ADMIN can update test types
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = updateTestTypeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, description } = validationResult.data

    // Check if test type exists
    const existing = await prisma.testType.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Typ testu nebol nájdený' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with another test type
    if (name && name !== existing.name) {
      const nameConflict = await prisma.testType.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Typ testu s týmto názvom už existuje' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null

    // Update test type
    const testType = await prisma.testType.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(testType)
  } catch (error) {
    console.error('Error updating test type:', error)
    return NextResponse.json(
      { error: 'Failed to update test type' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/test-types/[id] - Delete test type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - only SUPERADMIN and ADMIN can delete test types
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if test type exists
    const existing = await prisma.testType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            categories: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Typ testu nebol nájdený' },
        { status: 404 }
      )
    }

    // Prevent deletion if test type has associated categories
    if (existing._count.categories > 0) {
      return NextResponse.json(
        { error: `Tento typ testu nemožno vymazať, pretože je priradený k ${existing._count.categories} kategóriám` },
        { status: 400 }
      )
    }

    // Delete test type
    await prisma.testType.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test type:', error)
    return NextResponse.json(
      { error: 'Failed to delete test type' },
      { status: 500 }
    )
  }
}
