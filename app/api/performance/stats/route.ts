import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper functions
function isManager(accountType: string): boolean {
  const managerTypes = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER']
  return managerTypes.includes(accountType)
}

function validateRequest(schema: any, data: any) {
  // Simple validation for required fields
  const { period = 'monthly', groupBy, startDate, endDate } = data
  
  if (!startDate || !endDate) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'startDate and endDate are required'
    }
  }
  
  const validPeriods = ['daily', 'weekly', 'monthly', 'yearly']
  const validGroupBy = ['manager', 'team', 'golfCourse', 'region']
  
  if (!validPeriods.includes(period)) {
    throw {
      code: 'VALIDATION_ERROR', 
      message: 'Invalid period'
    }
  }
  
  if (groupBy && !validGroupBy.includes(groupBy)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Invalid groupBy'
    }
  }
  
  return { period, groupBy, startDate, endDate }
}

// GET: 실적 통계 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ 
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다' 
      }, { status: 401 })
    }

    // 매니저 이상 권한 체크
    if (!isManager(session.user.accountType)) {
      return NextResponse.json({ 
        code: 'FORBIDDEN',
        message: '매니저 이상의 권한이 필요합니다' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = validateRequest(null, params)

    // 기간별 필터 조건
    const whereCondition = {
      completedAt: {
        gte: new Date(validatedParams.startDate),
        lte: new Date(`${validatedParams.endDate}T23:59:59.999Z`),
      }
    }

    // 실적 데이터 조회
    const performances = await prisma.performance.findMany({
      where: whereCondition,
      include: {
        teeTime: {
          include: {
            golfCourse: true,
            manager: {
              include: {
                team: true
              }
            }
          }
        }
      }
    })

    // 그룹별 통계 계산
    const statsMap = new Map<string, any>()

    performances.forEach(performance => {
      let groupKey: string
      let label: string

      // groupBy 기준에 따라 그룹 키 생성
      switch (validatedParams.groupBy) {
        case 'manager':
          groupKey = performance.teeTime.manager?.id || 'unknown'
          label = performance.teeTime.manager?.name || 'Unknown'
          break
        case 'team':
          groupKey = performance.teeTime.manager?.team?.id || 'no-team'
          label = performance.teeTime.manager?.team?.name || 'No Team'
          break
        case 'golfCourse':
          groupKey = performance.teeTime.golfCourse.id
          label = performance.teeTime.golfCourse.name
          break
        case 'region':
          groupKey = performance.teeTime.golfCourse.region
          label = performance.teeTime.golfCourse.region
          break
        default:
          // period별로만 그룹화
          const date = new Date(performance.completedAt)
          switch (validatedParams.period) {
            case 'daily':
              groupKey = date.toISOString().split('T')[0]
              label = groupKey
              break
            case 'weekly':
              const weekStart = new Date(date)
              weekStart.setDate(date.getDate() - date.getDay())
              groupKey = weekStart.toISOString().split('T')[0]
              label = `Week of ${groupKey}`
              break
            case 'monthly':
              groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              label = groupKey
              break
            case 'yearly':
              groupKey = String(date.getFullYear())
              label = groupKey
              break
          }
      }

      // 통계 누적
      if (!statsMap.has(groupKey)) {
        statsMap.set(groupKey, {
          label,
          revenue: 0,
          count: 0,
          totalGreenFee: 0,
        })
      }

      const stats = statsMap.get(groupKey)
      stats.revenue += performance.revenue
      stats.count += 1
      stats.totalGreenFee += performance.actualGreenFee
    })

    // Map을 배열로 변환하고 평균 계산
    const stats = Array.from(statsMap.values()).map(stat => ({
      label: stat.label,
      revenue: stat.revenue,
      count: stat.count,
      averageGreenFee: stat.count > 0 ? stat.totalGreenFee / stat.count : 0,
    }))

    // 정렬 (날짜/이름 기준)
    stats.sort((a, b) => {
      if (validatedParams.period && !validatedParams.groupBy) {
        // 날짜 기준 정렬
        return a.label.localeCompare(b.label)
      }
      // 수익 기준 내림차순 정렬
      return b.revenue - a.revenue
    })

    return NextResponse.json({
      period: validatedParams.period,
      stats
    })
  } catch (error) {
    console.error('Failed to get performance stats:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(error, { status: 400 })
    }
    
    return NextResponse.json({ 
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다' 
    }, { status: 500 })
  }
}