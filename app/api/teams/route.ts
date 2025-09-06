import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/teams - 팀 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        leaderId: true,
        createdAt: true,
        leader: {
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            phone: true,
            accountType: true,
            isActive: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            members: true,
            teeTimes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ teams })
  } catch (error) {
    console.error('GET /api/teams error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// POST /api/teams - 새 팀 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, leaderId } = body

    // 필수 필드 검증
    if (!name || !leaderId) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // 팀장 사용자 확인
    const leader = await prisma.user.findUnique({
      where: { id: parseInt(leaderId) }
    })

    if (!leader) {
      return NextResponse.json(
        { error: 'Team leader not found' }, 
        { status: 404 }
      )
    }

    // 팀장의 계정 유형을 TEAM_LEADER로 업데이트
    if (leader.accountType !== 'TEAM_LEADER') {
      await prisma.user.update({
        where: { id: leader.id },
        data: { accountType: 'TEAM_LEADER' }
      })
    }

    // 기존 팀 확인 (한 사용자는 하나의 팀만 리드 가능)
    const existingTeam = await prisma.team.findUnique({
      where: { leaderId: leader.id }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'User is already leading a team' }, 
        { status: 400 }
      )
    }

    const newTeam = await prisma.team.create({
      data: {
        name,
        leaderId: leader.id
      },
      select: {
        id: true,
        name: true,
        leaderId: true,
        createdAt: true,
        leader: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      message: 'Team created successfully',
      team: newTeam 
    })
  } catch (error) {
    console.error('POST /api/teams error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}