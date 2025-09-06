import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: '01034424668' }
    });

    if (existingUser) {
      console.log('✅ 테스트 계정이 이미 존재합니다.');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin1234', 10);

    // Create the test user
    const user = await prisma.user.create({
      data: {
        name: '최고관리자',
        phone: '01034424668',
        password: hashedPassword,
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('✅ 테스트 계정이 성공적으로 생성되었습니다!');
    console.log('📱 연락처:', user.phone);
    console.log('🔑 비밀번호: admin1234');
    console.log('👤 권한:', user.accountType);

  } catch (error) {
    console.error('❌ 테스트 계정 생성 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();