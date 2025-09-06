import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { 
  getTestPrismaClient,
  cleanDatabase,
  seedTestData,
  disconnectTestDatabase
} from '../utils/db-test-helpers'
import { TEST_ACCOUNTS } from '../utils/test-helpers'

// Mock Next.js 환경
const mockApp = 'http://localhost:3000'

describe('티타임 API 통합테스트', () => {
  let authTokens: Record<string, string> = {}
  
  beforeAll(async () => {
    // 데이터베이스 초기화 및 시드
    await cleanDatabase()
    await seedTestData()
    
    // 각 계정 유형별 인증 토큰 획득 (실제 구현 시 수정 필요)
    // 여기서는 Mock 토큰 사용
    authTokens = {
      SUPER_ADMIN: 'mock-token-super-admin',
      ADMIN: 'mock-token-admin',
      TEAM_LEADER: 'mock-token-team-leader',
      INTERNAL_MANAGER: 'mock-token-internal-manager',
      EXTERNAL_MANAGER: 'mock-token-external-manager',
      PARTNER: 'mock-token-partner',
      GOLF_COURSE: 'mock-token-golf-course',
      MEMBER: 'mock-token-member',
    }
  })
  
  afterAll(async () => {
    await cleanDatabase()
    await disconnectTestDatabase()
  })
  
  describe('GET /api/tee-times', () => {
    it('인증되지 않은 사용자는 접근할 수 없어야 함', async () => {
      const response = await request(mockApp)
        .get('/api/tee-times')
        .expect(401)
      
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Unauthorized')
    })
    
    it('MEMBER는 티타임 목록을 조회할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .get('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.MEMBER}`)
        .expect(200)
      
      expect(response.body).toHaveProperty('teeTimes')
      expect(Array.isArray(response.body.teeTimes)).toBe(true)
    })
    
    it('날짜 필터링이 작동해야 함', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const formattedDate = tomorrow.toISOString().split('T')[0]
      
      const response = await request(mockApp)
        .get(`/api/tee-times?date=${formattedDate}`)
        .set('Authorization', `Bearer ${authTokens.MEMBER}`)
        .expect(200)
      
      expect(response.body.teeTimes).toBeDefined()
      response.body.teeTimes.forEach((teeTime: any) => {
        expect(teeTime.date.startsWith(formattedDate)).toBe(true)
      })
    })
    
    it('골프장 필터링이 작동해야 함', async () => {
      const response = await request(mockApp)
        .get('/api/tee-times?golfCourseId=golf-course-1')
        .set('Authorization', `Bearer ${authTokens.MEMBER}`)
        .expect(200)
      
      response.body.teeTimes.forEach((teeTime: any) => {
        expect(teeTime.golfCourseId).toBe('golf-course-1')
      })
    })
    
    it('GOLF_COURSE 계정은 자신의 골프장 티타임만 조회 가능해야 함', async () => {
      const response = await request(mockApp)
        .get('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.GOLF_COURSE}`)
        .expect(200)
      
      // 골프장 담당자는 자신이 관리하는 골프장의 티타임만 조회
      response.body.teeTimes.forEach((teeTime: any) => {
        expect(teeTime.golfCourseId).toBe('golf-course-1') // 가정: 이 계정이 관리하는 골프장
      })
    })
  })
  
  describe('POST /api/tee-times', () => {
    const validTeeTimeData = {
      golfCourseId: 'golf-course-1',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      time: '10:00',
      greenFee: 12.5,
      players: 4,
      requirements: '테스트 요청사항',
      holes: '18홀',
      caddy: '포함',
      prepayment: 6.0,
      mealIncluded: true,
      cartIncluded: true,
    }
    
    it('MEMBER는 티타임을 등록할 수 없어야 함', async () => {
      const response = await request(mockApp)
        .post('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.MEMBER}`)
        .send(validTeeTimeData)
        .expect(403)
      
      expect(response.body.error).toContain('Forbidden')
    })
    
    it('INTERNAL_MANAGER는 티타임을 등록할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .post('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .send(validTeeTimeData)
        .expect(201)
      
      expect(response.body).toHaveProperty('id')
      expect(response.body.status).toBe('AVAILABLE')
      expect(response.body.timeSlot).toBe('2부') // 10:00은 2부
      expect(response.body.bookingType).toBe('부킹') // 4명은 부킹
    })
    
    it('필수 필드가 누락되면 400 에러를 반환해야 함', async () => {
      const invalidData = { ...validTeeTimeData }
      delete invalidData.greenFee
      
      const response = await request(mockApp)
        .post('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .send(invalidData)
        .expect(400)
      
      expect(response.body.error).toContain('greenFee')
    })
    
    it('과거 날짜로는 티타임을 등록할 수 없어야 함', async () => {
      const pastData = {
        ...validTeeTimeData,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }
      
      const response = await request(mockApp)
        .post('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .send(pastData)
        .expect(400)
      
      expect(response.body.error).toContain('past date')
    })
    
    it('그린피는 소수점 1자리까지만 허용되어야 함', async () => {
      const invalidGreenFee = {
        ...validTeeTimeData,
        greenFee: 12.55, // 소수점 2자리
      }
      
      const response = await request(mockApp)
        .post('/api/tee-times')
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .send(invalidGreenFee)
        .expect(400)
      
      expect(response.body.error).toContain('greenFee')
    })
  })
  
  describe('POST /api/tee-times/:id/reserve', () => {
    let availableTeeTimeId: string
    
    beforeEach(async () => {
      // 예약 가능한 티타임 생성
      const prisma = getTestPrismaClient()
      const teeTime = await prisma.teeTime.create({
        data: {
          golfCourseId: 'golf-course-1',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          time: '14:00',
          timeSlot: '2부',
          greenFee: 15.0,
          players: 4,
          bookingType: '부킹',
          requirements: '예약 테스트',
          holes: '18홀',
          caddy: '포함',
          prepayment: 7.5,
          mealIncluded: true,
          cartIncluded: true,
          status: 'AVAILABLE',
        },
      })
      availableTeeTimeId = teeTime.id
    })
    
    it('매니저는 티타임을 예약할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .post(`/api/tee-times/${availableTeeTimeId}/reserve`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .expect(200)
      
      expect(response.body.status).toBe('RESERVED')
      expect(response.body.reservedBy).toBeDefined()
      expect(response.body.reservedAt).toBeDefined()
    })
    
    it('이미 예약된 티타임은 다시 예약할 수 없어야 함', async () => {
      // 첫 번째 예약
      await request(mockApp)
        .post(`/api/tee-times/${availableTeeTimeId}/reserve`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .expect(200)
      
      // 두 번째 예약 시도
      const response = await request(mockApp)
        .post(`/api/tee-times/${availableTeeTimeId}/reserve`)
        .set('Authorization', `Bearer ${authTokens.EXTERNAL_MANAGER}`)
        .expect(409)
      
      expect(response.body.error).toContain('already reserved')
    })
    
    it('MEMBER는 티타임을 예약할 수 없어야 함', async () => {
      const response = await request(mockApp)
        .post(`/api/tee-times/${availableTeeTimeId}/reserve`)
        .set('Authorization', `Bearer ${authTokens.MEMBER}`)
        .expect(403)
      
      expect(response.body.error).toContain('Forbidden')
    })
  })
  
  describe('POST /api/tee-times/:id/confirm', () => {
    let reservedTeeTimeId: string
    let teamMemberReservedTeeTimeId: string
    
    beforeEach(async () => {
      const prisma = getTestPrismaClient()
      
      // 예약된 티타임 생성 (매니저가 예약)
      const reservedTeeTime = await prisma.teeTime.create({
        data: {
          golfCourseId: 'golf-course-1',
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          time: '15:00',
          timeSlot: '3부',
          greenFee: 12.0,
          players: 3,
          bookingType: '조인',
          requirements: '확정 테스트',
          holes: '18홀',
          caddy: '포함',
          prepayment: 6.0,
          mealIncluded: true,
          cartIncluded: true,
          status: 'RESERVED',
          reservedBy: 'user-internal-manager',
          reservedAt: new Date(),
        },
      })
      reservedTeeTimeId = reservedTeeTime.id
      
      // 팀원이 예약한 티타임 생성
      const teamMemberReserved = await prisma.teeTime.create({
        data: {
          golfCourseId: 'golf-course-1',
          date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          time: '16:00',
          timeSlot: '3부',
          greenFee: 11.0,
          players: 2,
          bookingType: '조인',
          requirements: '팀 확정 테스트',
          holes: '18홀',
          caddy: '포함',
          prepayment: 5.5,
          mealIncluded: true,
          cartIncluded: true,
          status: 'RESERVED',
          reservedBy: 'user-member', // 팀원이 예약
          reservedAt: new Date(),
        },
      })
      teamMemberReservedTeeTimeId = teamMemberReserved.id
    })
    
    it('예약한 본인이 확정할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .post(`/api/tee-times/${reservedTeeTimeId}/confirm`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .expect(200)
      
      expect(response.body.status).toBe('CONFIRMED')
      expect(response.body.confirmedBy).toBeDefined()
      expect(response.body.confirmedAt).toBeDefined()
    })
    
    it('ADMIN은 모든 예약을 확정할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .post(`/api/tee-times/${reservedTeeTimeId}/confirm`)
        .set('Authorization', `Bearer ${authTokens.ADMIN}`)
        .expect(200)
      
      expect(response.body.status).toBe('CONFIRMED')
    })
    
    it('팀장은 팀원의 예약을 확정할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .post(`/api/tee-times/${teamMemberReservedTeeTimeId}/confirm`)
        .set('Authorization', `Bearer ${authTokens.TEAM_LEADER}`)
        .expect(200)
      
      expect(response.body.status).toBe('CONFIRMED')
    })
    
    it('10분 초과된 예약은 확정할 수 없어야 함', async () => {
      // 11분 전 예약으로 업데이트
      const prisma = getTestPrismaClient()
      await prisma.teeTime.update({
        where: { id: reservedTeeTimeId },
        data: { reservedAt: new Date(Date.now() - 11 * 60 * 1000) },
      })
      
      const response = await request(mockApp)
        .post(`/api/tee-times/${reservedTeeTimeId}/confirm`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .expect(400)
      
      expect(response.body.error).toContain('expired')
    })
    
    it('다른 사용자는 예약을 확정할 수 없어야 함', async () => {
      const response = await request(mockApp)
        .post(`/api/tee-times/${reservedTeeTimeId}/confirm`)
        .set('Authorization', `Bearer ${authTokens.EXTERNAL_MANAGER}`)
        .expect(403)
      
      expect(response.body.error).toContain('Forbidden')
    })
  })
  
  describe('DELETE /api/tee-times/:id/cancel', () => {
    let reservedForCancelId: string
    
    beforeEach(async () => {
      const prisma = getTestPrismaClient()
      const teeTime = await prisma.teeTime.create({
        data: {
          golfCourseId: 'golf-course-1',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          time: '17:00',
          timeSlot: '3부',
          greenFee: 10.0,
          players: 2,
          bookingType: '조인',
          requirements: '취소 테스트',
          holes: '9홀',
          caddy: '미포함',
          prepayment: 5.0,
          mealIncluded: false,
          cartIncluded: true,
          status: 'RESERVED',
          reservedBy: 'user-partner',
          reservedAt: new Date(Date.now() - 5 * 60 * 1000), // 5분 전 예약
        },
      })
      reservedForCancelId = teeTime.id
    })
    
    it('예약한 본인이 10분 이내에 취소할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .delete(`/api/tee-times/${reservedForCancelId}/cancel`)
        .set('Authorization', `Bearer ${authTokens.PARTNER}`)
        .expect(200)
      
      expect(response.body.status).toBe('AVAILABLE')
      expect(response.body.reservedBy).toBeNull()
      expect(response.body.reservedAt).toBeNull()
    })
    
    it('확정된 예약은 취소할 수 없어야 함', async () => {
      // 예약 확정으로 상태 변경
      const prisma = getTestPrismaClient()
      await prisma.teeTime.update({
        where: { id: reservedForCancelId },
        data: { 
          status: 'CONFIRMED',
          confirmedBy: 'user-admin',
          confirmedAt: new Date(),
        },
      })
      
      const response = await request(mockApp)
        .delete(`/api/tee-times/${reservedForCancelId}/cancel`)
        .set('Authorization', `Bearer ${authTokens.PARTNER}`)
        .expect(400)
      
      expect(response.body.error).toContain('Cannot cancel confirmed')
    })
    
    it('다른 사용자는 예약을 취소할 수 없어야 함', async () => {
      const response = await request(mockApp)
        .delete(`/api/tee-times/${reservedForCancelId}/cancel`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .expect(403)
      
      expect(response.body.error).toContain('Forbidden')
    })
    
    it('ADMIN은 모든 예약을 취소할 수 있어야 함', async () => {
      const response = await request(mockApp)
        .delete(`/api/tee-times/${reservedForCancelId}/cancel`)
        .set('Authorization', `Bearer ${authTokens.ADMIN}`)
        .expect(200)
      
      expect(response.body.status).toBe('AVAILABLE')
    })
  })
  
  describe('PUT /api/tee-times/:id', () => {
    let teeTimeForUpdateId: string
    
    beforeEach(async () => {
      const prisma = getTestPrismaClient()
      const teeTime = await prisma.teeTime.create({
        data: {
          golfCourseId: 'golf-course-1',
          date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          time: '18:00',
          timeSlot: '3부',
          greenFee: 9.0,
          players: 3,
          bookingType: '조인',
          requirements: '수정 테스트',
          holes: '18홀',
          caddy: '포함',
          prepayment: 4.5,
          mealIncluded: true,
          cartIncluded: false,
          status: 'AVAILABLE',
        },
      })
      teeTimeForUpdateId = teeTime.id
    })
    
    it('매니저는 티타임 정보를 수정할 수 있어야 함', async () => {
      const updateData = {
        greenFee: 9.5,
        requirements: '수정된 요청사항',
        mealIncluded: false,
      }
      
      const response = await request(mockApp)
        .put(`/api/tee-times/${teeTimeForUpdateId}`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .send(updateData)
        .expect(200)
      
      expect(response.body.greenFee).toBe(9.5)
      expect(response.body.requirements).toBe('수정된 요청사항')
      expect(response.body.mealIncluded).toBe(false)
    })
    
    it('예약된 티타임은 수정할 수 없어야 함', async () => {
      // 티타임을 예약 상태로 변경
      const prisma = getTestPrismaClient()
      await prisma.teeTime.update({
        where: { id: teeTimeForUpdateId },
        data: { 
          status: 'RESERVED',
          reservedBy: 'user-partner',
          reservedAt: new Date(),
        },
      })
      
      const updateData = { greenFee: 10.0 }
      
      const response = await request(mockApp)
        .put(`/api/tee-times/${teeTimeForUpdateId}`)
        .set('Authorization', `Bearer ${authTokens.INTERNAL_MANAGER}`)
        .send(updateData)
        .expect(400)
      
      expect(response.body.error).toContain('Cannot modify reserved')
    })
    
    it('MEMBER는 티타임을 수정할 수 없어야 함', async () => {
      const updateData = { greenFee: 10.0 }
      
      const response = await request(mockApp)
        .put(`/api/tee-times/${teeTimeForUpdateId}`)
        .set('Authorization', `Bearer ${authTokens.MEMBER}`)
        .send(updateData)
        .expect(403)
      
      expect(response.body.error).toContain('Forbidden')
    })
  })
})