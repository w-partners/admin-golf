const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function test() {
  console.log('Testing database connection...');
  
  try {
    // 1. 연결 테스트
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 2. 기존 사용자 확인
    const existingUsers = await prisma.user.findMany();
    console.log('Existing users:', existingUsers.length);
    
    // 3. SUPER_ADMIN 생성 시도
    const hashedPassword = await bcrypt.hashSync('admin1234', 10);
    console.log('Password hashed');
    
    const user = await prisma.user.create({
      data: {
        phone: '01034424668',
        password: hashedPassword,
        name: '최고관리자',
        accountType: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });
    
    console.log('✅ User created:', user);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected');
  }
}

test();