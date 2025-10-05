import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    email: string | null
    name: string
    surname: string
    role: UserRole
    institutions: Array<{
      id: string
      code: string
      name: string
    }>
  }

  interface Session {
    user: {
      id: string
      username: string
      role: UserRole
      institutions: Array<{
        id: string
        code: string
        name: string
      }>
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: UserRole
    institutions: Array<{
      id: string
      code: string
      name: string
    }>
  }
}
