import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vkIdentifier, cisIdentifier, password } = body

    // Validation
    if (!vkIdentifier || !cisIdentifier || !password) {
      return NextResponse.json(
        { error: 'Všetky polia sú povinné' },
        { status: 400 }
      )
    }

    // 1. Find VyberoveKonanie by identifier
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { identifier: vkIdentifier }
    })

    if (!vk) {
      return NextResponse.json(
        { error: 'Výberové konanie s týmto identifikátorom neexistuje' },
        { status: 404 }
      )
    }

    // 2. Check VK status
    if (vk.status === 'DOKONCENE' || vk.status === 'ZRUSENE') {
      return NextResponse.json(
        { error: 'Toto výberové konanie už bolo ukončené' },
        { status: 400 }
      )
    }

    // 3. Find Candidate in this VK by CIS identifier
    const candidate = await prisma.candidate.findUnique({
      where: {
        vkId_cisIdentifier: {
          vkId: vk.id,
          cisIdentifier: cisIdentifier
        }
      },
      include: {
        user: true
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Uchádzač s týmto identifikátorom neexistuje v danom VK' },
        { status: 404 }
      )
    }

    // 4. Check if candidate is archived
    if (candidate.isArchived || candidate.deleted) {
      return NextResponse.json(
        { error: 'Tento účet bol archivovaný' },
        { status: 403 }
      )
    }

    // 5. Verify password
    const user = candidate.user
    if (!user.password) {
      return NextResponse.json(
        { error: 'Heslo nebolo nastavené. Kontaktujte administrátora.' },
        { status: 400 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Nesprávne heslo' },
        { status: 401 }
      )
    }

    // 6. Check if user has UCHADZAC role
    if (user.role !== 'UCHADZAC') {
      return NextResponse.json(
        { error: 'Tento účet nie je účet uchádzača' },
        { status: 403 }
      )
    }

    // 7. Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 8. Create session token (simplified - in production use NextAuth or JWT)
    const sessionData = {
      userId: user.id,
      candidateId: candidate.id,
      vkId: vk.id,
      role: user.role,
      cisIdentifier: candidate.cisIdentifier,
      vkIdentifier: vk.identifier
    }

    // In production, this should be a signed JWT token
    // For now, return session data (frontend will store in secure cookie)
    return NextResponse.json({
      success: true,
      session: sessionData,
      user: {
        name: user.name,
        surname: user.surname,
        email: user.email
      },
      vk: {
        id: vk.id,
        identifier: vk.identifier,
        position: vk.position,
        organizationalUnit: vk.organizationalUnit
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prihlásení' },
      { status: 500 }
    )
  }
}
