import { PrismaClient, AccountType, Region, OperStatus, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 디버깅을 위한 로그 활성화 및 타임아웃 설정
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('🌱 Seeding database...');
  console.log('📍 Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  // 데이터베이스 연결 테스트
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }

  // 1. 사용자 계정 생성 - 최소한의 데이터로 시작
  const users = [
    {
      name: '최고관리자',
      phone: '01034424668',
      password: 'admin1234',
      accountType: AccountType.SUPER_ADMIN,
      status: UserStatus.ACTIVE
    },
    {
      name: '관리자',
      phone: '01000000000',
      password: 'admin',
      accountType: AccountType.ADMIN,
      status: UserStatus.ACTIVE
    },
    {
      name: '팀장',
      phone: '01000000001',
      password: 'admin',
      accountType: AccountType.TEAM_LEADER,
      status: UserStatus.ACTIVE
    },
    {
      name: '내부매니저',
      phone: '01011111111',
      password: 'admin',
      accountType: AccountType.INTERNAL_MANAGER,
      status: UserStatus.ACTIVE
    },
    {
      name: '외부매니저',
      phone: '01022222222',
      password: 'admin',
      accountType: AccountType.EXTERNAL_MANAGER,
      status: UserStatus.ACTIVE
    },
    {
      name: '거래처',
      phone: '01033333333',
      password: 'admin',
      accountType: AccountType.PARTNER,
      company: '파트너사',
      status: UserStatus.ACTIVE
    },
    {
      name: '골프장담당',
      phone: '01044444444',
      password: 'admin',
      accountType: AccountType.GOLF_COURSE,
      company: '취곡CC',
      status: UserStatus.ACTIVE
    },
    {
      name: '일반회원',
      phone: '01055555555',
      password: 'admin',
      accountType: AccountType.MEMBER,
      status: UserStatus.ACTIVE
    }
  ];

  console.log('📝 Creating users...');
  const createdUsers = [];
  
  // 비밀번호 해싱을 개별적으로 처리
  for (const userData of users) {
    try {
      console.log(`   ⏳ Processing user: ${userData.name}`);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.upsert({
        where: { phone: userData.phone },
        update: {
          name: userData.name,
          password: hashedPassword,
          accountType: userData.accountType,
          status: userData.status,
          company: userData.company || null
        },
        create: {
          name: userData.name,
          phone: userData.phone,
          password: hashedPassword,
          accountType: userData.accountType,
          status: userData.status,
          company: userData.company || null
        }
      });
      createdUsers.push(user);
      console.log(`   ✅ Created/Updated user: ${user.name} (${user.phone})`);
    } catch (error) {
      console.error(`   ❌ Failed to create user ${userData.name}:`, error);
    }
  }

  // 2. 팀 생성 (팀장과 팀원 관계)
  const teamLeader = createdUsers.find(u => u.accountType === AccountType.TEAM_LEADER);
  const internalManager = createdUsers.find(u => u.accountType === AccountType.INTERNAL_MANAGER);
  const externalManager = createdUsers.find(u => u.accountType === AccountType.EXTERNAL_MANAGER);

  if (teamLeader) {
    console.log('👥 Creating team...');
    const team = await prisma.team.upsert({
      where: { leaderId: teamLeader.id },
      update: {},
      create: {
        name: 'A팀',
        leaderId: teamLeader.id
      }
    });

    // 팀원 할당
    if (internalManager) {
      await prisma.user.update({
        where: { id: internalManager.id },
        data: { teamId: team.id }
      });
    }
    if (externalManager) {
      await prisma.user.update({
        where: { id: externalManager.id },
        data: { teamId: team.id }
      });
    }
    console.log(`   ✅ Created team: ${team.name}`);
  }

  // 3. 골프장 생성 - 빈 상태로 시작 (관리자가 등록해야 함)
  console.log('⛳ Skipping golf course creation - to be managed by administrators');
  console.log('   ℹ️  Golf courses should be registered through the admin interface');

  // 4. 시스템 설정
  console.log('⚙️ Creating system configurations...');
  
  const configs = [
    {
      category: 'timer',
      key: 'reservation_timeout',
      value: { minutes: 10, enabled: true }
    },
    {
      category: 'display',
      key: 'matrix_days',
      value: { days: 90 }
    },
    {
      category: 'business',
      key: 'time_slots',
      value: {
        slot1: { name: '1부', startHour: 0, endHour: 10 },
        slot2: { name: '2부', startHour: 10, endHour: 15 },
        slot3: { name: '3부', startHour: 15, endHour: 24 }
      }
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: {
        category_key: {
          category: config.category,
          key: config.key
        }
      },
      update: { value: config.value },
      create: config
    });
    console.log(`   ✅ Created config: ${config.category}.${config.key}`);
  }

  // 5. 샘플 공지사항
  console.log('📢 Creating notices...');
  await prisma.notice.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '골프장 예약 관리 시스템 오픈',
      content: '골프장 예약 관리 시스템이 정식 오픈되었습니다. 많은 이용 부탁드립니다.',
      isActive: true,
      targetAccountTypes: JSON.stringify([
        AccountType.SUPER_ADMIN,
        AccountType.ADMIN,
        AccountType.TEAM_LEADER,
        AccountType.INTERNAL_MANAGER,
        AccountType.EXTERNAL_MANAGER,
        AccountType.PARTNER,
        AccountType.GOLF_COURSE,
        AccountType.MEMBER
      ])
    }
  });
  console.log('   ✅ Created sample notice');

  console.log('\n✨ Seeding completed successfully!');
  console.log('\n📌 Test accounts:');
  console.log('   최고관리자: 010-3442-4668 / admin1234');
  console.log('   관리자: 010-0000-0000 / admin');
  console.log('   팀장: 010-0000-0001 / admin');
  console.log('   내부매니저: 010-1111-1111 / admin');
  console.log('   외부매니저: 010-2222-2222 / admin');
  console.log('   거래처: 010-3333-3333 / admin');
  console.log('   골프장: 010-4444-4444 / admin');
  console.log('   회원: 010-5555-5555 / admin');
}

function getRegionName(region: string): string {
  const regionNames: Record<string, string> = {
    GYEONGGI_NORTH: '경기북부',
    GYEONGGI_SOUTH: '경기남부',
    GYEONGGI_EAST: '경기동부',
    GANGWON: '강원',
    GYEONGSANG: '경상',
    CHUNGNAM: '충남',
    JEOLLA: '전라',
    JEJU: '제주'
  };
  return regionNames[region] || region;
}

// 타임아웃 처리를 위한 래퍼 함수
async function runWithTimeout() {
  const timeoutId = setTimeout(() => {
    console.error('❌ Seeding timeout after 30 seconds');
    process.exit(1);
  }, 30000); // 30초 타임아웃

  try {
    await main();
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('❌ Seeding failed:', e);
    if (e instanceof Error) {
      console.error('Error details:', e.message);
      console.error('Stack trace:', e.stack);
    }
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (disconnectError) {
      console.error('❌ Failed to disconnect:', disconnectError);
    }
  }
}

runWithTimeout();