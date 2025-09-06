import { NextRequest, NextResponse } from 'next/server';
import { getGolfCourseById } from '@/lib/db';

// GET: Get single golf course by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const golfCourse = await getGolfCourseById(params.id);

    if (!golfCourse) {
      return NextResponse.json({ error: 'Golf course not found' }, { status: 404 });
    }

    return NextResponse.json(golfCourse);
  } catch (error) {
    console.error('Failed to fetch golf course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}