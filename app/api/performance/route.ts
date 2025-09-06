import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, getCompletedTeeTimes, updateTeeTimePerformance } from '@/lib/db';

// GET: Fetch completed tee times for performance registration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const showAll = searchParams.get('showAll') === 'true';

    // For managers, show only their own unless they have permission to see all
    let managerId: string | undefined;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType) && !showAll) {
      managerId = session.user.id;
    }

    const completedTeeTimes = await getCompletedTeeTimes(managerId);

    return NextResponse.json(completedTeeTimes);
  } catch (error) {
    console.error('Failed to fetch completed tee times:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Register performance for a completed tee time
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission - only managers and above can register performance
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER'];
    if (!allowedRoles.includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { teeTimeId, commissionType, commissionAmount, settlementMethod, notes } = body;

    // Validate required fields
    if (!teeTimeId || !commissionType || !settlementMethod) {
      return NextResponse.json({ 
        error: 'Missing required fields: teeTimeId, commissionType, settlementMethod' 
      }, { status: 400 });
    }

    // Check if tee time exists and is completed
    const teeTime = await prisma.teeTime.findUnique({
      where: { id: teeTimeId }
    });

    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time not found' }, { status: 404 });
    }

    if (teeTime.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Performance can only be registered for completed tee times' 
      }, { status: 409 });
    }

    if (teeTime.performanceRegistered) {
      return NextResponse.json({ 
        error: 'Performance already registered for this tee time' 
      }, { status: 409 });
    }

    // Update tee time with performance data
    const updatedTeeTime = await updateTeeTimePerformance(teeTimeId, {
      commissionType,
      commissionAmount: commissionAmount || 0,
      settlementMethod,
      notes
    });

    return NextResponse.json(updatedTeeTime);
  } catch (error) {
    console.error('Failed to register performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mark tee time as completed
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teeTimeId } = body;

    if (!teeTimeId) {
      return NextResponse.json({ error: 'Tee time ID is required' }, { status: 400 });
    }

    // Check if tee time exists and is confirmed
    const teeTime = await prisma.teeTime.findUnique({
      where: { id: teeTimeId }
    });

    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time not found' }, { status: 404 });
    }

    if (teeTime.status !== 'CONFIRMED') {
      return NextResponse.json({ 
        error: 'Only confirmed tee times can be marked as completed' 
      }, { status: 409 });
    }

    // Mark as completed
    const updatedTeeTime = await prisma.teeTime.update({
      where: { id: teeTimeId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        golfCourse: true,
        confirmedBy: true
      }
    });

    return NextResponse.json(updatedTeeTime);
  } catch (error) {
    console.error('Failed to mark tee time as completed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}