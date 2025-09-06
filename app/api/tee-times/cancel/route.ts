import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CancelTeeTimeRequestSchema, validateRequest } from '@/lib/api/validation'

// POST: 티타임 예약 취소
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ 
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다' 
      }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = validateRequest(CancelTeeTimeRequestSchema, body)

    // 티타임 조회
    const teeTime = await prisma.teeTime.findUnique({
      where: { id: validatedData.teeTimeId },
      include: {
        manager: true,
        golfCourse: true,
      }
    })

    if (!teeTime) {
      return NextResponse.json({ 
        code: 'NOT_FOUND',
        message: '티타임을 찾을 수 없습니다' 
      }, { status: 404 })
    }

    // 예약 상태가 아닌 경우
    if (teeTime.status !== 'RESERVED') {
      return NextResponse.json({ 
        code: 'INVALID_STATUS',
        message: '취소할 수 있는 상태가 아닙니다' 
      }, { status: 409 })
    }

    // 본인 예약만 취소 가능 (관리자는 예외)
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.accountType)
    const isOwner = teeTime.managerId === session.user.id
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ 
        code: 'FORBIDDEN',
        message: '본인의 예약만 취소할 수 있습니다' 
      }, { status: 403 })
    }

    // 예약 취소 처리
    const cancelledTeeTime = await prisma.teeTime.update({
      where: { id: validatedData.teeTimeId },
      data: {
        status: 'AVAILABLE',
        reservedAt: null,
        managerId: null,
      },
      include: {
        golfCourse: true,
      }
    })

    // 취소 이력 로깅 (나중에 AuditLog 테이블 추가 시 활용)
    console.log(`Tee time cancelled: ${validatedData.teeTimeId} by ${session.user.id} - Reason: ${validatedData.reason || 'No reason provided'}`)

    return NextResponse.json(cancelledTeeTime)
  } catch (error) {
    console.error('Failed to cancel tee time:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(error, { status: 400 })
    }
    
    return NextResponse.json({ 
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다' 
    }, { status: 500 })
  }
}