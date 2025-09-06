'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { GOLF_COURSES, REGIONS } from '@/lib/constants/golf-courses'
import type { RegionData, DateColumn, TeeTimeCount } from '@/types/matrix'

// 날짜 생성 (메모이제이션)
const generateDates = (days: number = 30): DateColumn[] => {
  const dates: DateColumn[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    dates.push({
      date: date.toISOString().split('T')[0],
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      isToday: i === 0,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  
  return dates
}

// 티타임 수량 생성 (순수 함수)
const generateTeeTimeCounts = (courseId: string, dateIndex: number): TeeTimeCount => {
  const courseVariation = parseInt(courseId) % 5 + 1
  const dateVariation = Math.max(0.3, 1 - (dateIndex * 0.02))
  const randomVariation = 0.7 + (Math.random() * 0.6)
  
  const baseCount = 10 * courseVariation * dateVariation * randomVariation
  
  return {
    timeSlot1: Math.floor(baseCount * 0.2),
    timeSlot2: Math.floor(baseCount * 0.6),
    timeSlot3: Math.floor(baseCount * 0.2),
  }
}

export default function OptimizedDemoPage() {
  const [activeTab, setActiveTab] = useState('daily-booking')
  const [matrixData, setMatrixData] = useState<RegionData[]>([])
  const [refreshTime, setRefreshTime] = useState('')

  // 날짜 컬럼을 메모이제이션
  const dateColumns = useMemo(() => generateDates(30), [])

  // 데이터 생성 함수를 useCallback으로 메모이제이션
  const generateData = useCallback(() => {
    const data: RegionData[] = REGIONS.map(region => {
      const regionalCourses = GOLF_COURSES.filter(gc => gc.region === region)
      
      return {
        region,
        golfCourses: regionalCourses.map(course => ({
          id: course.id,
          name: course.name,
          dates: dateColumns.map((_, dateIndex) => {
            const counts = generateTeeTimeCounts(course.id, dateIndex)
            return {
              date: dateColumns[dateIndex].date,
              ...counts,
              total: counts.timeSlot1 + counts.timeSlot2 + counts.timeSlot3
            }
          })
        }))
      }
    })
    
    setMatrixData(data)
    setRefreshTime(new Date().toLocaleTimeString('ko-KR'))
  }, [dateColumns])

  // 초기 데이터 로드
  useEffect(() => {
    generateData()
  }, [generateData])

  // 셀 클릭 핸들러 (useCallback으로 메모이제이션)
  const handleCellClick = useCallback((courseId: string, date: string, timeSlot: number) => {
    console.log(`선택: 골프장 ${courseId}, 날짜 ${date}, ${timeSlot}부`)
    // TODO: 라우터를 통해 상세 페이지로 이동
    // router.push(`/tee-times/${courseId}/${date}?slot=${timeSlot}`)
  }, [])

  // 탭 제목 가져오기 (메모이제이션)
  const tabTitle = useMemo(() => {
    const titles: Record<string, string> = {
      'daily-booking': '데일리부킹 (4명)',
      'daily-join': '데일리조인 (1-3명)',
      'package-booking': '패키지부킹',
      'package-join': '패키지조인'
    }
    return titles[activeTab] || ''
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
          🏌️ 골프장 예약 관리 시스템 - Matrix View
        </h1>
        
        {/* 탭 버튼들 */}
        <div className="flex space-x-2 mb-6 bg-white p-2 rounded-lg shadow">
          {[
            { key: 'daily-booking', label: '데일리부킹' },
            { key: 'daily-join', label: '데일리조인' },
            { key: 'package-booking', label: '패키지부킹' },
            { key: 'package-join', label: '패키지조인' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeTab === tab.key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-pressed={activeTab === tab.key}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 현재 탭 제목 및 새로고침 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{tabTitle}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              마지막 업데이트: {refreshTime || '로딩 중...'}
            </span>
            <button 
              onClick={generateData}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              aria-label="데이터 새로고침"
            >
              🔄 새로고침
            </button>
          </div>
        </div>

        {/* Matrix 테이블 - 엑셀 스타일 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex">
            {/* 좌측 고정 열 - 지역/골프장 */}
            <div className="flex-shrink-0 bg-gray-50 border-r-2 border-gray-300">
              {/* 헤더 */}
              <div className="flex border-b-2 border-gray-300 bg-gradient-to-b from-blue-100 to-blue-200">
                <div className="w-20 px-2 py-3 border-r border-gray-300 font-bold text-center text-xs">
                  지역
                </div>
                <div className="w-32 px-2 py-3 font-bold text-center text-xs">
                  골프장
                </div>
              </div>
              
              {/* 데이터 행들 */}
              {matrixData.map(regionData =>
                regionData.golfCourses.map((course, courseIndex) => (
                  <div 
                    key={course.id} 
                    className="flex border-b border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-20 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                      {courseIndex === 0 && (
                        <span className="text-xs font-bold text-blue-700">
                          {regionData.region}
                        </span>
                      )}
                    </div>
                    <div className="w-32 px-2 py-3 flex items-center text-xs font-medium">
                      {course.name}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 우측 스크롤 영역 - 날짜 열들 */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-max">
                {/* 날짜 헤더 */}
                <div className="flex border-b-2 border-gray-300 bg-gradient-to-b from-green-100 to-green-200 sticky top-0 z-10">
                  {dateColumns.map(dateCol => (
                    <div 
                      key={dateCol.date}
                      className={`w-28 px-1 py-2 border-r border-gray-200 text-center ${
                        dateCol.isToday ? 'bg-yellow-200 border-yellow-400' :
                        dateCol.isWeekend ? 'bg-red-100' : ''
                      }`}
                    >
                      <div className={`font-bold text-xs ${
                        dateCol.isToday ? 'text-red-700' :
                        dateCol.isWeekend ? 'text-red-600' : 'text-green-700'
                      }`}>
                        {dateCol.displayDate}
                      </div>
                      <div className={`text-xs ${
                        dateCol.isToday ? 'text-red-600' :
                        dateCol.isWeekend ? 'text-red-500' : 'text-green-600'
                      }`}>
                        {dateCol.dayOfWeek}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 데이터 행들 */}
                {matrixData.map(regionData =>
                  regionData.golfCourses.map(course => (
                    <div key={course.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                      {course.dates.map((dateData, dateIndex) => {
                        const dateCol = dateColumns[dateIndex]
                        return (
                          <div 
                            key={dateData.date} 
                            className={`w-28 px-1 py-1 border-r border-gray-200 ${
                              dateCol?.isToday ? 'bg-yellow-50' :
                              dateCol?.isWeekend ? 'bg-red-50/30' : ''
                            }`}
                          >
                            <div className="space-y-0.5">
                              {/* 1부 */}
                              <TimeSlotButton
                                courseId={course.id}
                                date={dateData.date}
                                slot={1}
                                count={dateData.timeSlot1}
                                colorScheme="blue"
                                onClick={handleCellClick}
                              />
                              {/* 2부 */}
                              <TimeSlotButton
                                courseId={course.id}
                                date={dateData.date}
                                slot={2}
                                count={dateData.timeSlot2}
                                colorScheme="green"
                                onClick={handleCellClick}
                              />
                              {/* 3부 */}
                              <TimeSlotButton
                                courseId={course.id}
                                date={dateData.date}
                                slot={3}
                                count={dateData.timeSlot3}
                                colorScheme="orange"
                                onClick={handleCellClick}
                              />
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

        {/* 범례 */}
        <Legend />

        {/* 요약 정보 */}
        <Summary 
          golfCoursesCount={GOLF_COURSES.length}
          regionsCount={matrixData.length}
          tabTitle={tabTitle}
        />
      </div>
    </div>
  )
}

// 타임슬롯 버튼 컴포넌트 (재사용 가능)
interface TimeSlotButtonProps {
  courseId: string
  date: string
  slot: number
  count: number
  colorScheme: 'blue' | 'green' | 'orange'
  onClick: (courseId: string, date: string, slot: number) => void
}

function TimeSlotButton({ courseId, date, slot, count, colorScheme, onClick }: TimeSlotButtonProps) {
  const colors = {
    blue: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800',
    green: 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800',
    orange: 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800'
  }
  
  return (
    <button
      onClick={() => onClick(courseId, date, slot)}
      className={`text-xs rounded px-1 py-0.5 border w-full transition-all text-center ${
        count > 0 
          ? `${colors[colorScheme]} font-bold cursor-pointer` 
          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
      }`}
      disabled={count === 0}
      aria-label={`${slot}부 ${count}개 티타임`}
    >
      {slot}부: {count}
    </button>
  )
}

// 범례 컴포넌트
function Legend() {
  return (
    <div className="mt-4 flex justify-center space-x-6 text-xs">
      <div className="flex items-center space-x-1">
        <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
        <span>1부 (10시 이전)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
        <span>2부 (10시-15시)</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded" />
        <span>3부 (15시 이후)</span>
      </div>
    </div>
  )
}

// 요약 정보 컴포넌트
interface SummaryProps {
  golfCoursesCount: number
  regionsCount: number
  tabTitle: string
}

function Summary({ golfCoursesCount, regionsCount, tabTitle }: SummaryProps) {
  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">📊 현황 요약</h3>
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <span className="font-medium">골프장 수:</span> {golfCoursesCount}개
        </div>
        <div>
          <span className="font-medium">조회 기간:</span> 30일
        </div>
        <div>
          <span className="font-medium">현재 탭:</span> {tabTitle}
        </div>
        <div>
          <span className="font-medium">총 지역:</span> {regionsCount}개
        </div>
      </div>
    </div>
  )
}