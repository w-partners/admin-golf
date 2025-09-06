import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isReservationExpired } from '@/lib/business-logic'

// POST: 예약 확정 (자신 + 팀장 이상만 가능)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teeTimeId } = await request.json()

    // 티타임 조회
    const teeTime = await prisma.teeTime.findUnique({
      where: { id: teeTimeId },
      include: {
        manager: {
          include: {
            team: true
          }
        }
      }
    })

    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time not found' }, { status: 404 })
    }

    // 예약 상태가 아닌 경우
    if (teeTime.status !== 'RESERVED') {
      return NextResponse.json({ error: 'Tee time is not in reserved status' }, { status: 409 })
    }

    // 10분 타이머 만료 확인
    if (isReservationExpired(teeTime.reservedAt)) {
      // 자동으로 AVAILABLE로 되돌림
      await prisma.teeTime.update({
        where: { id: teeTimeId },
        data: {
          status: 'AVAILABLE',
          reservedAt: null,
          managerId: null
        }
      })
      return NextResponse.json({ error: 'Reservation has expired' }, { status: 410 })
    }

    // 권한 확인: 자신 + 팀장 이상만 확정 가능
    const canConfirm = 
      teeTime.managerId === session.user.id || // 자신이 예약한 것
      ['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.accountType) || // 팀장 이상
      (session.user.team?.leaderId === session.user.id && // 팀장이고
       teeTime.manager?.teamId === session.user.teamId) // 같은 팀

    if (!canConfirm) {
      return NextResponse.json({ error: 'Cannot confirm this reservation' }, { status: 403 })
    }

    // 예약 확정
    const confirmedTeeTime = await prisma.teeTime.update({
      where: { id: teeTimeId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: session.user.id
      },
      include: {
        golfCourse: true,
        manager: true,
        confirmedBy: true
      }
    })

    return NextResponse.json(confirmedTeeTime)
  } catch (error) {
    console.error('Failed to confirm reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}