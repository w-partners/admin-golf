import { NextRequest, NextResponse } from 'next/server'
import { matrixQuerySchema, validateRequest } from '@/lib/validators/api'
import { prisma } from '@/lib/prisma'
import { Region } from '@prisma/client'

// 날짜 생성 함수
function generateDateColumns(days: number = 90) {
  const columns = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    const isToday = i === 0
    const dayOfWeek = date.toLocaleDateString('ko-KR', { weekday: 'short' })
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
    
    // 입력값 검증
    const queryParams = {
      type: searchParams.get('type') || undefined,
      booking: searchParams.get('booking') || undefined,
      days: searchParams.get('days') || undefined
    }
    
    const validation = validateRequest(queryParams, matrixQuerySchema)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: '잘못된 요청 파라미터입니다',
          details: validation.errors.format()
        },
        { status: 400 }
      )
    }
    
    const { type: teeTimeType, booking: bookingType, days } = validation.data
    
    // 날짜 컬럼 생성
    const dateColumns = generateDateColumns(days)
    
    // 데이터베이스에서 골프장 조회 (엑셀시트처럼 단순하게)
    const golfCourses = await prisma.golfCourse.findMany({
      orderBy: [
        { region: 'asc' },
        { name: 'asc' }
      ]
    })
    
    // 데이터베이스에서 실제 존재하는 지역만 가져오기 (엑셀시트처럼 동적으로)
    const existingRegions = [...new Set(golfCourses.map(gc => gc.region))].sort()
    
    // 지역별 매트릭스 데이터 생성 (한글 지역명 사용)
    const matrixData = existingRegions.map(region => {
      const regionalCourses = golfCourses.filter(gc => gc.region === region)
      
      // 골프장이 없는 지역은 빈 배열 반환 (지역은 표시되지만 골프장 행은 없음)
      return {
        region: region, // 한글 지역명 직접 사용
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
    
    // 빈 지역은 제거 (골프장이 하나도 없는 지역)
    const filteredMatrixData = matrixData.filter(regionData => regionData.golfCourses.length > 0)
    
    // 요약 정보 계산
    const totalGolfCourses = golfCourses.length
    const totalTeeTimes = matrixData.reduce((total, regionData) => {
      return total + regionData.golfCourses.reduce((regionTotal, course) => {
        return regionTotal + course.dates.reduce((dateTotal, dateData) => {
          return dateTotal + dateData.total
        }, 0)
      }, 0)
    }, 0)
    
    const response = {
      matrixData: filteredMatrixData,
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
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Matrix API error:', error)
    return NextResponse.json(
      { error: '매트릭스 데이터를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}