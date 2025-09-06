import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/users/[id] - 특정 사용자 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(resolvedParams.id)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
            confirmedTeeTimes: true,
            performances: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('GET /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - 사용자 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { name, phone, accountType, isActive, teamLeaderId } = body

    // 기존 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 중복 연락처 확인 (자신 제외)
    if (phone && phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone }
      })

      if (phoneExists) {
        return NextResponse.json(
          { error: 'Phone number already exists' }, 
          { status: 400 }
        )
      }
    }

    const updateData: unknown = {
      name,
      phone,
      accountType,
      isActive
    }

    // 팀 설정 처리
    if (accountType && !['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'].includes(accountType)) {
      if (teamLeaderId) {
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
          updateData.teamId = teamLeader.teamLead.id
        }
      } else {
        updateData.teamId = null
      }
    } else {
      updateData.teamId = null
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        }
      }
    })

    // 팀장으로 변경된 경우 팀 생성
    if (accountType === 'TEAM_LEADER' && existingUser.accountType !== 'TEAM_LEADER') {
      const existingTeam = await prisma.team.findUnique({
        where: { leaderId: userId }
      })

      if (!existingTeam) {
        await prisma.team.create({
          data: {
            name: `${name} 팀`,
            leaderId: userId
          }
        })
      }
    }
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    })
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - 부분 업데이트 (상태 변경 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(resolvedParams.id)
    const body = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    })
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 최고관리자만 삭제 가능
    if (session.user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(resolvedParams.id)

    // 자기 자신 삭제 방지
    if (session.user.id === userId.toString()) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' }, 
        { status: 400 }
      )
    }

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountType: true,
        teamLead: {
          select: {
            id: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 팀장인 경우 팀도 함께 삭제
    if (existingUser.accountType === 'TEAM_LEADER' && existingUser.teamLead) {
      await prisma.team.delete({
        where: { id: existingUser.teamLead.id }
      })
    }

    await prisma.user.delete({
      where: { id: userId }
    })
    
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}