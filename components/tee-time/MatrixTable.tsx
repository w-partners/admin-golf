'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

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
      timeSlot1: number // 1부 티타임 수
      timeSlot2: number // 2부 티타임 수
      timeSlot3: number // 3부 티타임 수
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

export function MatrixTable({ teeTimeType, bookingType, title }: MatrixTableProps) {
  const router = useRouter()
  const [matrixData, setMatrixData] = useState<MatrixData[]>([])
  const [dateColumns, setDateColumns] = useState<DateColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)

  // 90일간의 날짜 생성
  useEffect(() => {
    const generateDateColumns = () => {
      const dates: DateColumn[] = []
      const today = new Date()
      
      for (let i = 0; i < 90; i++) {
        const currentDate = new Date(today)
        currentDate.setDate(today.getDate() + i)
        
        const dateString = currentDate.toISOString().split('T')[0]
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()]
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
        
        dates.push({
          date: dateString,
          displayDate: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
          dayOfWeek,
          isToday: i === 0,
          isWeekend
        })
      }
      
      return dates
    }

    setDateColumns(generateDateColumns())
  }, [])

  // 매트릭스 데이터 로드
  useEffect(() => {
    const loadMatrixData = async () => {
      setIsLoading(true)
      try {
        // TODO: 실제 API 호출로 교체
        await new Promise(resolve => setTimeout(resolve, 1000)) // 시뮬레이션
        
        const mockData: MatrixData[] = [
          {
            region: '제주',
            golfCourses: [
              {
                id: 'golf-1',
                name: '취곡CC',
                dates: dateColumns.map(date => ({
                  date: date.date,
                  timeSlot1: Math.floor(Math.random() * 5),
                  timeSlot2: Math.floor(Math.random() * 8),
                  timeSlot3: Math.floor(Math.random() * 3)
                }))
              },
              {
                id: 'golf-2',
                name: '포도CC',
                dates: dateColumns.map(date => ({
                  date: date.date,
                  timeSlot1: Math.floor(Math.random() * 4),
                  timeSlot2: Math.floor(Math.random() * 6),
                  timeSlot3: Math.floor(Math.random() * 2)
                }))
              }
            ]
          },
          {
            region: '경기북부',
            golfCourses: [
              {
                id: 'golf-3',
                name: '파주CC',
                dates: dateColumns.map(date => ({
                  date: date.date,
                  timeSlot1: Math.floor(Math.random() * 6),
                  timeSlot2: Math.floor(Math.random() * 9),
                  timeSlot3: Math.floor(Math.random() * 4)
                }))
              }
            ]
          }
        ]
        
        setMatrixData(mockData)
      } catch (error) {
        console.error('Failed to load matrix data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (dateColumns.length > 0) {
      loadMatrixData()
    }
  }, [dateColumns, teeTimeType, bookingType])

  const handleCellClick = (golfCourseId: string, date: string, timeSlot: number) => {
    router.push(`/tee-times/${golfCourseId}/${date}?timeSlot=${timeSlot}&type=${teeTimeType}&booking=${bookingType}`)
  }

  const handleScroll = (direction: 'left' | 'right') => {
    const scrollContainer = document.getElementById('matrix-scroll-container')
    if (scrollContainer) {
      const scrollAmount = 300
      const newPosition = direction === 'right' 
        ? scrollPosition + scrollAmount 
        : scrollPosition - scrollAmount
      
      scrollContainer.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  if (isLoading) {
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

  return (
    <div className="space-y-4 p-6">
      {/* 테이블 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleScroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleScroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 매트릭스 테이블 */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="flex">
          {/* 좌측 고정 영역 - 지역/골프장 */}
          <div className="flex-shrink-0 bg-gray-50 border-r">
            {/* 헤더 */}
            <div className="flex border-b bg-gray-100">
              <div className="w-24 p-3 border-r font-medium text-center">지역</div>
              <div className="w-32 p-3 font-medium text-center">골프장</div>
            </div>
            
            {/* 데이터 행들 */}
            {matrixData.map(regionData => 
              regionData.golfCourses.map((course, courseIndex) => (
                <div key={course.id} className="flex border-b last:border-b-0">
                  <div className="w-24 p-3 border-r flex items-center justify-center">
                    {courseIndex === 0 && (
                      <div className="flex items-center space-x-1 text-sm font-medium">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span>{regionData.region}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-32 p-3 flex items-center text-sm font-medium">
                    {course.name}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 우측 스크롤 영역 - 날짜 컬럼들 */}
          <div 
            id="matrix-scroll-container"
            className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300"
          >
            <div className="min-w-max">
              {/* 날짜 헤더 */}
              <div className="flex border-b bg-gray-100">
                {dateColumns.map(dateCol => (
                  <div 
                    key={dateCol.date}
                    className={`w-32 p-3 border-r text-center text-xs ${
                      dateCol.isToday ? 'bg-blue-50 text-blue-700 font-semibold' :
                      dateCol.isWeekend ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{dateCol.displayDate}</div>
                    <div className={`text-xs ${dateCol.isWeekend ? 'text-red-500' : 'text-gray-500'}`}>
                      {dateCol.dayOfWeek}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 데이터 행들 */}
              {matrixData.map(regionData => 
                regionData.golfCourses.map(course => (
                  <div key={course.id} className="flex border-b last:border-b-0">
                    {course.dates.map(dateData => (
                      <div key={dateData.date} className="w-32 p-2 border-r">
                        <div className="flex flex-col space-y-1">
                          {/* 1부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 1)}
                            className="text-xs bg-blue-50 hover:bg-blue-100 rounded px-1 py-0.5 border transition-colors"
                          >
                            1부: {dateData.timeSlot1}
                          </button>
                          {/* 2부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 2)}
                            className="text-xs bg-green-50 hover:bg-green-100 rounded px-1 py-0.5 border transition-colors"
                          >
                            2부: {dateData.timeSlot2}
                          </button>
                          {/* 3부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 3)}
                            className="text-xs bg-orange-50 hover:bg-orange-100 rounded px-1 py-0.5 border transition-colors"
                          >
                            3부: {dateData.timeSlot3}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 rounded border"></div>
          <span>1부 (10시 이전)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 rounded border"></div>
          <span>2부 (10시-15시)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-orange-100 rounded border"></div>
          <span>3부 (15시 이후)</span>
        </div>
      </div>
    </div>
  )
}