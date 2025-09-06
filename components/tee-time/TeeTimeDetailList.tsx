'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReservationTimer } from './ReservationTimer'
import { 
  DollarSign, 
  Users, 
  Clock, 
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Coffee,
  Car,
  User,
  Flag,
  RefreshCw
} from 'lucide-react'

interface TeeTimeDetail {
  id: string
  golfCourseId: string
  golfCourseName: string
  date: string
  time: string
  greenFee: number
  availableSlots: number
  totalSlots: number
  teeTimeType: 'DAILY' | 'PACKAGE'
  bookingType: 'BOOKING' | 'JOIN'
  requestType: 'ANY' | 'COUPLE' | 'MALE' | 'FEMALE'
  holes: '9' | '18' | '36'
  caddyType: 'CADDY' | 'NO_CADDY' | 'DRIVING_CADDY' | 'TRAINEE_CADDY'
  deposit: boolean
  mealIncluded: boolean
  cartFeeIncluded: boolean
  status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'COMPLETED'
  reservedAt?: string
  reservedBy?: {
    id: string
    name: string
    phone: string
    accountType: string
  }
  confirmedBy?: {
    id: string
    name: string
  }
  connectedTeeTimeIds?: string[]
  accommodationInfo?: string
}

interface TeeTimeDetailListProps {
  golfCourseId: string
  date: string
  timeSlot?: number
  teeTimeType?: 'DAILY' | 'PACKAGE'
  bookingType?: 'BOOKING' | 'JOIN'
  showHeader?: boolean
  onRefresh?: () => void
}

