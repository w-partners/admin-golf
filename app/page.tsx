'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, 
  MapPin, 
  BarChart3, 
  Users
} from 'lucide-react'
 
 

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
      {/* 환영 메시지 - 현대적 디자인 */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3">
              안녕하세요, {session.user.name}님!
            </h1>
            <p className="text-emerald-50 text-lg">
              골프장 예약 관리에 오신 것을 환영합니다.
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur rounded-lg border border-white/30">
              <span className="text-sm font-semibold">
                접속 시간: {new Date().toLocaleTimeString('ko-KR')}
              </span>
            </div>
          </div>
          <div className="text-6xl opacity-30">
            ⛳
          </div>
        </div>
      </div>

      {/* 통계 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">오늘 예약</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">이번 달</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">등록된 골프장</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
                <p className="text-xs text-gray-500 mt-1">관리자가 등록 필요</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">등록된 회원</p>
                <p className="text-3xl font-bold text-orange-600">8</p>
                <p className="text-xs text-gray-500 mt-1">테스트 계정 포함</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 및 공지사항 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-lg font-bold text-gray-800">최근 활동</CardTitle>
            <CardDescription className="text-gray-600 font-medium">
              최근 티타임 예약 현황을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">최근 활동이 표시됩니다</p>
            </div>
          </CardContent>
        </Card>

        {/* 공지사항 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-lg font-bold text-gray-800">공지사항</CardTitle>
            <CardDescription className="text-gray-600 font-medium">
              중요한 시스템 공지를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="font-bold text-emerald-900 text-sm mb-2">
                시스템 준비 완료
              </div>
              <div className="text-emerald-700 text-sm leading-relaxed">
                골프장 예약 관리 시스템이 정상 운영 중입니다.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}