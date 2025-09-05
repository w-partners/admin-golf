'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AccountType } from '@prisma/client'
import { 
  Calendar, 
  Plus, 
  MapPin, 
  BarChart3, 
  Users, 
  ClipboardList 
} from 'lucide-react'

// 권한 체크 함수
const checkPermission = (userAccountType: AccountType, requiredLevel: AccountType): boolean => {
  const hierarchy: AccountType[] = [
    'MEMBER',
    'GOLF_COURSE', 
    'PARTNER',
    'EXTERNAL_MANAGER',
    'INTERNAL_MANAGER',
    'TEAM_LEADER',
    'ADMIN',
    'SUPER_ADMIN'
  ]
  
  const userIndex = hierarchy.indexOf(userAccountType)
  const requiredIndex = hierarchy.indexOf(requiredLevel)
  
  return userIndex >= requiredIndex
}

export function QuickMenu() {
  const { data: session } = useSession()

  if (!session) return null

  const userAccountType = session.user.accountType

  return (
    <nav className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="flex items-center space-x-4 max-w-7xl mx-auto">
        {/* 티타임: 모두 */}
        <Link href="/tee-times">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>티타임</span>
          </Button>
        </Link>

        {/* 티타임등록: 매니저이상 */}
        {checkPermission(userAccountType, 'INTERNAL_MANAGER') && (
          <Link href="/tee-times/new">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>티타임등록</span>
            </Button>
          </Link>
        )}

        {/* 골프장리스트: 관리자이상 */}
        {checkPermission(userAccountType, 'ADMIN') && (
          <Link href="/golf-courses">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>골프장관리</span>
            </Button>
          </Link>
        )}

        {/* 실적등록: 매니저이상 */}
        {checkPermission(userAccountType, 'INTERNAL_MANAGER') && (
          <Link href="/performance">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>실적등록</span>
            </Button>
          </Link>
        )}

        {/* 회원관리: 관리자이상 */}
        {checkPermission(userAccountType, 'ADMIN') && (
          <Link href="/members">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>회원관리</span>
            </Button>
          </Link>
        )}

        {/* 공지사항: 모두 (읽기만) */}
        <Link href="/notices">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <ClipboardList className="h-4 w-4" />
            <span>공지사항</span>
          </Button>
        </Link>
      </div>
    </nav>
  )
}