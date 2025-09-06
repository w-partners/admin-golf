import { NextRequest, NextResponse } from 'next/server'

// 골프장 데이터 (8개 지역)
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

// 날짜 생성 함수
function generateDateColumns(days: number = 90) {
  const columns = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    const isToday = i === 0
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    columns.push({
      date: date.toISOString().split('T')[0],
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek,
      isToday,
      isWeekend
    })
  }
  
  return columns
}

// 티타임 수량 생성 (랜덤)
function generateTeeTimeCounts(teeTimeType: string, bookingType: string, golfCourseId: string, dateIndex: number) {
  // 골프장별 기본 수량 차이
  const courseVariation = parseInt(golfCourseId) % 5 + 1 // 1-5 배수
  
  // 기본 수량 (타입별로 다르게)
  let baseCount = 0
  if (teeTimeType === 'DAILY') {
    baseCount = bookingType === 'BOOKING' ? 6 : 10
  } else {
    baseCount = bookingType === 'BOOKING' ? 2 : 4
  }
  
  // 날짜별 변동 (미래로 갈수록 감소)
  const dateVariation = Math.max(0.3, 1 - (dateIndex * 0.01))
  
  // 랜덤 변동 (80~120%)
  const randomVariation = 0.8 + (Math.random() * 0.4)
  
  const finalCount = baseCount * courseVariation * dateVariation * randomVariation
  
  return {
    timeSlot1: Math.floor(finalCount * 0.2), // 1부: 20%
    timeSlot2: Math.floor(finalCount * 0.6), // 2부: 60% 
    timeSlot3: Math.floor(finalCount * 0.2), // 3부: 20%
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teeTimeType = searchParams.get('type') || 'DAILY'
    const bookingType = searchParams.get('booking') || 'BOOKING'
    const days = parseInt(searchParams.get('days') || '90')
    
    // 날짜 컬럼 생성
    const dateColumns = generateDateColumns(days)
    
    // 지역별로 그룹화
    const regions = [...new Set(GOLF_COURSES.map(gc => gc.region))]
    
    const matrixData = regions.map(region => {
      const regionalCourses = GOLF_COURSES.filter(gc => gc.region === region)
      
      return {
        region,
        golfCourses: regionalCourses.map(course => ({
          id: course.id,
          name: course.name,
          dates: dateColumns.map((dateCol, dateIndex) => {
            const counts = generateTeeTimeCounts(teeTimeType, bookingType, course.id, dateIndex)
            return {
              date: dateCol.date,
              ...counts,
              total: counts.timeSlot1 + counts.timeSlot2 + counts.timeSlot3
            }
          })
        }))
      }
    })
    
    // 요약 정보 계산
    const totalGolfCourses = GOLF_COURSES.length
    const totalTeeTimes = matrixData.reduce((total, regionData) => {
      return total + regionData.golfCourses.reduce((regionTotal, course) => {
        return regionTotal + course.dates.reduce((dateTotal, dateData) => {
          return dateTotal + dateData.total
        }, 0)
      }, 0)
    }, 0)
    
    const response = {
      matrixData,
      dateColumns,
      summary: {
        totalGolfCourses,
        totalTeeTimes,
        teeTimeType,
        bookingType,
        dateRange: {
          start: dateColumns[0]?.date || '',
          end: dateColumns[dateColumns.length - 1]?.date || ''
        }
      }
    }
    
    // 개발 중 지연 시뮬레이션 (실제 DB 호출처럼)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Matrix API error:', error)
    return NextResponse.json(
      { error: '매트릭스 데이터를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}