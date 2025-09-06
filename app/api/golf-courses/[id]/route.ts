import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGolfCourseById } from '@/lib/db';

// GET: Get single golf course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const golfCourse = await getGolfCourseById(params.id);

    if (!golfCourse) {
      return NextResponse.json({ error: 'Golf course not found' }, { status: 404 });
    }

    // Check if user can view this golf course
    if (session.user.accountType === 'GOLF_COURSE' && 
        session.user.golfCourseId !== golfCourse.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    return NextResponse.json(golfCourse);
  } catch (error) {
    console.error('Failed to fetch golf course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}