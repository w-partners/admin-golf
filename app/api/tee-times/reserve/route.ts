import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: 티타임 예약 (10분 타이머 시작)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 매니저 이상 권한 체크
    const managerRoles = ['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN']
    if (!managerRoles.includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { teeTimeId } = await request.json()

    // 티타임 조회
    const teeTime = await prisma.teeTime.findUnique({
      where: { id: teeTimeId }
    })

    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time not found' }, { status: 404 })
    }

    // 이미 예약된 티타임인지 확인
    if (teeTime.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Tee time is not available' }, { status: 409 })
    }

    // 예약 상태로 변경 및 10분 타이머 시작
    const reservedAt = new Date()
    const updatedTeeTime = await prisma.teeTime.update({
      where: { id: teeTimeId },
      data: {
        status: 'RESERVED',
        reservedAt,
        managerId: session.user.id
      },
      include: {
        golfCourse: true,
        manager: true
      }
    })

    return NextResponse.json({
      ...updatedTeeTime,
      expiresAt: new Date(reservedAt.getTime() + 10 * 60 * 1000) // 10분 후
    })
  } catch (error) {
    console.error('Failed to reserve tee time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}