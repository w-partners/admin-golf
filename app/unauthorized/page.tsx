'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">접근 권한 없음</CardTitle>
            <CardDescription>
              이 페이지에 접근할 권한이 없습니다.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              현재 계정 권한으로는 요청하신 기능을 사용할 수 없습니다.
              <br />
              관리자에게 문의하거나 이전 페이지로 돌아가세요.
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => router.back()}
                variant="default"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>이전 페이지로</span>
              </Button>
              
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
              >
                메인으로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}