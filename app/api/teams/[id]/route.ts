import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/teams/[id] - 특정 팀 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamId = parseInt(resolvedParams.id)
    
    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
            accountType: true,
            isActive: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            phone: true,
            accountType: true,
            isActive: true,
            createdAt: true
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
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }
    
    return NextResponse.json({ team })
  } catch (error) {
    console.error('GET /api/teams/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// PUT /api/teams/[id] - 팀 정보 수정
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자만 접근 가능
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { name, leaderId } = body

    // 기존 팀 확인
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const updateData: unknown = {}
    
    if (name) {
      updateData.name = name
    }

    if (leaderId && leaderId !== existingTeam.leaderId) {
      // 새로운 팀장 확인
      const newLeader = await prisma.user.findUnique({
        where: { id: parseInt(leaderId) }
      })

      if (!newLeader) {
        return NextResponse.json(
          { error: 'New team leader not found' }, 
          { status: 404 }
        )
      }

      // 새 팀장이 이미 다른 팀을 리드하는지 확인
      const existingLeaderTeam = await prisma.team.findFirst({
        where: { 
          leaderId: newLeader.id,
          id: { not: teamId }
        }
      })

      if (existingLeaderTeam) {
        return NextResponse.json(
          { error: 'User is already leading another team' }, 
          { status: 400 }
        )
      }

      // 기존 팀장의 계정 타입을 일반 회원으로 변경 (다른 팀을 리드하지 않는 경우)
      const oldLeaderOtherTeams = await prisma.team.findMany({
        where: { 
          leaderId: existingTeam.leaderId,
          id: { not: teamId }
        }
      })

      if (oldLeaderOtherTeams.length === 0) {
        await prisma.user.update({
          where: { id: existingTeam.leaderId },
          data: { accountType: 'MEMBER' }
        })
      }

      // 새 팀장의 계정 타입을 TEAM_LEADER로 변경
      await prisma.user.update({
        where: { id: newLeader.id },
        data: { accountType: 'TEAM_LEADER' }
      })

      updateData.leaderId = newLeader.id
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
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
            accountType: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            phone: true,
            accountType: true,
            isActive: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      message: 'Team updated successfully',
      team: updatedTeam 
    })
  } catch (error) {
    console.error('PUT /api/teams/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - 팀 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 최고관리자만 삭제 가능
    if (session.user.accountType !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamId = parseInt(resolvedParams.id)

    // 팀 존재 확인
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        leaderId: true,
        members: {
          select: {
            id: true
          }
        }
      }
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // 팀원들의 teamId를 null로 설정
    await prisma.user.updateMany({
      where: { teamId: teamId },
      data: { teamId: null }
    })

    // 팀장의 계정 타입을 일반 회원으로 변경 (다른 팀을 리드하지 않는 경우)
    const otherTeams = await prisma.team.findMany({
      where: { 
        leaderId: existingTeam.leaderId,
        id: { not: teamId }
      }
    })

    if (otherTeams.length === 0) {
      await prisma.user.update({
        where: { id: existingTeam.leaderId },
        data: { accountType: 'MEMBER' }
      })
    }

    await prisma.team.delete({
      where: { id: teamId }
    })
    
    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/teams/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}