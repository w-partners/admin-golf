import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // 간단한 쿼리로 연결 테스트
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    
    // 골프장 수 확인
    const golfCourseCount = await prisma.golfCourse.count();
    console.log(`Current golf course count: ${golfCourseCount}`);
    
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();