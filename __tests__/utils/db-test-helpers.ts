import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Test용 Prisma Client
let prisma: PrismaClient

export const getTestPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'test' ? [] : ['query', 'error', 'warn'],
    })
  }
  return prisma
}

// 데이터베이스 초기화
export const cleanDatabase = async () => {
  const prisma = getTestPrismaClient()
  
  // 순서가 중요: 외래 키 제약 때문에 역순으로 삭제
  await prisma.performance.deleteMany()
  await prisma.connectedTeeTime.deleteMany()
  await prisma.teeTime.deleteMany()
  await prisma.golfCourse.deleteMany()
  await prisma.user.deleteMany()
  await prisma.team.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.notice.deleteMany()
}

// 테스트 시드 데이터 생성
export const seedTestData = async () => {
  const prisma = getTestPrismaClient()
  
  // 시스템 설정
  await prisma.systemConfig.create({
    data: {
      key: 'RESERVATION_TIMEOUT',
      value: '10',
      description: '예약 타임아웃 (분)',
    },
  })

  // 팀 생성
  const team = await prisma.team.create({
    data: {
      id: 'test-team-1',
      name: '테스트팀1',
      leaderId: 'user-leader-1', // 나중에 업데이트
    },
  })

  // 사용자 생성
  const users = await Promise.all([
    // SUPER_ADMIN
    prisma.user.create({
      data: {
        id: 'user-super-admin',
        phone: '01034424668',
        password: await bcrypt.hash('admin1234', 10),
        name: '슈퍼관리자',
        accountType: 'SUPER_ADMIN',
        isActive: true,
      },
    }),
    // ADMIN
    prisma.user.create({
      data: {
        id: 'user-admin',
        phone: '01000000000',
        password: await bcrypt.hash('admin', 10),
        name: '관리자',
        accountType: 'ADMIN',
        isActive: true,
      },
    }),
    // TEAM_LEADER
    prisma.user.create({
      data: {
        id: 'user-leader-1',
        phone: '01000000001',
        password: await bcrypt.hash('admin', 10),
        name: '팀장1',
        accountType: 'TEAM_LEADER',
        teamId: team.id,
        isActive: true,
      },
    }),
    // INTERNAL_MANAGER
    prisma.user.create({
      data: {
        id: 'user-internal-manager',
        phone: '01011111111',
        password: await bcrypt.hash('admin', 10),
        name: '내부매니저',
        accountType: 'INTERNAL_MANAGER',
        isActive: true,
      },
    }),
    // EXTERNAL_MANAGER
    prisma.user.create({
      data: {
        id: 'user-external-manager',
        phone: '01022222222',
        password: await bcrypt.hash('admin', 10),
        name: '외부매니저',
        accountType: 'EXTERNAL_MANAGER',
        isActive: true,
      },
    }),
    // PARTNER
    prisma.user.create({
      data: {
        id: 'user-partner',
        phone: '01033333333',
        password: await bcrypt.hash('admin', 10),
        name: '파트너',
        accountType: 'PARTNER',
        isActive: true,
      },
    }),
    // GOLF_COURSE
    prisma.user.create({
      data: {
        id: 'user-golf-course',
        phone: '01044444444',
        password: await bcrypt.hash('admin', 10),
        name: '골프장담당자',
        accountType: 'GOLF_COURSE',
        isActive: true,
      },
    }),
    // MEMBER
    prisma.user.create({
      data: {
        id: 'user-member',
        phone: '01055555555',
        password: await bcrypt.hash('admin', 10),
        name: '일반회원',
        accountType: 'MEMBER',
        teamId: team.id,
        isActive: true,
      },
    }),
  ])

  // 팀 리더 업데이트
  await prisma.team.update({
    where: { id: team.id },
    data: { leaderId: 'user-leader-1' },
  })

  // 골프장 생성
  const golfCourses = await Promise.all([
    prisma.golfCourse.create({
      data: {
        id: 'golf-course-1',
        orderNumber: 1,
        region: '제주',
        name: '제주테스트CC',
        address: '제주특별자치도 서귀포시 테스트로 123',
        phone: '064-123-4567',
        operationStatus: 'API연동',
        notes: '테스트 골프장 1',
      },
    }),
    prisma.golfCourse.create({
      data: {
        id: 'golf-course-2',
        orderNumber: 2,
        region: '경기',
        name: '경기테스트GC',
        address: '경기도 성남시 테스트로 456',
        phone: '031-987-6543',
        operationStatus: '수동',
        notes: '테스트 골프장 2',
      },
    }),
    prisma.golfCourse.create({
      data: {
        id: 'golf-course-3',
        orderNumber: 3,
        region: '부산',
        name: '부산테스트CC',
        address: '부산광역시 해운대구 테스트로 789',
        phone: '051-555-1234',
        operationStatus: '대기',
        notes: '테스트 골프장 3',
      },
    }),
  ])

  // 티타임 데이터는 하드코딩하지 않고 동적으로만 생성
  // 테스트에서 필요한 경우 개별적으로 생성해서 사용
  console.log('   ℹ️  TeeTime data should be created dynamically in each test')
  const teeTimes: any[] = []

  // 연결된 티타임도 하드코딩하지 않고 동적으로만 생성
  console.log('   ℹ️  Connected TeeTime data should be created dynamically in each test')

  return {
    users,
    team,
    golfCourses,
    teeTimes,
  }
}

// 트랜잭션 헬퍼
export const withTransaction = async <T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  const prisma = getTestPrismaClient()
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as PrismaClient)
  })
}

// 테스트 종료 시 연결 정리
export const disconnectTestDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
}