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
 * Check if user has specific role (can be global or institution-specific)
 */
export async function hasRole(role: UserRole, institutionId?: string) {
  const user = await getCurrentUser()
  if (!user) return false

  // Check primary role for backward compatibility
  if (user.role === role) return true

  // Check multi-role assignments
  return user.roles?.some(r => {
    if (r.role !== role) return false
    if (institutionId && r.institutionId !== institutionId) return false
    return true
  }) ?? false
}

/**
 * Check if user has any of the specified roles (can be global or institution-specific)
 */
export async function hasAnyRole(roles: UserRole[], institutionId?: string) {
  const user = await getCurrentUser()
  if (!user) return false

  // Check primary role for backward compatibility
  if (roles.includes(user.role)) return true

  // Check multi-role assignments
  return user.roles?.some(r => {
    if (!roles.includes(r.role)) return false
    if (institutionId && r.institutionId !== institutionId) return false
    return true
  }) ?? false
}

/**
 * Check if user has all of the specified roles
 */
export async function hasAllRoles(roles: UserRole[], institutionId?: string) {
  const user = await getCurrentUser()
  if (!user) return false

  return roles.every(role => {
    // Check primary role
    if (user.role === role) return true

    // Check multi-role assignments
    return user.roles?.some(r => {
      if (r.role !== role) return false
      if (institutionId && r.institutionId !== institutionId) return false
      return true
    }) ?? false
  })
}

/**
 * Get all user's roles
 */
export async function getUserRoles() {
  const user = await getCurrentUser()
  return user?.roles ?? []
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

