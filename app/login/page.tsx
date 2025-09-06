'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Phone, Lock, Sparkles, Shield, Users, ArrowRight } from 'lucide-react'
 

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        phone: formData.phone,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
      } else {
        // 로그인 성공 시 세션 확인 후 리다이렉트
        const session = await getSession()
        if (session) {
          router.push('/')
          router.refresh()
        }
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 연락처 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }))
  }

  // 빠른 로그인 (테스트 계정)
  const quickLogin = (phone: string, password: string) => {
    setFormData({ phone, password })
    setTimeout(() => {
      document.getElementById('login-form')?.requestSubmit()
    }, 100)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 - 더 현대적인 디자인 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl">
            <span className="text-4xl">⛳</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            골프 예약
          </h1>
          <p className="text-gray-600 font-medium">Golf Reservation System</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-center">환영합니다</CardTitle>
            <CardDescription className="text-center text-base">
              연락처와 비밀번호를 입력해 로그인하세요
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
              {/* 연락처 입력 */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">연락처</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-emerald-500" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="pl-11 h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                    maxLength={13}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-emerald-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-11 h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-800">{error}</span>
                </div>
              )}

              {/* 로그인 버튼 */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    로그인 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    로그인
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* 테스트 계정 안내 - 더 시각적으로 개선 */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                빠른 테스트 로그인
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('010-3442-4668', 'admin1234')}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-red-500 mr-1.5" />
                    <span className="text-xs font-semibold text-gray-700">최고관리자</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
                
                <button
                  type="button"
                  onClick={() => quickLogin('010-0000-0000', 'admin')}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-orange-500 mr-1.5" />
                    <span className="text-xs font-semibold text-gray-700">관리자</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
                
                <button
                  type="button"
                  onClick={() => quickLogin('010-0000-0001', 'admin')}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-purple-500 mr-1.5" />
                    <span className="text-xs font-semibold text-gray-700">팀장</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
                
                <button
                  type="button"
                  onClick={() => quickLogin('010-1111-1111', 'admin')}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-green-500 mr-1.5" />
                    <span className="text-xs font-semibold text-gray-700">매니저</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 정보 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 Golf Course Management System</p>
        </div>
      </div>
    </div>
  )
}