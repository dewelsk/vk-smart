import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
            include: {
              userRoles: true,
            },
          })

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password)
          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          // Return user data for session
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
