import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isReservationExpired } from '@/lib/api/validation'

// GET: 예약 타이머 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ 
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다' 
      }, { status: 401 })
    }

    const { id } = await params

    // 티타임 조회
    const teeTime = await prisma.teeTime.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        reservedAt: true,
        managerId: true,
      }
    })

    if (!teeTime) {
      return NextResponse.json({ 
        code: 'NOT_FOUND',
        message: '티타임을 찾을 수 없습니다' 
      }, { status: 404 })
    }

    // 예약 상태가 아닌 경우
    if (teeTime.status !== 'RESERVED' || !teeTime.reservedAt) {
      return NextResponse.json({
        teeTimeId: id,
        status: teeTime.status,
        reservedAt: null,
        expiresAt: null,
        remainingSeconds: 0,
        isExpired: false,
      })
    }

    const reservedAt = new Date(teeTime.reservedAt)
    const expiresAt = new Date(reservedAt.getTime() + 10 * 60 * 1000) // 10분 후
    const now = new Date()
    const remainingMs = expiresAt.getTime() - now.getTime()
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000))
    const isExpired = isReservationExpired(teeTime.reservedAt)

    // 만료된 경우 자동으로 상태 변경
    if (isExpired && teeTime.status === 'RESERVED') {
      await prisma.teeTime.update({
        where: { id },
        data: {
          status: 'AVAILABLE',
          reservedAt: null,
          managerId: null,
        }
      })

      return NextResponse.json({
        teeTimeId: id,
        status: 'AVAILABLE',
        reservedAt: reservedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        remainingSeconds: 0,
        isExpired: true,
      })
    }

    return NextResponse.json({
      teeTimeId: id,
      status: teeTime.status,
      reservedAt: reservedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      remainingSeconds,
      isExpired,
    })
  } catch (error) {
    console.error('Failed to get timer status:', error)
    return NextResponse.json({ 
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다' 
    }, { status: 500 })
  }
}