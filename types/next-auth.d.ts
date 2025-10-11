import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username?: string
    email?: string | null
    name: string
    surname: string
    role?: UserRole
    roles?: Array<{
      role: UserRole
    }>

    // Candidate specific
    candidateId?: string
    vkId?: string
    cisIdentifier?: string
    type?: 'user' | 'candidate'
  }

  interface Session {
    user: {
      id?: string
      username?: string
      role?: UserRole
      roles?: Array<{
        role: UserRole
      }>

      // Candidate specific
      candidateId?: string
      vkId?: string
      type?: 'user' | 'candidate'
      name?: string
      surname?: string

      // Temporary role switching fields
      originalUserId?: string
      originalRole?: UserRole
      originalUsername?: string
      switchedToUserId?: string
      switchedToCandidateId?: string
      switchedToName?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    username?: string
    role?: UserRole
    roles?: Array<{
      role: UserRole
    }>

    // Candidate specific
    candidateId?: string
    vkId?: string
    type?: 'user' | 'candidate'
    name?: string
    surname?: string

    // Temporary role switching (admin → applicant)
    originalUserId?: string
    originalRole?: UserRole
    originalUsername?: string
    switchedToUserId?: string
    switchedToCandidateId?: string
    switchedToUsername?: string
    switchedToName?: string
  }
}
