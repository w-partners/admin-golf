'use client'

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { QuickMenu } from '@/components/layout/QuickMenu';

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // 로그인 페이지에서는 헤더와 메뉴를 숨김
  const isLoginPage = pathname === '/login';

  return (
    <SessionProvider>
      {isLoginPage ? (
        children
      ) : (
        <div className="min-h-screen bg-gray-50">
          <GlobalHeader />
          <QuickMenu />
          <main className="container mx-auto py-6 px-4">
            {children}
          </main>
        </div>
      )}
    </SessionProvider>
  );
}