'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Plus,
  MapPin,
  BarChart3,
  Users,
  Settings,
  Home,
  FileText,
  Trophy
} from 'lucide-react'
import { COMMON_TEXTS } from '@/constants/commonTexts'

interface QuickMenuProps {
  isMobile?: boolean
  onNavigate?: () => void
}

interface MenuItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
}

function MenuItem({ href, icon, label, isActive, onClick, disabled }: MenuItemProps) {
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  )

  if (disabled) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-gray-400 cursor-not-allowed">
        {content}
      </div>
    )
  }

  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
          isActive
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        {content}
      </div>
    </Link>
  )
}

export function QuickMenu({ isMobile = false, onNavigate }: QuickMenuProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  if (!session) return null

  const userAccountType = session.user.accountType

  // 권한별 메뉴 접근 가능 여부
  const canAccessTeeTime = true // 모든 사용자
  const canCreateTeeTime = ['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(userAccountType)
  const canAccessGolfCourse = ['ADMIN', 'SUPER_ADMIN', 'GOLF_COURSE'].includes(userAccountType)
  const canCreateGolfCourse = ['ADMIN', 'SUPER_ADMIN'].includes(userAccountType)
  const canAccessPerformance = ['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(userAccountType)
  const canAccessMembers = ['ADMIN', 'SUPER_ADMIN', 'TEAM_LEADER'].includes(userAccountType)
  const canAccessNotices = true // 모든 사용자
  const canAccessTeam = ['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(userAccountType)

  const handleNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate()
    }
    router.push(href)
  }

  const menuItems = [
    {
      href: '/',
      icon: <Home className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.DASHBOARD,
      show: true,
      active: pathname === '/'
    },
    {
      href: '/tee-times',
      icon: <Calendar className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.TEE_TIME_VIEW,
      show: canAccessTeeTime,
      active: pathname.startsWith('/tee-times') && !pathname.includes('/new')
    },
    {
      href: '/tee-times/new',
      icon: <Plus className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.TEE_TIME_CREATE,
      show: canCreateTeeTime,
      active: pathname === '/tee-times/new'
    },
    {
      href: '/golf-courses',
      icon: <MapPin className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.GOLF_COURSE,
      show: canAccessGolfCourse,
      active: pathname.startsWith('/golf-courses')
    },
    {
      href: '/performance',
      icon: <BarChart3 className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.PERFORMANCE,
      show: canAccessPerformance,
      active: pathname.startsWith('/performance')
    },
    {
      href: '/members',
      icon: <Users className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.MEMBERS,
      show: canAccessMembers,
      active: pathname.startsWith('/members')
    },
    {
      href: '/team',
      icon: <Trophy className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.TEAM,
      show: canAccessTeam,
      active: pathname.startsWith('/team')
    },
    {
      href: '/notices',
      icon: <FileText className="h-4 w-4" />,
      label: COMMON_TEXTS.MENU_ITEMS.NOTICES,
      show: canAccessNotices,
      active: pathname.startsWith('/notices')
    }
  ]

  const visibleMenuItems = menuItems.filter(item => item.show)

  if (isMobile) {
    // 모바일 버티컬 레이아웃
    return (
      <nav className="px-4">
        <div className="space-y-1">
          {visibleMenuItems.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={item.active}
              onClick={() => handleNavigation(item.href)}
            />
          ))}
        </div>
      </nav>
    )
  }

  // 데스크톱 호리젠탈 레이아웃
  return (
    <nav className="py-2">
      <div className="flex items-center space-x-1">
        {visibleMenuItems.map((item, index) => (
          <div key={item.href} className="flex items-center">
            <MenuItem
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={item.active}
            />
            {index < visibleMenuItems.length - 1 && (
              <div className="h-4 w-px bg-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}