export function TeeTimeDetailList({
  golfCourseId,
  date,
  timeSlot,
  teeTimeType,
  bookingType,
  showHeader = true,
  onRefresh
}: TeeTimeDetailListProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [teeTimes, setTeeTimes] = useState<TeeTimeDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 티타임 데이터 로드
  const loadTeeTimes = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        golfCourseId,
        date,
        ...(timeSlot && { timeSlot: timeSlot.toString() }),
        ...(teeTimeType && { type: teeTimeType }),
        ...(bookingType && { booking: bookingType })
      })

      const response = await fetch(`/api/tee-times/details?${params}`)
      
      if (!response.ok) {
        throw new Error('티타임 정보를 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setTeeTimes(data.teeTimes)
    } catch (error) {
      console.error('Failed to load tee times:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTeeTimes()
  }, [golfCourseId, date, timeSlot, teeTimeType, bookingType])

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadTeeTimes(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [golfCourseId, date, timeSlot, teeTimeType, bookingType])

  const handleReservation = async (teeTimeId: string) => {
    if (!session) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/tee-times/${teeTimeId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('예약에 실패했습니다')
      }

      // 데이터 새로고침
      await loadTeeTimes()
    } catch (error) {
      console.error('Reservation failed:', error)
      alert(error instanceof Error ? error.message : '예약에 실패했습니다')
    }
  }

  const handleConfirmReservation = async (teeTimeId: string) => {
    if (!session) return

    const userAccountType = session.user.accountType
    const canConfirm = ['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(userAccountType)
    
    if (!canConfirm) {
      alert('예약 확정 권한이 없습니다')
      return
    }

    try {
      const response = await fetch(`/api/tee-times/${teeTimeId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('예약 확정에 실패했습니다')
      }

      // 데이터 새로고침
      await loadTeeTimes()
    } catch (error) {
      console.error('Confirmation failed:', error)
      alert(error instanceof Error ? error.message : '예약 확정에 실패했습니다')
    }
  }

  const handleCancelReservation = async (teeTimeId: string) => {
    if (!confirm('예약을 취소하시겠습니까?')) return

    try {
      const response = await fetch(`/api/tee-times/${teeTimeId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('예약 취소에 실패했습니다')
      }

      // 데이터 새로고침
      await loadTeeTimes()
    } catch (error) {
      console.error('Cancellation failed:', error)
      alert(error instanceof Error ? error.message : '예약 취소에 실패했습니다')
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
        return <Badge className="bg-green-100 text-green-800 border-green-200">예약가능</Badge>
      case 'RESERVED':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">예약중</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">예약확정</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">완료</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const canEditTeeTime = (teeTime: TeeTimeDetail) => {
    if (!session) return false
    const userAccountType = session.user.accountType
    
    // 관리자는 모든 티타임 수정 가능
    if (['ADMIN', 'SUPER_ADMIN'].includes(userAccountType)) return true
    
    // 매니저는 자신이 예약한 티타임만 수정 가능
    if (['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER'].includes(userAccountType)) {
      return teeTime.reservedBy?.id === session.user.id
    }
    
    // 팀장은 자신과 팀원의 티타임 수정 가능
    if (userAccountType === 'TEAM_LEADER') {
      // TODO: 팀원 체크 로직 추가
      return teeTime.reservedBy?.id === session.user.id
    }
    
    return false
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="link"
            size="sm"
            onClick={() => loadTeeTimes()}
            className="ml-2"
          >
            다시 시도
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const formatTime = (time: string) => {
    // HH:mm 형식으로 표시
    return time.substring(0, 5)
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">티타임 상세 목록</h3>
          <div className="flex items-center space-x-2">
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>업데이트 중...</span>
              </div>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRefresh()
                  loadTeeTimes(true)
                }}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[80px]">시간</TableHead>
              <TableHead className="w-[100px]">그린피</TableHead>
              <TableHead className="w-[80px]">인원</TableHead>
              <TableHead className="w-[100px]">요청사항</TableHead>
              <TableHead className="w-[80px]">홀</TableHead>
              <TableHead className="w-[120px]">캐디</TableHead>
              <TableHead className="w-[60px] text-center">선입금</TableHead>
              <TableHead className="w-[60px] text-center">식사</TableHead>
              <TableHead className="w-[60px] text-center">카트비</TableHead>
              <TableHead className="w-[120px]">상태</TableHead>
              <TableHead className="w-[150px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teeTimes.map((teeTime) => (
              <TableRow key={teeTime.id} className="hover:bg-gray-50">
                <TableCell className="font-mono font-semibold">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>{formatTime(teeTime.time)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">{teeTime.greenFee}만원</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span>{teeTime.availableSlots}/{teeTime.totalSlots}명</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {getRequestTypeLabel(teeTime.requestType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Flag className="h-3 w-3 text-gray-400" />
                    <span>{teeTime.holes}홀</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {getCaddyTypeLabel(teeTime.caddyType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {teeTime.deposit ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {teeTime.mealIncluded ? (
                    <Coffee className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {teeTime.cartFeeIncluded ? (
                    <Car className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {getStatusBadge(teeTime.status)}
                    {teeTime.status === 'RESERVED' && teeTime.reservedAt && (
                      <ReservationTimer 
                        reservedAt={teeTime.reservedAt}
                        onExpiry={() => loadTeeTimes()}
                      />
                    )}
                    {teeTime.reservedBy && (
                      <div className="text-xs text-gray-500">
                        {teeTime.reservedBy.name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {teeTime.status === 'AVAILABLE' && (
                      <Button
                        size="sm"
                        onClick={() => handleReservation(teeTime.id)}
                        className="text-xs"
                      >
                        예약하기
                      </Button>
                    )}
                    {teeTime.status === 'RESERVED' && (
                      <>
                        {session && (teeTime.reservedBy?.id === session.user.id || 
                          ['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.accountType)) && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmReservation(teeTime.id)}
                            className="text-xs"
                          >
                            예약확정
                          </Button>
                        )}
                        {session && teeTime.reservedBy?.id === session.user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelReservation(teeTime.id)}
                            className="text-xs"
                          >
                            취소
                          </Button>
                        )}
                      </>
                    )}
                    {teeTime.status === 'CONFIRMED' && canEditTeeTime(teeTime) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/tee-times/${teeTime.id}/edit`)}
                        className="text-xs"
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
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>해당 조건에 맞는 티타임이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>포함</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircle className="h-3 w-3 text-gray-300" />
            <span>미포함</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Coffee className="h-3 w-3 text-gray-400" />
          <span>식사</span>
          <Car className="h-3 w-3 text-gray-400 ml-2" />
          <span>카트비</span>
        </div>
      </div>
    </div>
  )
}