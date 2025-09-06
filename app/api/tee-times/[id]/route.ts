import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Get single tee time by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teeTime = await prisma.teeTime.findUnique({
      where: { id: params.id },
      include: {
        golfCourse: true,
        reservedBy: true,
        confirmedBy: true,
        relatedTeeTimes: {
          include: {
            golfCourse: true
          }
        }
      }
    });

    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time not found' }, { status: 404 });
    }

    // Check if user can view this tee time
    if (session.user.accountType === 'GOLF_COURSE' && 
        session.user.golfCourseId !== teeTime.golfCourseId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    return NextResponse.json(teeTime);
  } catch (error) {
    console.error('Failed to fetch tee time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}