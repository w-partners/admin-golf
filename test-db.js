const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // 간단한 연결 테스트
    const result = await prisma.$executeRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')
    
    // User 테이블 확인
    const userCount = await prisma.user.count()
    console.log(`👥 Current users in database: ${userCount}`)
    
    if (userCount === 0) {
      console.log('📝 No users found. Need to create test user.')
    } else {
      // 기존 사용자 목록
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          accountType: true
        }
      })
      console.log('👥 Existing users:', users)
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()