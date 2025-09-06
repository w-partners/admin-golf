import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: 골프장 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next.js 15에서는 params가 Promise
    
    const golfCourse = await prisma.golfCourse.findUnique({
      where: { id: parseInt(id) },
    });

    if (!golfCourse) {
      return NextResponse.json(
        { error: '골프장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json(golfCourse);
  } catch (error) {
    console.error('Golf course fetch error:', error);
    return NextResponse.json(
      { error: '골프장 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}

// PUT: 골프장 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updatedGolfCourse = await prisma.golfCourse.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        region: body.region,
        address: body.address,
        contact: body.contact,
        operStatus: body.operStatus,
        notes: body.notes,
      },
    });

    return NextResponse.json(updatedGolfCourse);
  } catch (error) {
    console.error('Golf course update error:', error);
    return NextResponse.json(
      { error: '골프장 수정에 실패했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 골프장 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.golfCourse.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: '골프장이 삭제되었습니다' });
  } catch (error) {
    console.error('Golf course delete error:', error);
    return NextResponse.json(
      { error: '골프장 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}