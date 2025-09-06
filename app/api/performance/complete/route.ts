import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompletePerformanceRequestSchema, validateRequest, isManager } from '@/lib/api/validation'

// POST: 티타임 완료 등록
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = validateRequest(CompletePerformanceRequestSchema, body)

    // 티타임 조회
    const teeTime = await prisma.teeTime.findUnique({
      where: { id: validatedData.teeTimeId },
      include: {
        golfCourse: true,
        manager: true,
      }
    })

    if (!teeTime) {
      return NextResponse.json({ 
        code: 'NOT_FOUND',
        message: '티타임을 찾을 수 없습니다' 
      }, { status: 404 })
    }

    // 확정된 티타임만 완료 처리 가능
    if (teeTime.status !== 'CONFIRMED') {
      return NextResponse.json({ 
        code: 'INVALID_STATUS',
        message: '확정된 티타임만 완료 처리할 수 있습니다' 
      }, { status: 409 })
    }

    // 실적 데이터 생성 및 티타임 상태 업데이트
    const [performance, updatedTeeTime] = await prisma.$transaction([
      // Performance 생성
      prisma.performance.create({
        data: {
          teeTimeId: validatedData.teeTimeId,
          completedAt: new Date(),
          actualPlayerCount: validatedData.actualPlayerCount,
          actualGreenFee: validatedData.actualGreenFee,
          revenue: validatedData.actualPlayerCount * validatedData.actualGreenFee,
          notes: validatedData.notes,
          registeredBy: session.user.id,
        },
        include: {
          teeTime: {
            include: {
              golfCourse: true,
              manager: true,
            }
          },
          registeredByUser: true,
        }
      }),
      // TeeTime 상태 업데이트
      prisma.teeTime.update({
        where: { id: validatedData.teeTimeId },
        data: {
          status: 'COMPLETED',
        }
      })
    ])

    return NextResponse.json(performance, { status: 201 })
  } catch (error) {
    console.error('Failed to complete performance:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(error, { status: 400 })
    }
    
    // Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ 
        code: 'CONFLICT',
        message: '이미 완료 처리된 티타임입니다' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다' 
    }, { status: 500 })
  }
}