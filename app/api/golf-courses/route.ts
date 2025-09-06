import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 골프장 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const status = searchParams.get('status')

    const where: unknown = {}
    if (region) where.region = region
    if (status) where.operationStatus = status

    // 골프장 계정은 자신의 골프장만 조회
    if (session.user.accountType === 'GOLF_COURSE') {
      where.managedById = session.user.id
    }

    const golfCourses = await prisma.golfCourse.findMany({
      where,
      include: {
        _count: {
          select: {
            teeTimes: {
              where: {
                date: { gte: new Date() }
              }
            }
          }
        }
      },
      orderBy: [
        { region: 'asc' },
        { sequence: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(golfCourses)
  } catch (error) {
    console.error('Failed to fetch golf courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 새 골프장 등록 (최고관리자만)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 최고관리자만 골프장 등록 가능
    if (session.user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admin can create golf courses' }, { status: 403 })
    }

    const data = await request.json()

    // 중복 체크
    const existingCourse = await prisma.golfCourse.findFirst({
      where: {
        OR: [
          { name: data.name },
          { phone: data.phone }
        ]
      }
    })

    if (existingCourse) {
      return NextResponse.json({ error: 'Golf course with same name or phone already exists' }, { status: 409 })
    }

    // 순번 자동 설정 (해당 지역에서 가장 큰 순번 + 1)
    const lastSequence = await prisma.golfCourse.findFirst({
      where: { region: data.region },
      orderBy: { sequence: 'desc' }
    })

    const sequence = lastSequence ? lastSequence.sequence + 1 : 1

    const golfCourse = await prisma.golfCourse.create({
      data: {
        sequence,
        region: data.region,
        name: data.name,
        address: data.address,
        phone: data.phone,
        operationStatus: data.operationStatus || 'WAITING',
        notes: data.notes,
        managedById: data.managedById
      }
    })

    return NextResponse.json(golfCourse, { status: 201 })
  } catch (error) {
    console.error('Failed to create golf course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}