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

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
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
              institutions: {
                include: {
                  institution: true,
                },
              },
              userRoles: {
                include: {
                  institution: true,
                },
              },
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
            institutions: user.institutions.map((ui) => ({
              id: ui.institution.id,
              code: ui.institution.code,
              name: ui.institution.name,
            })),
            roles: user.userRoles.map((ur) => ({
              role: ur.role,
              institutionId: ur.institutionId,
              institutionName: ur.institution?.name || null,
            })),
          }
        } catch (error) {
          console.error('Authorization error:', error)
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
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.institutions = user.institutions
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as UserRole
        session.user.institutions = token.institutions as Array<{
          id: string
          code: string
          name: string
        }>
        session.user.roles = token.roles as Array<{
          role: UserRole
          institutionId: string | null
          institutionName: string | null
        }>
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
