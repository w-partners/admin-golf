'use client'

import { useState, useEffect } from 'react'
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

export function MatrixTable({ teeTimeType, bookingType, title }: MatrixTableProps) {
  const [matrixData, setMatrixData] = useState<MatrixData[]>([])
  const [dateColumns, setDateColumns] = useState<DateColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchMatrixData()
  }, [teeTimeType, bookingType])

  const fetchMatrixData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tee-times/matrix?type=${teeTimeType}&booking=${bookingType}`)
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`)
      }
      
      const data = await response.json()
      setMatrixData(data.matrixData || [])
      setDateColumns(data.dateColumns || [])
    } catch (error: unknown) {
      console.error('Matrix 데이터 로딩 실패:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = (golfCourseId: string, date: string, timeSlot: number) => {
    router.push(`/tee-times/${golfCourseId}/${date}?timeSlot=${timeSlot}&type=${teeTimeType}&booking=${bookingType}`)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMatrixData}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 매트릭스 테이블 - 정상적인 HTML Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* 헤더 */}
          <thead>
            <tr className="h-16">
              <th className="sticky left-0 z-20 bg-gray-50 border p-2 text-left w-20 align-middle h-16">지역</th>
              <th className="sticky left-20 z-20 bg-gray-50 border p-2 text-left w-32 align-middle h-16">골프장</th>
              {dateColumns.map((dateCol) => (
                <th key={dateCol.date} className={`border p-2 text-center min-w-[120px] h-16 align-middle ${
                  dateCol.isToday ? 'bg-blue-100' : 
                  dateCol.isWeekend ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  {dateCol.displayDate}({dateCol.dayOfWeek})
                </th>
              ))}
            </tr>
          </thead>

          {/* 바디 */}
          <tbody>
            {matrixData.map(regionData =>
              regionData.golfCourses.map((course, courseIndex) => (
                <tr key={course.id} className="hover:bg-gray-50 h-16">
                  {/* 지역 - 첫 번째 골프장에만 표시하고 rowspan 사용 */}
                  {courseIndex === 0 && (
                    <td 
                      rowSpan={regionData.golfCourses.length}
                      className="sticky left-0 z-10 bg-white border p-2 text-sm font-medium text-center align-middle"
                    >
                      <div className="flex flex-col items-center">
                        <MapPin className="h-4 w-4 text-emerald-600 mb-1" />
                        <span className="font-bold">{regionData.region}</span>
                      </div>
                    </td>
                  )}
                  
                  {/* 골프장명 */}
                  <td className="sticky left-20 z-10 bg-white border p-2 text-sm font-medium">
                    {course.name}
                  </td>

                  {/* 날짜별 데이터 - 1부,2부,3부 가로 배치 */}
                  {course.dates.map((dateData, dateIndex) => {
                    const dateCol = dateColumns[dateIndex]
                    return (
                      <td key={dateData.date} className={`border p-1 ${
                        dateCol?.isToday ? 'bg-blue-50/30' :
                        dateCol?.isWeekend ? 'bg-red-50/20' : ''
                      }`}>
                        <div className="grid grid-cols-3 gap-1">
                          {/* 1부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 1)}
                            className={`text-xs rounded px-1 py-1 h-8 border transition-colors font-medium ${
                              dateData.timeSlot1 > 0 
                                ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            }`}
                            disabled={dateData.timeSlot1 === 0}
                          >
                            {dateData.timeSlot1 || '-'}
                          </button>
                          
                          {/* 2부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 2)}
                            className={`text-xs rounded px-1 py-1 h-8 border transition-colors font-medium ${
                              dateData.timeSlot2 > 0 
                                ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            }`}
                            disabled={dateData.timeSlot2 === 0}
                          >
                            {dateData.timeSlot2 || '-'}
                          </button>
                          
                          {/* 3부 */}
                          <button
                            onClick={() => handleCellClick(course.id, dateData.date, 3)}
                            className={`text-xs rounded px-1 py-1 h-8 border transition-colors font-medium ${
                              dateData.timeSlot3 > 0 
                                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            }`}
                            disabled={dateData.timeSlot3 === 0}
                          >
                            {dateData.timeSlot3 || '-'}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}