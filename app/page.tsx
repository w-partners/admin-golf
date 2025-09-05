'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  MapPin, 
  BarChart3, 
  Users, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userAccountType = session.user.accountType

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요, {session.user.name}님! 👋
        </h1>
        <p className="text-gray-600">
          골프장 예약 관리 시스템에 오신 것을 환영합니다.
        </p>
        <div className="mt-2 text-sm text-blue-600">
          현재 권한: {
            userAccountType === 'SUPER_ADMIN' ? '최고관리자' :
            userAccountType === 'ADMIN' ? '관리자' :
            userAccountType === 'TEAM_LEADER' ? '팀장' :
            userAccountType === 'INTERNAL_MANAGER' ? '내부매니저' :
            userAccountType === 'EXTERNAL_MANAGER' ? '외부매니저' :
            userAccountType === 'PARTNER' ? '파트너' :
            userAccountType === 'GOLF_COURSE' ? '골프장' :
            '회원'
          }
        </div>
      </div>

      {/* 퀵 액션 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 티타임 조회 */}
        <Link href="/tee-times">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">티타임 조회</CardTitle>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <CardDescription>
                예약 가능한 티타임을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>실시간 업데이트</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 티타임 등록 (매니저 이상) */}
        {['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(userAccountType) && (
          <Link href="/tee-times/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">티타임 등록</CardTitle>
                  <Plus className="h-5 w-5 text-green-500" />
                </div>
                <CardDescription>
                  새로운 티타임을 등록하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4" />
                  <span>즉시 등록 가능</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 골프장 관리 (관리자 이상) */}
        {['ADMIN', 'SUPER_ADMIN'].includes(userAccountType) && (
          <Link href="/golf-courses">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">골프장 관리</CardTitle>
                  <MapPin className="h-5 w-5 text-purple-500" />
                </div>
                <CardDescription>
                  골프장 정보를 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>8개 지역별 관리</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 실적 관리 (매니저 이상) */}
        {['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(userAccountType) && (
          <Link href="/performance">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">실적 관리</CardTitle>
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                </div>
                <CardDescription>
                  완료된 예약의 실적을 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>성과 분석 가능</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* 최근 활동 및 공지사항 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>
              최근 티타임 예약 현황을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>시스템이 정상적으로 운영 중입니다</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>데이터베이스 연결 상태: 양호</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>개발 환경에서 실행 중</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 공지사항 */}
        <Card>
          <CardHeader>
            <CardTitle>공지사항</CardTitle>
            <CardDescription>
              중요한 시스템 공지를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 text-sm mb-1">
                  시스템 초기화 완료
                </div>
                <div className="text-blue-700 text-xs">
                  골프장 예약 관리 시스템이 성공적으로 구축되었습니다.
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900 text-sm mb-1">
                  테스트 계정 활성화
                </div>
                <div className="text-green-700 text-xs">
                  모든 권한별 테스트 계정이 준비되었습니다.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}