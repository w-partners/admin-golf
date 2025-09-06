const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🏌️ 각 지역별 골프장 1개씩 추가...');
  
  // 각 지역별로 골프장 1개씩 간단하게 추가
  const golfCourses = [
    {
      sequence: 1,
      name: '경기북부CC',
      region: 'GYEONGGI_NORTH',
      address: '경기도 파주시 골프로 1',
      contact: '031-111-1111',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 2,
      name: '경기남부GC',
      region: 'GYEONGGI_SOUTH',
      address: '경기도 수원시 골프로 2',
      contact: '031-222-2222',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 3,
      name: '경기동부CC',
      region: 'GYEONGGI_EAST',
      address: '경기도 남양주시 골프로 3',
      contact: '031-333-3333',
      operStatus: 'MANUAL'
    },
    {
      sequence: 4,
      name: '강원CC',
      region: 'GANGWON',
      address: '강원도 춘천시 골프로 4',
      contact: '033-444-4444',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 5,
      name: '경상GC',
      region: 'GYEONGSANG',
      address: '경상북도 안동시 골프로 5',
      contact: '054-555-5555',
      operStatus: 'MANUAL'
    },
    {
      sequence: 6,
      name: '충남CC',
      region: 'CHUNGNAM',
      address: '충청남도 천안시 골프로 6',
      contact: '041-666-6666',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 7,
      name: '전라GC',
      region: 'JEOLLA',
      address: '전라북도 전주시 골프로 7',
      contact: '063-777-7777',
      operStatus: 'STANDBY'
    },
    {
      sequence: 8,
      name: '제주CC',
      region: 'JEJU',
      address: '제주특별자치도 제주시 골프로 8',
      contact: '064-888-8888',
      operStatus: 'API_CONNECTED'
    }
  ];

  for (const course of golfCourses) {
    try {
      const created = await prisma.golfCourse.create({
        data: course
      });
      console.log(`   ✅ ${course.name} (${course.region}) 추가됨`);
    } catch (error) {
      console.log(`   ⚠️  ${course.name} 이미 존재하거나 오류: ${error.message}`);
    }
  }

  console.log('🏌️ 완료');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });