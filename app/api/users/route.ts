import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - 사용자 목록 조회
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        accountType: true,
        isActive: true,
        teamId: true,
        createdAt: true,
        lastLoginAt: true,
        team: {
          select: {
            id: true,
            name: true,
            leaderId: true,
            leader: {
              select: {
                name: true
              }
            }
          }
        },
        teamLead: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true
              }
            }
          }
        },
        _count: {
          select: {
            teeTimes: true,
            confirmedTeeTimes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// POST /api/users - 새 사용자 생성
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
    const { name, phone, password, accountType, isActive, teamLeaderId } = body

    // 필수 필드 검증
    if (!name || !phone || !password || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // 중복 연락처 확인
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already exists' }, 
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // 사용자 생성
    const createData: any = {
      name,
      phone,
      password: hashedPassword,
      accountType,
      isActive: isActive ?? true
    }

    // 팀 리더가 지정된 경우 팀 설정
    if (teamLeaderId && !['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'].includes(accountType)) {
      const teamLeader = await prisma.user.findFirst({
        where: {
          id: parseInt(teamLeaderId),
          accountType: 'TEAM_LEADER'
        },
        select: {
          teamLead: {
            select: {
              id: true
            }
          }
        }
      })

      if (teamLeader?.teamLead) {
        createData.teamId = teamLeader.teamLead.id
      }
    }

    const newUser = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        name: true,
        phone: true,
        accountType: true,
        isActive: true,
        createdAt: true
      }
    })

    // 팀장인 경우 팀 생성
    if (accountType === 'TEAM_LEADER') {
      await prisma.team.create({
        data: {
          name: `${name} 팀`,
          leaderId: newUser.id
        }
      })
    }
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user: newUser 
    })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}