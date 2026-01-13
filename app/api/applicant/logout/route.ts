import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieName = isProduction
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const response = NextResponse.json({ success: true })

  // Clear the auth cookie
  response.cookies.set({
    name: cookieName,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
