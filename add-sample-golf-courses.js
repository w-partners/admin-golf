const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🏌️ 각 지역별 골프장 2개씩 추가...');
  
  // 각 지역별로 골프장 2개씩 추가 (동적 데이터)
  const golfCourses = [
    // 경기북부 (2개)
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
      name: '헤이리골프클럽',
      region: 'GYEONGGI_NORTH',
      address: '경기도 파주시 헤이리로 15',
      contact: '031-111-2222',
      operStatus: 'MANUAL'
    },
    // 경기남부 (2개)
    {
      sequence: 3,
      name: '경기남부GC',
      region: 'GYEONGGI_SOUTH',
      address: '경기도 수원시 골프로 2',
      contact: '031-222-2222',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 4,
      name: '용인컨트리클럽',
      region: 'GYEONGGI_SOUTH',
      address: '경기도 용인시 처인구 골프로 25',
      contact: '031-222-3333',
      operStatus: 'API_CONNECTED'
    },
    // 경기동부 (2개)
    {
      sequence: 5,
      name: '경기동부CC',
      region: 'GYEONGGI_EAST',
      address: '경기도 남양주시 골프로 3',
      contact: '031-333-3333',
      operStatus: 'MANUAL'
    },
    {
      sequence: 6,
      name: '가평골프클럽',
      region: 'GYEONGGI_EAST',
      address: '경기도 가평군 설악면 골프길 88',
      contact: '031-333-4444',
      operStatus: 'API_CONNECTED'
    },
    // 강원 (2개)
    {
      sequence: 7,
      name: '강원CC',
      region: 'GANGWON',
      address: '강원도 춘천시 골프로 4',
      contact: '033-444-4444',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 8,
      name: '평창힐스CC',
      region: 'GANGWON',
      address: '강원도 평창군 대관령면 골프로 77',
      contact: '033-444-5555',
      operStatus: 'MANUAL'
    },
    // 경상 (2개)
    {
      sequence: 9,
      name: '경상GC',
      region: 'GYEONGSANG',
      address: '경상북도 안동시 골프로 5',
      contact: '054-555-5555',
      operStatus: 'MANUAL'
    },
    {
      sequence: 10,
      name: '경주골프리조트',
      region: 'GYEONGSANG',
      address: '경상북도 경주시 천북면 골프로 123',
      contact: '054-555-6666',
      operStatus: 'API_CONNECTED'
    },
    // 충남 (2개)
    {
      sequence: 11,
      name: '충남CC',
      region: 'CHUNGNAM',
      address: '충청남도 천안시 골프로 6',
      contact: '041-666-6666',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 12,
      name: '대천골프클럽',
      region: 'CHUNGNAM',
      address: '충청남도 보령시 대천해수욕장로 456',
      contact: '041-666-7777',
      operStatus: 'STANDBY'
    },
    // 전라 (2개)
    {
      sequence: 13,
      name: '전라GC',
      region: 'JEOLLA',
      address: '전라북도 전주시 골프로 7',
      contact: '063-777-7777',
      operStatus: 'STANDBY'
    },
    {
      sequence: 14,
      name: '무주골프리조트',
      region: 'JEOLLA',
      address: '전라북도 무주군 설천면 골프로 999',
      contact: '063-777-8888',
      operStatus: 'API_CONNECTED'
    },
    // 제주 (2개)
    {
      sequence: 15,
      name: '제주CC',
      region: 'JEJU',
      address: '제주특별자치도 제주시 골프로 8',
      contact: '064-888-8888',
      operStatus: 'API_CONNECTED'
    },
    {
      sequence: 16,
      name: '서귀포골프클럽',
      region: 'JEJU',
      address: '제주특별자치도 서귀포시 중문관광로 1234',
      contact: '064-888-9999',
      operStatus: 'MANUAL'
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