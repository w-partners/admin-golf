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
  const { startDate, endDate, managerId, teamId, golfCourseId } = data
  
  if (!startDate || !endDate) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'startDate and endDate are required'
    }
  }
  
  return { startDate, endDate, managerId, teamId, golfCourseId }
}

// GET: 실적 요약 조회
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

    // 필터 조건 구성
    const whereCondition: unknown = {
      completedAt: {
        gte: new Date(validatedParams.startDate),
        lte: new Date(`${validatedParams.endDate}T23:59:59.999Z`),
      }
    }

    // 매니저별 필터
    if (validatedParams.managerId) {
      whereCondition.teeTime = {
        managerId: validatedParams.managerId
      }
    }

    // 팀별 필터
    if (validatedParams.teamId) {
      whereCondition.teeTime = {
        ...whereCondition.teeTime,
        manager: {
          teamId: validatedParams.teamId
        }
      }
    }

    // 골프장별 필터
    if (validatedParams.golfCourseId) {
      whereCondition.teeTime = {
        ...whereCondition.teeTime,
        golfCourseId: validatedParams.golfCourseId
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
        },
        registeredByUser: true,
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // 요약 통계 계산
    const totalRevenue = performances.reduce((sum, p) => sum + p.revenue, 0)
    const totalCount = performances.length
    const averageGreenFee = totalCount > 0 
      ? performances.reduce((sum, p) => sum + p.actualGreenFee, 0) / totalCount 
      : 0

    return NextResponse.json({
      totalRevenue,
      totalCount,
      averageGreenFee,
      performances
    })
  } catch (error) {
    console.error('Failed to get performance summary:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(error, { status: 400 })
    }
    
    return NextResponse.json({ 
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다' 
    }, { status: 500 })
  }
}