'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, User, LogOut, Settings, TreePine, Menu } from 'lucide-react'
import { QuickMenu } from './QuickMenu'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function GlobalHeader() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const getAccountTypeLabel = (accountType: string) => {
    switch (accountType) {
      case 'SUPER_ADMIN': return '최고관리자'
      case 'ADMIN': return '관리자'
      case 'TEAM_LEADER': return '팀장'
      case 'INTERNAL_MANAGER': return '내부매니저'
      case 'EXTERNAL_MANAGER': return '외부매니저'
      case 'PARTNER': return '파트너'
      case 'GOLF_COURSE': return '골프장'
      case 'MEMBER': return '회원'
      default: return accountType
    }
  }

  const getAccountTypeBadgeColor = (accountType: string) => {
    switch (accountType) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'TEAM_LEADER': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'INTERNAL_MANAGER': return 'bg-green-100 text-green-800 border-green-200'
      case 'EXTERNAL_MANAGER': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PARTNER': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'GOLF_COURSE': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUserInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 및 회사명 */}
          <div className="flex items-center space-x-4">
            {/* 모바일 메뉴 트리거 */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="py-6">
                  <div className="px-6 pb-4 border-b">
                    <h2 className="text-lg font-semibold">메뉴</h2>
                  </div>
                  <div className="pt-4">
                    <QuickMenu isMobile={true} onNavigate={() => setMobileMenuOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-2">
                <TreePine className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">골프장 예약 관리</h1>
                <p className="text-xs text-gray-500">Golf Reservation System</p>
              </div>
            </Link>
          </div>

          {/* 우측 영역 */}
          <div className="flex items-center space-x-4">
            {/* 알림 아이콘 */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* 사용자 프로필 */}
            {status === 'authenticated' && session?.user ? (
              <div className="flex items-center space-x-3">
                {/* 권한 배지 */}
                <Badge 
                  variant="outline" 
                  className={`hidden md:inline-flex ${getAccountTypeBadgeColor(session.user.accountType)}`}
                >
                  {getAccountTypeLabel(session.user.accountType)}
                </Badge>

                {/* 사용자 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 px-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user.image || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                            {getUserInitials(session.user.name || '사용자')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium">{session.user.name}</p>
                          <p className="text-xs text-gray-500">{session.user.phone}</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.phone}</p>
                        <Badge 
                          variant="outline" 
                          className={`w-fit text-xs ${getAccountTypeBadgeColor(session.user.accountType)}`}
                        >
                          {getAccountTypeLabel(session.user.accountType)}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>내 정보</span>
                    </DropdownMenuItem>
                    {['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.accountType) && (
                      <DropdownMenuItem onClick={() => router.push('/team')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>팀 관리</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : status === 'unauthenticated' ? (
              <Button onClick={() => router.push('/login')}>
                로그인
              </Button>
            ) : (
              <div className="animate-pulse">
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
            )}
          </div>
        </div>

        {/* 데스크톱 Quick Menu */}
        <div className="hidden lg:block border-t">
          <QuickMenu />
        </div>
      </div>
    </header>
  )
}