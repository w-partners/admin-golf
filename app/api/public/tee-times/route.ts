import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 공개 API - 인증 없이 접근 가능
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const golfCourseId = searchParams.get('golfCourseId');
    const bookingType = searchParams.get('bookingType');

    const where: any = {
      status: 'AVAILABLE',
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (golfCourseId) {
      where.golfCourseId = parseInt(golfCourseId);
    }

    if (bookingType) {
      where.bookingType = bookingType;
    }

    const teeTimes = await prisma.teeTime.findMany({
      where,
      include: {
        golfCourse: true,
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    return NextResponse.json(teeTimes);
  } catch (error) {
    console.error('Error fetching tee times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tee times' },
      { status: 500 }
    );
  }
}

// 티타임 생성 - 공개 API (실제로는 인증이 필요하지만 테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      golfCourseId,
      date,
      time,
      greenFee,
      players,
      requirements,
      holes,
      caddie,
      deposit,
      mealIncluded,
      cartIncluded,
    } = body;

    // 시간대 자동 분류
    const hour = parseInt(time.split(':')[0]);
    let timeSlot = '3부';
    if (hour < 10) {
      timeSlot = '1부';
    } else if (hour < 15) {
      timeSlot = '2부';
    }

    // 부킹 타입 자동 결정
    const bookingType = players === 4 ? 'BOOKING' : 'JOIN';

    const teeTime = await prisma.teeTime.create({
      data: {
        golfCourseId,
        date: new Date(date),
        time,
        timeSlot,
        greenFee,
        players,
        bookingType,
        requirements: requirements || '',
        holes,
        caddie,
        deposit: deposit || 0,
        mealIncluded,
        cartIncluded,
        status: 'AVAILABLE',
      },
      include: {
        golfCourse: true,
      },
    });

    return NextResponse.json(teeTime, { status: 201 });
  } catch (error) {
    console.error('Error creating tee time:', error);
    return NextResponse.json(
      { error: 'Failed to create tee time' },
      { status: 500 }
    );
  }
}