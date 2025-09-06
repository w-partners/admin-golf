'use client'

import { useState, useEffect } from 'react'

// 골프장 데이터 - 8개 지역
const GOLF_COURSES = [
  // 제주
  { id: '1', name: '취곡CC', region: '제주' },
  { id: '2', name: '포도CC', region: '제주' },  
  { id: '3', name: '라온CC', region: '제주' },
  { id: '4', name: '해비치CC', region: '제주' },
  
  // 경기남부
  { id: '5', name: '신원CC', region: '경기남부' },
  { id: '6', name: '렉스필드CC', region: '경기남부' },
  { id: '7', name: '골든베이CC', region: '경기남부' },
  
  // 경기북부
  { id: '8', name: '아시아나CC', region: '경기북부' },
  { id: '9', name: '서원밸리CC', region: '경기북부' },
  
  // 경기동부
  { id: '10', name: '리베라CC', region: '경기동부' },
  { id: '11', name: '솔모로CC', region: '경기동부' },
  
  // 강원
  { id: '12', name: '비발디파크CC', region: '강원' },
  { id: '13', name: '파인리즈CC', region: '강원' },
  
  // 충남
  { id: '14', name: '실크리버CC', region: '충남' },
  { id: '15', name: '골드레이크CC', region: '충남' },
  
  // 경상
  { id: '16', name: '통도파인이스트CC', region: '경상' },
  { id: '17', name: '에덴밸리CC', region: '경상' },
  
  // 전라
  { id: '18', name: '남원CC', region: '전라' },
  { id: '19', name: '무주덕유산CC', region: '전라' }
]

// 날짜 생성 (30일)
function generateDates() {
  const dates = []
  const today = new Date()
  
  for (let i = 0; i < 30; i++) {
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

// 티타임 수량 생성 (랜덤)
function generateTeeTimeCounts(courseId: string, dateIndex: number) {
  const courseVariation = parseInt(courseId) % 5 + 1
  const dateVariation = Math.max(0.3, 1 - (dateIndex * 0.02))
  const randomVariation = 0.7 + (Math.random() * 0.6)
  
  const baseCount = 10 * courseVariation * dateVariation * randomVariation
  
  return {
    timeSlot1: Math.floor(baseCount * 0.2), // 1부
    timeSlot2: Math.floor(baseCount * 0.6), // 2부  
    timeSlot3: Math.floor(baseCount * 0.2), // 3부
  }
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('daily-booking')
  const [matrixData, setMatrixData] = useState<any[]>([])
  const [dateColumns, setDateColumns] = useState<any[]>([])
  const [refreshTime, setRefreshTime] = useState('')

  // 데이터 생성
  const generateData = () => {
    const dates = generateDates()
    setDateColumns(dates)
    
    const regions = [...new Set(GOLF_COURSES.map(gc => gc.region))]
    
    const data = regions.map(region => {
      const regionalCourses = GOLF_COURSES.filter(gc => gc.region === region)
      
      return {
        region,
        golfCourses: regionalCourses.map(course => ({
          id: course.id,
          name: course.name,
          dates: dates.map((_, dateIndex) => {
            const counts = generateTeeTimeCounts(course.id, dateIndex)
            return {
              date: dates[dateIndex].date,
              ...counts,
              total: counts.timeSlot1 + counts.timeSlot2 + counts.timeSlot3
            }
          })
        }))
      }
    })
    
    setMatrixData(data)
    setRefreshTime(new Date().toLocaleTimeString())
  }

  useEffect(() => {
    generateData()
  }, [activeTab])

  const handleCellClick = (courseId: string, date: string, timeSlot: number) => {
    alert(`${courseId}번 골프장, ${date} 날짜, ${timeSlot}부 클릭됨`)
  }

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'daily-booking': return '데일리부킹 (4명)'
      case 'daily-join': return '데일리조인 (1-3명)'  
      case 'package-booking': return '패키지부킹'
      case 'package-join': return '패키지조인'
      default: return ''
    }
  }

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
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 현재 탭 제목 및 새로고침 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{getTabTitle(activeTab)}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">마지막 업데이트: {refreshTime}</span>
            <button 
              onClick={generateData}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
                <div className="w-20 px-2 py-3 border-r border-gray-300 font-bold text-center text-xs">지역</div>
                <div className="w-32 px-2 py-3 font-bold text-center text-xs">골프장</div>
              </div>
              
              {/* 데이터 행들 */}
              {matrixData.map(regionData =>
                regionData.golfCourses.map((course: unknown, courseIndex: number) => (
                  <div key={course.id} className="flex border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <div className="w-20 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                      {courseIndex === 0 && (
                        <span className="text-xs font-bold text-blue-700 transform rotate-0">
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
                  regionData.golfCourses.map((course: unknown) => (
                    <div key={course.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                      {course.dates.map((dateData: unknown, dateIndex: number) => {
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
                              <button
                                onClick={() => handleCellClick(course.id, dateData.date, 1)}
                                className={`text-xs rounded px-1 py-0.5 border w-full transition-all text-center ${
                                  dateData.timeSlot1 > 0 
                                    ? 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800 font-bold cursor-pointer' 
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                                }`}
                                disabled={dateData.timeSlot1 === 0}
                              >
                                1부: {dateData.timeSlot1}
                              </button>
                              {/* 2부 */}
                              <button
                                onClick={() => handleCellClick(course.id, dateData.date, 2)}
                                className={`text-xs rounded px-1 py-0.5 border w-full transition-all text-center ${
                                  dateData.timeSlot2 > 0 
                                    ? 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800 font-bold cursor-pointer' 
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                                }`}
                                disabled={dateData.timeSlot2 === 0}
                              >
                                2부: {dateData.timeSlot2}
                              </button>
                              {/* 3부 */}
                              <button
                                onClick={() => handleCellClick(course.id, dateData.date, 3)}
                                className={`text-xs rounded px-1 py-0.5 border w-full transition-all text-center ${
                                  dateData.timeSlot3 > 0 
                                    ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800 font-bold cursor-pointer' 
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
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

        {/* 범례 */}
        <div className="mt-4 flex justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>1부 (10시 이전)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>2부 (10시-15시)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span>3부 (15시 이후)</span>
          </div>
        </div>

        {/* 요약 정보 */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">📊 현황 요약</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">골프장 수:</span> {GOLF_COURSES.length}개
            </div>
            <div>
              <span className="font-medium">조회 기간:</span> 30일
            </div>
            <div>
              <span className="font-medium">현재 탭:</span> {getTabTitle(activeTab)}
            </div>
            <div>
              <span className="font-medium">총 지역:</span> {matrixData.length}개
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}