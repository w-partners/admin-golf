import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. 골프장 데이터 생성
  const golfCourses = [
    { name: '오라CC', region: '제주', address: '제주특별자치도 제주시 오라동', phone: '064-123-4567', status: 'ACTIVE' },
    { name: '라헨느CC', region: '제주', address: '제주특별자치도 서귀포시', phone: '064-234-5678', status: 'ACTIVE' },
    { name: '블랙스톤CC', region: '제주', address: '제주특별자치도 제주시', phone: '064-345-6789', status: 'ACTIVE' },
    { name: '파인비치CC', region: '경남', address: '경상남도 통영시', phone: '055-123-4567', status: 'ACTIVE' },
    { name: '아난티코브CC', region: '경남', address: '경상남도 거제시', phone: '055-234-5678', status: 'ACTIVE' },
    { name: '해슬리나인브릿지', region: '제주', address: '제주특별자치도 서귀포시', phone: '064-456-7890', status: 'ACTIVE' },
    { name: '롯데스카이힐CC', region: '제주', address: '제주특별자치도 제주시', phone: '064-567-8901', status: 'ACTIVE' },
    { name: '통영마리나베이CC', region: '경남', address: '경상남도 통영시', phone: '055-345-6789', status: 'ACTIVE' },
  ];

  const createdCourses = [];
  for (const course of golfCourses) {
    const created = await prisma.golfCourse.upsert({
      where: { name: course.name },
      update: {},
      create: course,
    });
    createdCourses.push(created);
    console.log(`✅ Created golf course: ${created.name}`);
  }

  // 2. 티타임 데이터 생성 (각 골프장별로 30일간 데이터)
  const today = new Date();
  const timeSlots = [
    { time: '06:30', slot: '1부' },
    { time: '07:00', slot: '1부' },
    { time: '07:30', slot: '1부' },
    { time: '08:00', slot: '1부' },
    { time: '08:30', slot: '1부' },
    { time: '09:00', slot: '1부' },
    { time: '09:30', slot: '1부' },
    { time: '10:00', slot: '2부' },
    { time: '10:30', slot: '2부' },
    { time: '11:00', slot: '2부' },
    { time: '11:30', slot: '2부' },
    { time: '12:00', slot: '2부' },
    { time: '12:30', slot: '2부' },
    { time: '13:00', slot: '2부' },
    { time: '13:30', slot: '2부' },
    { time: '14:00', slot: '2부' },
    { time: '14:30', slot: '2부' },
    { time: '15:00', slot: '3부' },
    { time: '15:30', slot: '3부' },
    { time: '16:00', slot: '3부' },
    { time: '16:30', slot: '3부' },
    { time: '17:00', slot: '3부' },
  ];

  let teeTimeCount = 0;
  
  for (const course of createdCourses) {
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = addDays(today, dayOffset);
      
      // 각 날짜마다 랜덤하게 3-8개의 티타임 생성
      const numTeeTimes = Math.floor(Math.random() * 6) + 3;
      const selectedSlots = timeSlots
        .sort(() => Math.random() - 0.5)
        .slice(0, numTeeTimes);
      
      for (const slot of selectedSlots) {
        const players = Math.random() > 0.5 ? 4 : Math.floor(Math.random() * 3) + 1;
        const bookingType = players === 4 ? 'BOOKING' : 'JOIN';
        
        await prisma.teeTime.create({
          data: {
            golfCourseId: course.id,
            date: date,
            time: slot.time,
            timeSlot: slot.slot,
            greenFee: Math.floor(Math.random() * 10 + 10) + Math.random() * 0.5, // 10-20만원
            players: players,
            bookingType: bookingType,
            requirements: '',
            holes: 18,
            caddie: true,
            deposit: Math.floor(Math.random() * 5) + 0,
            mealIncluded: Math.random() > 0.3,
            cartIncluded: true,
            status: 'AVAILABLE',
          },
        });
        teeTimeCount++;
      }
    }
  }
  
  console.log(`✅ Created ${teeTimeCount} tee times`);

  // 3. 사용자 데이터 생성
  const users = [
    { phone: '01034424668', password: 'admin1234', name: '슈퍼관리자', accountType: 'SUPER_ADMIN' },
    { phone: '01000000000', password: 'admin', name: '관리자', accountType: 'ADMIN' },
    { phone: '01000000001', password: 'admin', name: '팀장', accountType: 'TEAM_LEADER' },
    { phone: '01011111111', password: 'admin', name: '내부매니저', accountType: 'INTERNAL_MANAGER' },
    { phone: '01022222222', password: 'admin', name: '외부매니저', accountType: 'EXTERNAL_MANAGER' },
    { phone: '01033333333', password: 'admin', name: '파트너', accountType: 'PARTNER' },
    { phone: '01044444444', password: 'admin', name: '골프장담당자', accountType: 'GOLF_COURSE' },
    { phone: '01055555555', password: 'admin', name: '일반회원', accountType: 'MEMBER' },
  ];

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { phone: user.phone },
      update: {},
      create: user,
    });
    console.log(`✅ Created user: ${created.name} (${created.accountType})`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });