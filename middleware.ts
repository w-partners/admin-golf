import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { AccountType } from '@prisma/client'

// 경로별 필요 권한 정의
const routePermissions: Record<string, AccountType> = {
  '/admin': 'ADMIN',
  '/golf-courses/new': 'SUPER_ADMIN',
  '/golf-courses/edit': 'ADMIN',
  '/tee-times/new': 'INTERNAL_MANAGER',
  '/tee-times/edit': 'INTERNAL_MANAGER',
  '/performance': 'INTERNAL_MANAGER',
  '/members': 'ADMIN',
  '/members/new': 'ADMIN',
  '/members/edit': 'ADMIN',
}

// 권한 계층 구조
const accountHierarchy: AccountType[] = [
  'MEMBER',
  'GOLF_COURSE',
  'PARTNER', 
  'EXTERNAL_MANAGER',
  'INTERNAL_MANAGER',
  'TEAM_LEADER',
  'ADMIN',
  'SUPER_ADMIN'
]

const checkPermission = (userAccountType: AccountType, requiredLevel: AccountType): boolean => {
  const userIndex = accountHierarchy.indexOf(userAccountType)
  const requiredIndex = accountHierarchy.indexOf(requiredLevel)
  return userIndex >= requiredIndex
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // 권한이 필요한 경로 체크
    for (const [route, requiredPermission] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route)) {
        if (!checkPermission(token.accountType as AccountType, requiredPermission)) {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 로그인 페이지는 항상 접근 가능
        if (pathname.startsWith('/login')) {
          return true
        }

        // API 라우트는 토큰이 있으면 접근 가능
        if (pathname.startsWith('/api')) {
          return !!token
        }

        // 나머지 보호된 경로는 토큰 필요
        return !!token
      }
    }
  }
)

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청에 대해 실행:
     * - api/auth (NextAuth 경로)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
}