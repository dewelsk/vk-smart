import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encode } from 'next-auth/jwt'

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

    // 7. Update lastLoginAt for both user and candidate
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { lastLoginAt: new Date() }
    })

    // 8. Create signed JWT token (secure authentication)
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieName = isProduction
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('AUTH_SECRET or NEXTAUTH_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create JWT payload for candidate session
    const token = {
      id: candidate.id,
      userId: user.id,
      candidateId: candidate.id,
      vkId: vk.id,
      type: 'candidate',
      role: 'UCHADZAC',
      name: user.name,
      surname: user.surname,
      email: user.email,
      cisIdentifier: candidate.cisIdentifier,
      vkIdentifier: vk.identifier,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    }

    const encodedToken = await encode({
      token,
      secret,
      salt: cookieName,
    })

    // Create response with JWT cookie
    const response = NextResponse.json({
      success: true,
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
      },
      candidate: {
        id: candidate.id,
        cisIdentifier: candidate.cisIdentifier
      }
    })

    // Set secure HTTP-only cookie with JWT
    response.cookies.set({
      name: cookieName,
      value: encodedToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prihlásení' },
      { status: 500 }
    )
  }
}
