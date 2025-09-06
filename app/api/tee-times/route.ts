import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { classifyTimeSlot, determineBookingType } from '@/lib/business-logic'

// GET: 티타임 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const golfCourseId = searchParams.get('golfCourseId')
    const date = searchParams.get('date')
    const teeTimeType = searchParams.get('type')
    const bookingType = searchParams.get('booking')
    const timeSlot = searchParams.get('timeSlot')

    const where: Record<string, unknown> = {}
    
    if (golfCourseId) where.golfCourseId = golfCourseId
    if (date) where.date = new Date(date)
    if (teeTimeType) where.teeTimeType = teeTimeType
    if (bookingType) where.bookingType = bookingType
    if (timeSlot) where.timeSlot = timeSlot

    // 과거 날짜 제외 (실적 등록은 예외)
    if (!searchParams.get('includeCompleted')) {
      where.date = { gte: new Date() }
    }

    const teeTimes = await prisma.teeTime.findMany({
      where,
      include: {
        golfCourse: true,
        manager: true,
        confirmedBy: true,
        connectedTeeTime: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })

    return NextResponse.json(teeTimes)
  } catch (error) {
    console.error('Failed to fetch tee times:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 새 티타임 등록
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 매니저 이상 권한 체크
    const managerRoles = ['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN']
    if (!managerRoles.includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()
    
    // 비즈니스 로직 적용
    const timeSlot = classifyTimeSlot(data.time)
    const bookingType = determineBookingType(data.playerCount)
    
    // 골프장 정보 가져오기 (지역 자동 설정)
    const golfCourse = await prisma.golfCourse.findUnique({
      where: { id: data.golfCourseId }
    })
    
    if (!golfCourse) {
      return NextResponse.json({ error: 'Golf course not found' }, { status: 404 })
    }

    // 중복 체크 (같은 골프장, 날짜, 시간)
    const existingTeeTime = await prisma.teeTime.findFirst({
      where: {
        golfCourseId: data.golfCourseId,
        date: new Date(data.date),
        time: data.time
      }
    })

    if (existingTeeTime) {
      return NextResponse.json({ error: 'Tee time already exists' }, { status: 409 })
    }

    const teeTime = await prisma.teeTime.create({
      data: {
        golfCourseId: data.golfCourseId,
        region: golfCourse.region,
        date: new Date(data.date),
        time: data.time,
        timeSlot,
        greenFee: data.greenFee,
        playerCount: data.playerCount,
        bookingType,
        requestType: data.requestType,
        holes: data.holes,
        caddyType: data.caddyType,
        deposit: data.deposit,
        mealIncluded: data.mealIncluded,
        cartFeeIncluded: data.cartFeeIncluded,
        teeTimeType: data.teeTimeType || 'DAILY',
        accommodation: data.accommodation,
        connectedId: data.connectedId,
        managerId: session.user.id,
        notes: data.notes,
        commission: data.commission || 0,
        settlementType: data.settlementType || 'POST_SETTLEMENT'
      },
      include: {
        golfCourse: true,
        manager: true
      }
    })

    return NextResponse.json(teeTime, { status: 201 })
  } catch (error) {
    console.error('Failed to create tee time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}