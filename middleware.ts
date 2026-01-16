import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicPaths = [
    '/admin/login',
    '/applicant/login',
    '/login',
    '/unauthorized',
    '/api/auth',
    '/auth/password-reset', // Reset is public
  ]

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get token to check user type and role
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieName = isProduction
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    cookieName: cookieName,
  })

  // Redirect root path to dashboard based on type
  if (pathname === '/') {
    const target = token?.type === 'candidate' ? '/applicant/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(target, req.url))
  }

  // Handle candidate sessions
  if (token?.type === 'candidate') {
    // Allow switch-back endpoint for switched sessions
    if (pathname === '/api/admin/switch-back' && token.originalUserId) {
      return NextResponse.next()
    }

    // Candidates can only access /applicant/ routes
    if (!pathname.startsWith('/applicant/') && pathname !== '/applicant' && !pathname.startsWith('/api/applicant')) {
      return NextResponse.redirect(new URL('/applicant/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Handling for Admin/Gestor/Komisia users
  if (token?.type === 'user') {
    // Only enforce security redirects in production
    const isProductionEnv = process.env.NODE_ENV === 'production'

    if (isProductionEnv) {
      // 1. Force password change if required
      const mustChangePassword = token.mustChangePassword === true
      if (mustChangePassword && pathname !== '/auth/change-password' && !pathname.startsWith('/api/auth')) {
        return NextResponse.redirect(new URL('/auth/change-password', req.url))
      }

      // 2. Force 2FA verification if required but not yet done
      const twoFactorRequired = token.twoFactorRequired === true
      const twoFactorVerified = token.twoFactorVerified === true

      if (twoFactorRequired && !twoFactorVerified && pathname !== '/auth/verify-2fa' && !pathname.startsWith('/api/auth')) {
        const verifyUrl = new URL('/auth/verify-2fa', req.url)
        verifyUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(verifyUrl)
      }
    }

    // Route-based RBAC
    const isGestorRoute = pathname.startsWith('/gestor') || pathname.startsWith('/api/gestor')
    const isCommissionRoute = pathname.startsWith('/commission') || pathname.startsWith('/api/commission')
    const isApplicantRoute = pathname.startsWith('/applicant/') || pathname === '/applicant' || pathname.startsWith('/api/applicant')

    if (isGestorRoute && req.auth?.user?.role !== 'GESTOR') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (isCommissionRoute && req.auth?.user?.role !== 'KOMISIA') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (isApplicantRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
  runtime: 'nodejs',
}
