'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, MapPin, RefreshCw, AlertCircle } from 'lucide-react'

interface MatrixTableProps {
  teeTimeType: 'DAILY' | 'PACKAGE'
  bookingType: 'BOOKING' | 'JOIN'
  title: string
}

interface MatrixData {
  region: string
  golfCourses: {
    id: string
    name: string
    dates: {
      date: string
      timeSlot1: number
      timeSlot2: number
      timeSlot3: number
      total: number
    }[]
  }[]
}

interface DateColumn {
  date: string
  displayDate: string
  dayOfWeek: string
  isToday: boolean
  isWeekend: boolean
}

interface MatrixApiResponse {
  matrixData: MatrixData[]
  dateColumns: DateColumn[]
  summary: {
    totalGolfCourses: number
    totalTeeTimes: number
    teeTimeType: string
    bookingType: string
    dateRange: {
      start: string
      end: string
    }
  }
}

export function MatrixTable({ teeTimeType, bookingType, title }: MatrixTableProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [matrixData, setMatrixData] = useState<MatrixData[]>([])
  const [dateColumns, setDateColumns] = useState<DateColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [summary, setSummary] = useState<MatrixApiResponse['summary'] | null>(null)

  // API에서 매트릭스 데이터 로드
  const loadMatrixData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      const response = await fetch(
        `/api/tee-times/matrix?type=${teeTimeType}&booking=${bookingType}&days=90`
      )
      
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다')
      }
      
      const data: MatrixApiResponse = await response.json()
      
      setMatrixData(data.matrixData)
      setDateColumns(data.dateColumns)
      setSummary(data.summary)
    } catch (error) {
      console.error('Failed to load matrix data:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // 초기 로드 및 탭 변경 시 데이터 로드
  useEffect(() => {
    loadMatrixData()
  }, [teeTimeType, bookingType])

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadMatrixData(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [teeTimeType, bookingType])

  const handleCellClick = (golfCourseId: string, date: string, timeSlot: number) => {
    router.push(`/tee-times/${golfCourseId}/${date}?timeSlot=${timeSlot}&type=${teeTimeType}&booking=${bookingType}`)
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      const currentScroll = scrollContainerRef.current.scrollLeft
      const newPosition = direction === 'right' 
        ? currentScroll + scrollAmount 
        : currentScroll - scrollAmount
      
      scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  const handleRefresh = () => {
    loadMatrixData(true)
  }

  // 오늘 날짜로 스크롤
  const scrollToToday = () => {
    if (scrollContainerRef.current) {
      const todayIndex = dateColumns.findIndex(col => col.isToday)
      if (todayIndex !== -1) {
        const scrollPosition = todayIndex * 128 // 각 컬럼이 128px (w-32)
        scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' })
      }
    }
  }

  // 오늘 날짜로 자동 스크롤
  useEffect(() => {
    if (dateColumns.length > 0 && !isLoading) {
      setTimeout(scrollToToday, 100)
    }
  }, [dateColumns, isLoading])

  if (isLoading && !isRefreshing) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={() => loadMatrixData()}
              className="ml-2"
            >
              다시 시도
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {/* 테이블 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {summary && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Badge variant="secondary">
                골프장 {summary.totalGolfCourses}개
              </Badge>
              <Badge variant="secondary">
                티타임 {summary.totalTeeTimes}개
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToToday}
            title="오늘로 이동"
          >
            오늘
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleScroll('left')}
            title="이전"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleScroll('right')}
            title="다음"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 매트릭스 테이블 - 엑셀 스타일 */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
        <div className="flex">
          {/* 좌측 고정 영역 - 지역/골프장 */}
          <div className="flex-shrink-0 bg-gray-50 border-r-2 border-gray-300 sticky left-0 z-10">
            {/* 헤더 */}
            <div className="flex border-b-2 border-gray-300 bg-gradient-to-b from-gray-100 to-gray-200">
              <div className="w-24 p-3 border-r border-gray-300 font-bold text-center text-sm">지역</div>
              <div className="w-32 p-3 font-bold text-center text-sm">골프장</div>
            </div>
            
            {/* 데이터 행들 */}
            {matrixData.map(regionData => 
              regionData.golfCourses.map((course, courseIndex) => (
                <div key={course.id} className="flex border-b border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="w-24 p-3 border-r border-gray-200 flex items-center justify-center bg-white">
                    {courseIndex === 0 && (
                      <div className="flex items-center space-x-1 text-xs font-bold text-gray-700">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span>{regionData.region}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-32 p-3 flex items-center text-sm font-semibold text-gray-800 bg-white">
                    {course.name}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 우측 스크롤 영역 - 날짜 컬럼들 */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="min-w-max">
              {/* 날짜 헤더 */}
              <div className="flex border-b-2 border-gray-300 bg-gradient-to-b from-gray-100 to-gray-200 sticky top-0 z-5">
                {dateColumns.map(dateCol => (
                  <div 
                    key={dateCol.date}
                    className={`w-32 p-2 border-r border-gray-200 text-center ${
                      dateCol.isToday ? 'bg-blue-100 border-blue-300' :
                      dateCol.isWeekend ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    <div className={`font-bold text-sm ${
                      dateCol.isToday ? 'text-blue-700' :
                      dateCol.isWeekend ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {dateCol.displayDate}
                    </div>
                    <div className={`text-xs ${
                      dateCol.isToday ? 'text-blue-600' :
                      dateCol.isWeekend ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {dateCol.dayOfWeek}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 데이터 행들 */}
              {matrixData.map(regionData => 
                regionData.golfCourses.map(course => (
                  <div key={course.id} className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {course.dates.map((dateData, dateIndex) => {
                      const dateCol = dateColumns[dateIndex]
                      return (
                        <div 
                          key={dateData.date} 
                          className={`w-32 p-1.5 border-r border-gray-200 ${
                            dateCol?.isToday ? 'bg-blue-50/30' :
                            dateCol?.isWeekend ? 'bg-red-50/20' : ''
                          }`}
                        >
                          <div className="flex flex-col space-y-0.5">
                          {/* 1부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 1)}
                            className={`text-xs rounded-sm px-1.5 py-1 border transition-all w-full ${
                              dateData.timeSlot1 > 0 
                                ? 'bg-blue-50 hover:bg-blue-100 hover:shadow-sm border-blue-200 text-blue-700 font-bold' 
                                : 'bg-gray-50 text-gray-400 cursor-default border-gray-200'
                            }`}
                            disabled={dateData.timeSlot1 === 0}
                          >
                            1부: {dateData.timeSlot1}
                          </button>
                          {/* 2부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 2)}
                            className={`text-xs rounded-sm px-1.5 py-1 border transition-all w-full ${
                              dateData.timeSlot2 > 0 
                                ? 'bg-green-50 hover:bg-green-100 hover:shadow-sm border-green-200 text-green-700 font-bold' 
                                : 'bg-gray-50 text-gray-400 cursor-default border-gray-200'
                            }`}
                            disabled={dateData.timeSlot2 === 0}
                          >
                            2부: {dateData.timeSlot2}
                          </button>
                          {/* 3부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 3)}
                            className={`text-xs rounded-sm px-1.5 py-1 border transition-all w-full ${
                              dateData.timeSlot3 > 0 
                                ? 'bg-orange-50 hover:bg-orange-100 hover:shadow-sm border-orange-200 text-orange-700 font-bold' 
                                : 'bg-gray-50 text-gray-400 cursor-default border-gray-200'
                            }`}
                            disabled={dateData.timeSlot3 === 0}
                          >
                            3부: {dateData.timeSlot3}
                          </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 및 상태 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 rounded border border-blue-200"></div>
            <span>1부 (10시 이전)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 rounded border border-green-200"></div>
            <span>2부 (10시-15시)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-100 rounded border border-orange-200"></div>
            <span>3부 (15시 이후)</span>
          </div>
        </div>
        {isRefreshing && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>업데이트 중...</span>
          </div>
        )}
      </div>
    </div>
  )
}