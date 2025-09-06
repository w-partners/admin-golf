const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // 기존 사용자가 있는지 확인
    const existingUser = await prisma.user.findUnique({
      where: { phone: '01034424668' }
    })

    if (existingUser) {
      console.log('✅ Test user already exists')
      console.log('Phone: 01034424668')
      console.log('Password: admin1234')
      return
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash('admin1234', 10)

    // 테스트 사용자 생성
    const user = await prisma.user.create({
      data: {
        phone: '01034424668',
        name: '최고관리자',
        password: hashedPassword,
        accountType: 'SUPER_ADMIN',
        isActive: true
      }
    })

    console.log('✅ Test user created successfully')
    console.log('Phone: 01034424668')
    console.log('Password: admin1234')
    console.log('Account Type: SUPER_ADMIN')
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()