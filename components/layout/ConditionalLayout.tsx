'use client'

import { usePathname } from 'next/navigation'
import { GlobalHeader } from './GlobalHeader'
import { QuickMenu } from './QuickMenu'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // 로그인 페이지에서는 GlobalHeader와 QuickMenu를 숨김
  const hideHeader = pathname === '/login'
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && (
        <>
          <GlobalHeader />
          <div className="hidden md:block border-b bg-white">
            <div className="container mx-auto px-4">
              <QuickMenu />
            </div>
          </div>
        </>
      )}
      <main className={hideHeader ? "" : "container mx-auto px-4 py-6"}>
        {children}
      </main>
    </div>
  )
}