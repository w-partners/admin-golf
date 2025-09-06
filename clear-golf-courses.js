const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing hardcoded golf course data...');
  
  try {
    // 골프장 데이터 모두 삭제
    const result = await prisma.golfCourse.deleteMany({});
    console.log(`   ✅ Deleted ${result.count} golf courses`);
    
    console.log('✨ Golf courses cleared successfully!');
    console.log('ℹ️  Golf courses should now be registered through admin interface');
    
  } catch (error) {
    console.error('❌ Error clearing golf courses:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });