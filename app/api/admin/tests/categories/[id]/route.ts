import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/tests/categories/:id - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Only SUPERADMIN can update categories
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, description } = body

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Názov kategórie je povinný' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existing = await prisma.testCategory.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Kategória nebola nájdená' },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current category)
    const duplicate = await prisma.testCategory.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: params.id }
      }
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Kategória s týmto názvom už existuje' },
        { status: 400 }
      )
    }

    // Update category
    const category = await prisma.testCategory.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        type: type || null,
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: { tests: true }
        }
      }
    })

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        description: category.description,
        testCount: category._count.tests,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating test category:', error)
    return NextResponse.json(
      { error: 'Failed to update test category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tests/categories/:id - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Only SUPERADMIN can delete categories
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if category exists and has tests
    const category = await prisma.testCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { tests: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategória nebola nájdená' },
        { status: 404 }
      )
    }

    // Cannot delete category with assigned tests
    if (category._count.tests > 0) {
      return NextResponse.json(
        { error: 'Kategóriu nemožno zmazať - obsahuje testy' },
        { status: 400 }
      )
    }

    // Delete category
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
