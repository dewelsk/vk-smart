import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

/**
 * Securely get the authenticated candidate from JWT token.
 *
 * SECURITY: This function ONLY trusts signed JWT tokens.
 * It does NOT accept any headers or query parameters for authentication.
 *
 * @param request - The incoming request
 * @returns The candidate object or null if not authenticated
 */
export async function getAuthenticatedCandidate(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieName = isProduction
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookieName: cookieName,
  })

  // Must have a valid token with candidateId
  if (!token?.candidateId) {
    return null
  }

  // Verify the candidate exists and is active
  const candidate = await prisma.candidate.findUnique({
    where: { id: token.candidateId as string },
    include: {
      vk: true,
      user: true,
    }
  })

  if (!candidate || candidate.deleted || !candidate.active) {
    return null
  }

  // Check if candidate is archived
  if (candidate.isArchived) {
    return null
  }

  return candidate
}

/**
 * Get candidate ID from authenticated session.
 * Returns null if not authenticated or candidate not found.
 */
export async function getAuthenticatedCandidateId(request: NextRequest): Promise<string | null> {
  const candidate = await getAuthenticatedCandidate(request)
  return candidate?.id ?? null
}
