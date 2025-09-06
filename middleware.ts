import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 권한 계층 구조 정의
const accountHierarchy = [
  'MEMBER',
  'GOLF_COURSE',
  'PARTNER', 
  'EXTERNAL_MANAGER',
  'INTERNAL_MANAGER',
  'TEAM_LEADER',
  'ADMIN',
  'SUPER_ADMIN'
] as const

type AccountType = typeof accountHierarchy[number]

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

const checkPermission = (userAccountType: string, requiredLevel: AccountType): boolean => {
  const userIndex = accountHierarchy.indexOf(userAccountType as AccountType)
  const requiredIndex = accountHierarchy.indexOf(requiredLevel)
  return userIndex >= requiredIndex && userIndex !== -1
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // 로그인 페이지와 데모 페이지는 항상 접근 가능
  if (pathname.startsWith('/login') || pathname.startsWith('/demo')) {
    return NextResponse.next()
  }

  // API 라우트는 NextAuth 경로 제외하고 세션 체크 (matrix API는 테스트를 위해 임시 허용)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/tee-times/matrix')) {
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // 보호된 경로에서 세션 체크
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 권한이 필요한 경로 체크
  for (const [route, requiredPermission] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      if (!checkPermission(session.user.accountType as string, requiredPermission)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }

  return NextResponse.next()
})

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