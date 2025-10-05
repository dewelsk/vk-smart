import { auth } from '@/auth'
import { UserRole } from '@prisma/client'

/**
 * Get the current session on the server
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole) {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]) {
  const user = await getCurrentUser()
  return user && roles.includes(user.role)
}

/**
 * Check if user is superadmin
 */
export async function isSuperadmin() {
  return hasRole(UserRole.SUPERADMIN)
}

/**
 * Check if user is admin or superadmin
 */
export async function isAdminOrAbove() {
  return hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
}

/**
 * Check if user belongs to specific institution
 */
export async function belongsToInstitution(institutionId: string) {
  const user = await getCurrentUser()
  return user?.institutions.some((i) => i.id === institutionId) ?? false
}

/**
 * Get user's institutions
 */
export async function getUserInstitutions() {
  const user = await getCurrentUser()
  return user?.institutions ?? []
}
