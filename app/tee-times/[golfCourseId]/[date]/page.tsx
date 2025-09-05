'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ReservationTimer } from '@/components/tee-time/ReservationTimer'
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign } from 'lucide-react'

interface TeeTimeDetail {
  id: string
  time: string
  greenFee: number
  availableSlots: number
  totalSlots: number
  requestType: 'ANY' | 'COUPLE' | 'MALE' | 'FEMALE'
  holes: '9' | '18' | '36'
  caddyType: 'CADDY' | 'NO_CADDY' | 'DRIVING_CADDY' | 'TRAINEE_CADDY'
  deposit: boolean
  mealIncluded: boolean
  cartFeeIncluded: boolean
  status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'COMPLETED'
  reservedAt?: string
  managerId?: string
  managerName?: string
}

export default function TeeTimeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [golfCourse, setGolfCourse] = useState<any>(null)
  const [teeTimes, setTeeTimes] = useState<TeeTimeDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const golfCourseId = params.golfCourseId as string
  const date = params.date as string
  const timeSlot = searchParams.get('timeSlot')
  const type = searchParams.get('type')
  const bookingType = searchParams.get('booking')

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // TODO: 실제 API 호출로 교체
        await new Promise(resolve => setTimeout(resolve, 800))

        // 모크 골프장 데이터
        setGolfCourse({
          id: golfCourseId,
          name: '취곡 컨트리클럽',
          region: '제주',
          address: '제주시 한림읍 취곡리 1234-5',
          phone: '064-123-4567'
        })

        // 모크 티타임 데이터
        const mockTimes: TeeTimeDetail[] = [
          {
            id: 'tee-1',
            time: '09:32',
            greenFee: 12.5,
            availableSlots: 1,
            totalSlots: 4,
            requestType: 'FEMALE',
            holes: '18',
            caddyType: 'CADDY',
            deposit: true,
            mealIncluded: true,
            cartFeeIncluded: true,
            status: 'AVAILABLE'
          },
          {
            id: 'tee-2',
            time: '09:39',
            greenFee: 12.5,
            availableSlots: 2,
            totalSlots: 4,
            requestType: 'FEMALE',
            holes: '18',
            caddyType: 'NO_CADDY',
            deposit: false,
            mealIncluded: true,
            cartFeeIncluded: false,
            status: 'AVAILABLE'
          },
          {
            id: 'tee-3',
            time: '09:46',
            greenFee: 15.5,
            availableSlots: 0,
            totalSlots: 4,
            requestType: 'MALE',
            holes: '18',
            caddyType: 'CADDY',
            deposit: true,
            mealIncluded: false,
            cartFeeIncluded: false,
            status: 'RESERVED',
            reservedAt: new Date(Date.now() + 300000).toISOString(), // 5분 후 만료
            managerId: 'manager-1',
            managerName: '김매니저'
          },
          {
            id: 'tee-4',
            time: '10:00',
            greenFee: 18.5,
            availableSlots: 0,
            totalSlots: 4,
            requestType: 'ANY',
            holes: '18',
            caddyType: 'TRAINEE_CADDY',
            deposit: true,
            mealIncluded: true,
            cartFeeIncluded: true,
            status: 'CONFIRMED',
            managerId: 'manager-2',
            managerName: '박매니저'
          }
        ]

        setTeeTimes(mockTimes)
      } catch (error) {
        console.error('Failed to load tee time details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [golfCourseId, date])

  const handleReservation = async (teeTimeId: string) => {
    if (!session) {
      router.push('/login')
      return
    }

    try {
      // TODO: 실제 예약 API 호출
      console.log('Reserving tee time:', teeTimeId)
      
      // 임시로 상태 업데이트
      setTeeTimes(prev => prev.map(tee => 
        tee.id === teeTimeId 
          ? { 
              ...tee, 
              status: 'RESERVED' as const,
              reservedAt: new Date(Date.now() + 600000).toISOString(), // 10분 후 만료
              managerId: session.user.id,
              managerName: session.user.name
            }
          : tee
      ))
    } catch (error) {
      console.error('Reservation failed:', error)
    }
  }

  const handleConfirmReservation = async (teeTimeId: string) => {
    try {
      // TODO: 실제 확정 API 호출
      console.log('Confirming reservation:', teeTimeId)
      
      setTeeTimes(prev => prev.map(tee => 
        tee.id === teeTimeId 
          ? { ...tee, status: 'CONFIRMED' as const }
          : tee
      ))
    } catch (error) {
      console.error('Confirmation failed:', error)
    }
  }

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'ANY': return '무관'
      case 'COUPLE': return '커플'
      case 'MALE': return '남성'
      case 'FEMALE': return '여성'
      default: return type
    }
  }

  const getCaddyTypeLabel = (type: string) => {
    switch (type) {
      case 'CADDY': return '캐디'
      case 'NO_CADDY': return '노캐디'
      case 'DRIVING_CADDY': return '운전캐디'
      case 'TRAINEE_CADDY': return '교육생캐디'
      default: return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">예약가능</Badge>
      case 'RESERVED':
        return <Badge className="bg-yellow-100 text-yellow-800">예약중</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-blue-100 text-blue-800">예약확정</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">완료</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  const timeSlotLabel = timeSlot === '1' ? '1부' : timeSlot === '2' ? '2부' : timeSlot === '3' ? '3부' : ''
  const typeLabel = type === 'DAILY' ? '데일리' : '패키지'
  const bookingLabel = bookingType === 'BOOKING' ? '부킹' : '조인'

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
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {golfCourse?.name} {timeSlotLabel} 티타임
          </h1>
          <Badge variant="outline" className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{golfCourse?.region}</span>
          </Badge>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{timeSlotLabel} ({
              timeSlot === '1' ? '10시 이전' :
              timeSlot === '2' ? '10시-15시' :
              '15시 이후'
            })</span>
          </div>
          <Badge variant="secondary">
            {typeLabel} {bookingLabel}
          </Badge>
        </div>
      </div>

      {/* 티타임 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>티타임 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유형</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>그린피</TableHead>
                <TableHead>인원</TableHead>
                <TableHead>요청사항</TableHead>
                <TableHead>홀선택</TableHead>
                <TableHead>캐디</TableHead>
                <TableHead>선입금</TableHead>
                <TableHead>식사포함</TableHead>
                <TableHead>카트비포함</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teeTimes.map((teeTime) => (
                <TableRow key={teeTime.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {teeTime.time}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span>{teeTime.greenFee}만원</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{teeTime.availableSlots}명 가능</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRequestTypeLabel(teeTime.requestType)}</TableCell>
                  <TableCell>{teeTime.holes}홀</TableCell>
                  <TableCell>{getCaddyTypeLabel(teeTime.caddyType)}</TableCell>
                  <TableCell>{teeTime.deposit ? 'O' : 'X'}</TableCell>
                  <TableCell>{teeTime.mealIncluded ? 'O' : 'X'}</TableCell>
                  <TableCell>{teeTime.cartFeeIncluded ? 'O' : 'X'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(teeTime.status)}
                      {teeTime.status === 'RESERVED' && teeTime.reservedAt && (
                        <ReservationTimer 
                          reservedAt={teeTime.reservedAt}
                          onExpiry={() => {
                            setTeeTimes(prev => prev.map(tee => 
                              tee.id === teeTime.id 
                                ? { ...tee, status: 'AVAILABLE' as const, reservedAt: undefined }
                                : tee
                            ))
                          }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {teeTime.status === 'AVAILABLE' && (
                        <Button
                          size="sm"
                          onClick={() => handleReservation(teeTime.id)}
                        >
                          예약하기
                        </Button>
                      )}
                      {teeTime.status === 'RESERVED' && teeTime.managerId === session?.user.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirmReservation(teeTime.id)}
                        >
                          예약확정
                        </Button>
                      )}
                      {['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(session?.user.accountType || '') && (
                        <Button
                          size="sm"
                          variant="ghost"
                        >
                          수정
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {teeTimes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              해당 시간대에 등록된 티타임이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}