import { NextRequest, NextResponse } from 'next/server'
import { matrixQuerySchema, validateRequest } from '@/lib/validators/api'

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

// 캐시 저장소
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // 1분

// 날짜 생성 함수 (최적화)
function generateDateColumns(days: number = 90) {
  const columns = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const dayOfWeek = date.getDay()
    
    columns.push({
      date: date.toISOString().split('T')[0],
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
      isToday: i === 0,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    })
  }
  
  return columns
}

// 티타임 수량 생성 (최적화 - 사전 계산)
const teeTimeCache = new Map<string, any>()

function generateTeeTimeCounts(teeTimeType: string, bookingType: string, golfCourseId: string, dateIndex: number) {
  const cacheKey = `${teeTimeType}-${bookingType}-${golfCourseId}-${dateIndex}`
  
  if (teeTimeCache.has(cacheKey)) {
    return teeTimeCache.get(cacheKey)
  }
  
  // 골프장별 기본 수량 차이
  const courseVariation = parseInt(golfCourseId) % 5 + 1
  
  // 기본 수량
  let baseCount = 0
  if (teeTimeType === 'DAILY') {
    baseCount = bookingType === 'BOOKING' ? 6 : 10
  } else {
    baseCount = bookingType === 'BOOKING' ? 2 : 4
  }
  
  // 날짜별 변동
  const dateVariation = Math.max(0.3, 1 - (dateIndex * 0.01))
  
  // 랜덤 변동
  const randomVariation = 0.8 + (Math.random() * 0.4)
  
  const finalCount = baseCount * courseVariation * dateVariation * randomVariation
  
  const result = {
    timeSlot1: Math.floor(finalCount * 0.2),
    timeSlot2: Math.floor(finalCount * 0.6),
    timeSlot3: Math.floor(finalCount * 0.2),
  }
  
  teeTimeCache.set(cacheKey, result)
  return result
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
    
    // 캐시 확인
    const cacheKey = `${teeTimeType}-${bookingType}-${days}`
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
        }
      })
    }
    
    // 날짜 컬럼 생성
    const dateColumns = generateDateColumns(days)
    
    // 지역별로 그룹화 (최적화)
    const regionMap = new Map<string, typeof GOLF_COURSES>()
    for (const course of GOLF_COURSES) {
      if (!regionMap.has(course.region)) {
        regionMap.set(course.region, [])
      }
      regionMap.get(course.region)!.push(course)
    }
    
    // 병렬 처리를 위한 Promise 배열
    const matrixPromises = Array.from(regionMap.entries()).map(async ([region, courses]) => {
      return {
        region,
        golfCourses: courses.map(course => {
          // 날짜별 데이터를 청크로 처리
          const dates = dateColumns.map((dateCol, dateIndex) => {
            const counts = generateTeeTimeCounts(teeTimeType, bookingType, course.id, dateIndex)
            return {
              date: dateCol.date,
              ...counts,
              total: counts.timeSlot1 + counts.timeSlot2 + counts.timeSlot3
            }
          })
          
          return {
            id: course.id,
            name: course.name,
            dates
          }
        })
      }
    })
    
    const matrixData = await Promise.all(matrixPromises)
    
    // 요약 정보 계산 (최적화)
    let totalTeeTimes = 0
    for (const regionData of matrixData) {
      for (const course of regionData.golfCourses) {
        for (const dateData of course.dates) {
          totalTeeTimes += dateData.total
        }
      }
    }
    
    const response = {
      matrixData,
      dateColumns,
      summary: {
        totalGolfCourses: GOLF_COURSES.length,
        totalTeeTimes,
        teeTimeType,
        bookingType,
        dateRange: {
          start: dateColumns[0]?.date || '',
          end: dateColumns[dateColumns.length - 1]?.date || ''
        }
      }
    }
    
    // 캐시 저장
    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    
    // 인위적 지연 제거 - 실제 데이터베이스 호출시에만 필요
    
    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
      }
    })
    
  } catch (error) {
    console.error('Matrix API error:', error)
    return NextResponse.json(
      { error: '매트릭스 데이터를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}