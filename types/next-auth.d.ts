import { AccountType, UserStatus } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    accountType: AccountType
    status: UserStatus
    teamId?: string
    team?: {
      id: string
      name: string
      leaderId: string
    }
  }

  interface Session {
    user: {
      id: string
      phone: string
      name: string
      accountType: AccountType
      status: UserStatus
      teamId?: string
      team?: {
        id: string
        name: string
        leaderId: string
      }
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountType: AccountType
    status: UserStatus
    teamId?: string
    team?: {
      id: string
      name: string
      leaderId: string
    }
  }
}