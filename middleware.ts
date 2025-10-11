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
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
  })

  // Identify route types
  // IMPORTANT: Check /applicant/ (with trailing slash) to avoid matching /applicants
  const isApplicantRoute = pathname.startsWith('/applicant/') || pathname === '/applicant' || pathname.startsWith('/api/applicant')
  const isCommissionRoute = pathname.startsWith('/commission') || pathname.startsWith('/api/commission')
  const isGestorRoute = pathname.startsWith('/gestor') || pathname.startsWith('/api/gestor')

  // Handle candidate sessions
  if (token?.type === 'candidate') {
    // Allow switch-back endpoint for switched sessions
    if (pathname === '/api/admin/switch-back' && token.originalUserId) {
      return NextResponse.next()
    }

    // Candidates can only access /applicant/ routes (with trailing slash to avoid matching /applicants)
    if (!pathname.startsWith('/applicant/') && pathname !== '/applicant' && !pathname.startsWith('/api/applicant')) {
      return NextResponse.redirect(new URL('/applicant/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Handle gestor routes - only GESTOR role
  if (isGestorRoute) {
    if (req.auth?.user?.role !== 'GESTOR') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Handle commission routes - only KOMISIA role
  if (isCommissionRoute) {
    if (req.auth?.user?.role !== 'KOMISIA') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Handle applicant routes - non-candidates redirected to admin
  if (isApplicantRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow access to admin routes for users
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
}
