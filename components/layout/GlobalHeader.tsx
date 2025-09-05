'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Bell, User, LogOut } from 'lucide-react'

export function GlobalHeader() {
  const { data: session, status } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* 로고 및 회사명 */}
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-blue-600">⛳</div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">골프장 예약 관리</h1>
            <p className="text-sm text-gray-500">Golf Course Reservation System</p>
          </div>
        </div>

        {/* 우측 사용자 영역 */}
        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          ) : session ? (
            <>
              {/* 알림 아이콘 */}
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              
              {/* 사용자 정보 */}
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <div className="text-right">
                  <div className="font-medium text-gray-900">{session.user.name}</div>
                  <div className="text-xs text-gray-500">
                    {session.user.accountType === 'SUPER_ADMIN' && '최고관리자'}
                    {session.user.accountType === 'ADMIN' && '관리자'}
                    {session.user.accountType === 'TEAM_LEADER' && '팀장'}
                    {session.user.accountType === 'INTERNAL_MANAGER' && '내부매니저'}
                    {session.user.accountType === 'EXTERNAL_MANAGER' && '외부매니저'}
                    {session.user.accountType === 'PARTNER' && '파트너'}
                    {session.user.accountType === 'GOLF_COURSE' && '골프장'}
                    {session.user.accountType === 'MEMBER' && '회원'}
                  </div>
                </div>
              </div>

              {/* 로그아웃 버튼 */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm">
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}