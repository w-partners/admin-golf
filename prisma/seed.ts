import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 기본 계정 생성
  const defaultUsers = [
    { name: '최고관리자', phone: '01034424668', password: 'admin1234', accountType: 'SUPER_ADMIN' },
    { name: '관리자', phone: '01000000000', password: 'admin', accountType: 'ADMIN' },
    { name: '팀장', phone: '01000000001', password: 'admin', accountType: 'TEAM_LEADER' },
    { name: '내부매니저', phone: '01011111111', password: 'admin', accountType: 'INTERNAL_MANAGER' },
    { name: '외부매니저', phone: '01022222222', password: 'admin', accountType: 'EXTERNAL_MANAGER' },
    { name: '거래처', phone: '01033333333', password: 'admin', accountType: 'PARTNER' },
    { name: '골프장', phone: '01044444444', password: 'admin', accountType: 'GOLF_COURSE' },
    { name: '회원', phone: '01055555555', password: 'admin', accountType: 'MEMBER' }
  ];

  for (const user of defaultUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: user.phone }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          ...user,
          password: await bcrypt.hash(user.password, 10)
        }
      });
      console.log(`✅ Created user: ${user.name} (${user.phone})`);
    } else {
      console.log(`⚠️  User already exists: ${user.name} (${user.phone})`);
    }
  }

  // 시스템 설정 초기값
  const systemConfigs = [
    { category: 'tee_time', key: 'confirmation_timeout', value: 10 },
    { category: 'tee_time', key: 'cancellation_deadline', value: 2 },
    { category: 'tee_time', key: 'connection_timeout', value: 10 },
    { category: 'system', key: 'max_future_days', value: 90 },
    { category: 'system', key: 'default_green_fee', value: 15.0 }
  ];

  for (const config of systemConfigs) {
    const existing = await prisma.systemConfig.findUnique({
      where: {
        category_key: {
          category: config.category,
          key: config.key
        }
      }
    });

    if (!existing) {
      await prisma.systemConfig.create({
        data: config
      });
      console.log(`✅ Created config: ${config.category}.${config.key} = ${config.value}`);
    } else {
      console.log(`⚠️  Config already exists: ${config.category}.${config.key}`);
    }
  }

  // 샘플 골프장 생성
  const sampleGolfCourses = [
    { sequence: 1, name: '제주 취곡CC', region: 'JEJU', address: '제주특별자치도 제주시', contact: '064-123-4567', operStatus: 'MANUAL' },
    { sequence: 2, name: '제주 포도CC', region: 'JEJU', address: '제주특별자치도 서귀포시', contact: '064-234-5678', operStatus: 'MANUAL' },
    { sequence: 3, name: '경기 마실CC', region: 'GYEONGGI_NORTH', address: '경기도 파주시', contact: '031-345-6789', operStatus: 'API_CONNECTED' },
    { sequence: 4, name: '강원 표선CC', region: 'GANGWON', address: '강원도 춘천시', contact: '033-456-7890', operStatus: 'MANUAL' }
  ];

  for (const course of sampleGolfCourses) {
    const existing = await prisma.golfCourse.findFirst({
      where: { name: course.name }
    });

    if (!existing) {
      await prisma.golfCourse.create({
        data: course
      });
      console.log(`✅ Created golf course: ${course.name}`);
    } else {
      console.log(`⚠️  Golf course already exists: ${course.name}`);
    }
  }

  // 기본 공지사항 생성
  const defaultNotice = {
    title: '골프장 예약 관리 시스템 오픈',
    content: '골프장 예약 관리 시스템이 정식 오픈되었습니다. 문의사항이 있으시면 관리자에게 연락해주세요.',
    targetAccountTypes: ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER', 'GOLF_COURSE', 'MEMBER']
  };

  const existingNotice = await prisma.notice.findFirst({
    where: { title: defaultNotice.title }
  });

  if (!existingNotice) {
    await prisma.notice.create({
      data: defaultNotice
    });
    console.log(`✅ Created notice: ${defaultNotice.title}`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });