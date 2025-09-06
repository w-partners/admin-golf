'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, Users, DollarSign, MapPin } from 'lucide-react'

const teeTimeSchema = z.object({
  golfCourseId: z.string().min(1, '골프장을 선택해주세요'),
  date: z.string().min(1, '날짜를 입력해주세요'),
  time: z.string().min(1, '시간을 입력해주세요'),
  greenFee: z.number().min(0, '그린피는 0 이상이어야 합니다').max(999.9, '그린피는 999.9만원 이하여야 합니다'),
  playerCount: z.number().min(1, '최소 1명 이상이어야 합니다').max(4, '최대 4명까지 가능합니다'),
  requestType: z.enum(['ANY', 'COUPLE', 'MALE', 'FEMALE']),
  holes: z.enum(['9', '18', '36']),
  caddyType: z.enum(['CADDY', 'NO_CADDY', 'DRIVING_CADDY', 'TRAINEE_CADDY']),
  deposit: z.boolean(),
  mealIncluded: z.boolean(),
  cartFeeIncluded: z.boolean(),
  teeTimeType: z.enum(['DAILY', 'PACKAGE']),
  accommodation: z.string().optional(),
  connectedId: z.string().optional(),
  notes: z.string().optional(),
  commission: z.number().optional(),
  settlementType: z.enum(['PRE_PAYMENT', 'POST_SETTLEMENT']).optional()
})

type TeeTimeFormData = z.infer<typeof teeTimeSchema>

interface GolfCourse {
  id: string
  name: string
  region: string
  address: string
  operationStatus: string
}

export default function NewTeeTimePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGolfCourse, setSelectedGolfCourse] = useState<GolfCourse | null>(null)

  const form = useForm<TeeTimeFormData>({
    resolver: zodResolver(teeTimeSchema),
    defaultValues: {
      playerCount: 4,
      requestType: 'ANY',
      holes: '18',
      caddyType: 'CADDY',
      deposit: false,
      mealIncluded: false,
      cartFeeIncluded: false,
      teeTimeType: 'DAILY',
      commission: 0,
      settlementType: 'POST_SETTLEMENT'
    }
  })

  // 골프장 목록 로드
  useEffect(() => {
    const loadGolfCourses = async () => {
      try {
        const response = await fetch('/api/golf-courses')
        if (response.ok) {
          const courses = await response.json()
          setGolfCourses(courses)
        }
      } catch (error) {
        console.error('Failed to load golf courses:', error)
      }
    }

    loadGolfCourses()
  }, [])

  // 골프장 선택 시 지역 정보 업데이트
  const handleGolfCourseChange = (golfCourseId: string) => {
    const course = golfCourses.find(c => c.id === golfCourseId)
    setSelectedGolfCourse(course || null)
  }

  // 시간 입력시 자동 분류 표시
  const getTimeSlotDisplay = (timeString: string) => {
    if (!timeString) return ''
    
    const [hours] = timeString.split(':').map(Number)
    if (hours < 10) return '1부 (오전)'
    if (hours < 15) return '2부 (오후)'
    return '3부 (저녁)'
  }

  // 인원수에 따른 부킹타입 표시
  const getBookingTypeDisplay = (count: number) => {
    return count === 4 ? '부킹 (4명)' : '조인 (조인가능)'
  }

  const onSubmit = async (data: TeeTimeFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          greenFee: Number(data.greenFee),
          playerCount: Number(data.playerCount),
          commission: Number(data.commission || 0)
        })
      })

      if (response.ok) {
        const teeTime = await response.json()
        router.push('/tee-times')
        // TODO: 성공 토스트 표시
      } else {
        const error = await response.json()
        console.error('Failed to create tee time:', error)
        // TODO: 에러 토스트 표시
      }
    } catch (error) {
      console.error('Error creating tee time:', error)
      // TODO: 에러 토스트 표시
    } finally {
      setIsLoading(false)
    }
  }

  // 권한 체크
  if (!session) {
    return <div>로그인이 필요합니다.</div>
  }

  const managerRoles = ['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN']
  if (!managerRoles.includes(session.user.accountType)) {
    return <div>권한이 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>뒤로가기</span>
      </Button>

      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">티타임 등록</h1>
        <p className="text-gray-600">새로운 티타임을 등록합니다</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>기본 정보</span>
                </CardTitle>
                <CardDescription>
                  티타임의 기본 정보를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 골프장 선택 */}
                <FormField
                  control={form.control}
                  name="golfCourseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>골프장 *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value)
                        handleGolfCourseChange(value)
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="골프장을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {golfCourses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{course.region}</Badge>
                                <span>{course.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedGolfCourse && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>지역: {selectedGolfCourse.region}</span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 날짜 */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>날짜 *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 시간 */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>티타임 *</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          step="60"
                        />
                      </FormControl>
                      {field.value && (
                        <div className="text-sm text-blue-600">
                          자동 분류: {getTimeSlotDisplay(field.value)}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 그린피 */}
                <FormField
                  control={form.control}
                  name="greenFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>그린피 (만원) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="999.9"
                          placeholder="12.5"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        만원 단위로 입력 (소수점 1자리까지)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 인원 */}
                <FormField
                  control={form.control}
                  name="playerCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>인원 *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="인원을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1명</SelectItem>
                          <SelectItem value="2">2명</SelectItem>
                          <SelectItem value="3">3명</SelectItem>
                          <SelectItem value="4">4명</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.value && (
                        <div className="text-sm text-blue-600">
                          자동 분류: {getBookingTypeDisplay(field.value)}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 상세 옵션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span>상세 옵션</span>
                </CardTitle>
                <CardDescription>
                  티타임의 상세 옵션을 설정하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 요청사항 */}
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>요청사항 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ANY">무관</SelectItem>
                          <SelectItem value="COUPLE">커플</SelectItem>
                          <SelectItem value="MALE">남성</SelectItem>
                          <SelectItem value="FEMALE">여성</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 홀선택 */}
                <FormField
                  control={form.control}
                  name="holes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>홀선택 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="9">9홀</SelectItem>
                          <SelectItem value="18">18홀</SelectItem>
                          <SelectItem value="36">36홀</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 캐디 */}
                <FormField
                  control={form.control}
                  name="caddyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>캐디 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CADDY">캐디</SelectItem>
                          <SelectItem value="NO_CADDY">노캐디</SelectItem>
                          <SelectItem value="DRIVING_CADDY">운전캐디</SelectItem>
                          <SelectItem value="TRAINEE_CADDY">교육생캐디</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 체크박스 옵션들 */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>선입금</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mealIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>식사포함</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cartFeeIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>카트비포함</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 패키지 및 추가 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>패키지 및 추가 정보</CardTitle>
              <CardDescription>
                패키지 여행이나 추가 정보가 있는 경우 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 유형 */}
                <FormField
                  control={form.control}
                  name="teeTimeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>유형</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">데일리</SelectItem>
                          <SelectItem value="PACKAGE">패키지</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 수수료 */}
                <FormField
                  control={form.control}
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수수료 (만원)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 숙박 정보 (패키지일 때만) */}
              {form.watch('teeTimeType') === 'PACKAGE' && (
                <FormField
                  control={form.control}
                  name="accommodation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>숙박 정보</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="숙박지명을 입력하세요"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        패키지 여행의 경우 숙박지 정보를 입력하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* 비고 */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비고</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="추가 정보나 특이사항을 입력하세요"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 버튼들 */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? '등록 중...' : '등록하기'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}