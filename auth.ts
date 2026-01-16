import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  getAccountLockoutInfo,
  recordFailedAttempt,
  resetFailedAttempts
} from '@/lib/auth/account-lockout'

// Login schema validation
const loginSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
})

const candidateLoginSchema = z.object({
  cisIdentifier: z.string().min(1, 'CIS ID is required'),
  pin: z.string().min(1, 'PIN is required'),
})

export const authConfig: NextAuthConfig = {
  providers: [
    // Admin/Gestor/Komisia Login
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        login: { label: 'Email/Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const { login, password } = loginSchema.parse(credentials)

          // Find user by email or username
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: login },
                { username: login },
              ],
              deleted: false,
              active: true,
            },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              surname: true,
              role: true,
              password: true,
              otpEnabled: true,
              otpSecret: true,
              twoFactorRequired: true,
              mustChangePassword: true,
              userRoles: {
                select: {
                  role: true,
                },
              },
            },
          })

          if (!user || !user.password) {
            return null
          }

          // Check if account is locked
          const lockStatus = await getAccountLockoutInfo(user.id)
          if (lockStatus.isLocked) {
            throw new Error(`Account is locked: ${lockStatus.lockReason}`)
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password)
          if (!isPasswordValid) {
            // Record failed login attempt
            await recordFailedAttempt(user.id)
            return null
          }

          // Reset failed attempts on successful login
          await resetFailedAttempts(user.id)

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          // Return user data for session with 2FA and password change flags
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            surname: user.surname,
            role: user.role,
            roles: user.userRoles.map((ur) => ({
              role: ur.role,
            })),
            type: 'user',
            // 2FA and security flags
            twoFactorRequired: user.twoFactorRequired || false,
            twoFactorEnabled: user.otpEnabled || false,
            mustChangePassword: user.mustChangePassword || false,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
    // Candidate Login
    Credentials({
      id: 'candidate-credentials',
      name: 'Candidate Login',
      credentials: {
        cisIdentifier: { label: 'CIS ID', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const { cisIdentifier, pin } = candidateLoginSchema.parse(credentials)

          // Find candidate by CIS
          const candidate = await prisma.candidate.findUnique({
            where: {
              cisIdentifier,
              active: true,
              deleted: false,
            },
            include: {
              vk: {
                select: {
                  id: true,
                  identifier: true,
                },
              },
            },
          })

          if (!candidate || !candidate.password) {
            return null
          }

          // Verify PIN
          const isValid = await bcrypt.compare(pin, candidate.password)
          if (!isValid) {
            return null
          }

          // Update last login
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: { lastLoginAt: new Date() },
          })

          // Return candidate data for session
          return {
            id: candidate.id,
            candidateId: candidate.id,
            cisIdentifier: candidate.cisIdentifier,
            name: candidate.name,
            surname: candidate.surname,
            vkId: candidate.vkId,
            type: 'candidate',
          }
        } catch (error) {
          console.error('Candidate authorization error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        if (user.type === 'candidate') {
          // Candidate session
          token.id = user.id
          token.candidateId = user.candidateId
          token.vkId = user.vkId
          token.type = 'candidate'
          token.name = user.name
          token.surname = user.surname
        } else {
          // User (Admin/Gestor/Komisia) session
          token.id = user.id
          token.username = user.username
          token.role = user.role
          token.roles = user.roles
          token.type = 'user'
          token.name = user.name
          token.surname = user.surname
          // 2FA and security flags
          token.twoFactorRequired = user.twoFactorRequired
          token.twoFactorEnabled = user.twoFactorEnabled
          token.mustChangePassword = user.mustChangePassword
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        if (token.type === 'candidate') {
          // Candidate session
          session.user.candidateId = token.candidateId as string
          session.user.vkId = token.vkId as string
          session.user.type = 'candidate'
          session.user.name = token.name as string
          session.user.surname = token.surname as string
        } else {
          // User session
          session.user.id = token.id as string
          session.user.username = token.username as string
          session.user.role = token.role as UserRole
          session.user.roles = token.roles as Array<{
            role: UserRole
          }>
          session.user.type = 'user'
          session.user.name = token.name as string
          session.user.surname = token.surname as string
          // 2FA and security flags
          session.user.twoFactorRequired = token.twoFactorRequired as boolean
          session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
          session.user.mustChangePassword = token.mustChangePassword as boolean
        }

        // Temporary role switching (for both types)
        session.user.originalUserId = token.originalUserId as string | undefined
        session.user.originalRole = token.originalRole as UserRole | undefined
        session.user.originalUsername = token.originalUsername as string | undefined
        session.user.switchedToUserId = token.switchedToUserId as string | undefined
        session.user.switchedToCandidateId = token.switchedToCandidateId as string | undefined
        session.user.switchedToName = token.switchedToName as string | undefined
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
