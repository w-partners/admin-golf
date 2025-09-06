import { PrismaClient, AccountType, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting minimal seed...');
  
  try {
    // 연결 테스트
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // SUPER_ADMIN 계정만 생성
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    console.log('✅ Password hashed');
    
    const superAdmin = await prisma.user.upsert({
      where: { phone: '01034424668' },
      update: {
        name: '최고관리자',
        password: hashedPassword,
        accountType: AccountType.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
      create: {
        name: '최고관리자',
        phone: '01034424668',
        password: hashedPassword,
        accountType: AccountType.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      }
    });
    
    console.log('✅ Super Admin created:', superAdmin);
    console.log('\n📌 Login info:');
    console.log('   Phone: 01034424668');
    console.log('   Password: admin1234');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('✨ Seed completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });