import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { AccountType } from '@prisma/client'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'phone-password',
      credentials: {
        phone: {
          label: '연락처',
          type: 'tel',
          placeholder: '01012345678'
        },
        password: {
          label: '비밀번호',
          type: 'password'
        }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('연락처와 비밀번호를 입력해주세요')
        }

        // 연락처 정규화 (하이픈 제거)
        const normalizedPhone = credentials.phone.replace(/[-\s]/g, '')

        try {
          const user = await prisma.user.findUnique({
            where: {
              phone: normalizedPhone
            },
            include: {
              team: true
            }
          })

          if (!user) {
            throw new Error('등록되지 않은 연락처입니다')
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValidPassword) {
            throw new Error('비밀번호가 일치하지 않습니다')
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            accountType: user.accountType,
            status: user.status,
            teamId: user.teamId,
            team: user.team
          }
        } catch (error) {
          console.error('Login error:', error)
          throw new Error(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다')
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24시간
  },
  jwt: {
    maxAge: 24 * 60 * 60 // 24시간
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accountType = user.accountType
        token.status = user.status
        token.teamId = user.teamId
        token.team = user.team
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.accountType = token.accountType as AccountType
        session.user.status = token.status
        session.user.teamId = token.teamId
        session.user.team = token.team
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
})

export { handler as GET, handler as POST }