'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatrixTable } from '@/components/tee-time/MatrixTable'
import { Calendar, Clock, Users, Package } from 'lucide-react'

export default function TeeTimesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('daily-booking')

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

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">티타임 관리</h1>
          <p className="text-gray-600">골프장별 티타임 현황을 확인하고 예약하세요</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>실시간 업데이트</span>
        </div>
      </div>

      {/* Matrix View 탭 시스템 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>티타임 매트릭스</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-1 m-6 mb-0">
              <TabsTrigger 
                value="daily-booking" 
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>데일리부킹</span>
              </TabsTrigger>
              <TabsTrigger 
                value="daily-join"
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>데일리조인</span>
              </TabsTrigger>
              <TabsTrigger 
                value="package-booking"
                className="flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>패키지부킹</span>
              </TabsTrigger>
              <TabsTrigger 
                value="package-join"
                className="flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>패키지조인</span>
              </TabsTrigger>
            </TabsList>

            {/* 데일리 부킹 */}
            <TabsContent value="daily-booking" className="m-0">
              <MatrixTable 
                teeTimeType="DAILY"
                bookingType="BOOKING"
                title="데일리 부킹 예약 현황"
              />
            </TabsContent>

            {/* 데일리 조인 */}
            <TabsContent value="daily-join" className="m-0">
              <MatrixTable 
                teeTimeType="DAILY"
                bookingType="JOIN"
                title="데일리 조인 예약 현황"
              />
            </TabsContent>

            {/* 패키지 부킹 */}
            <TabsContent value="package-booking" className="m-0">
              <MatrixTable 
                teeTimeType="PACKAGE"
                bookingType="BOOKING"
                title="패키지 부킹 예약 현황"
              />
            </TabsContent>

            {/* 패키지 조인 */}
            <TabsContent value="package-join" className="m-0">
              <MatrixTable 
                teeTimeType="PACKAGE"
                bookingType="JOIN"
                title="패키지 조인 예약 현황"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}