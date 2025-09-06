import { AccountType } from '@prisma/client'
import { Session } from 'next-auth'

// Mock 사용자 생성 헬퍼
export const createMockSession = (accountType: AccountType = 'MEMBER'): Session => ({
  user: {
    id: 'test-user-id',
    phone: '01012345678',
    name: '테스트유저',
    accountType,
    teamId: accountType === 'TEAM_LEADER' ? 'test-team-id' : null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

// 권한 검증 헬퍼
export const PERMISSION_MATRIX = {
  SUPER_ADMIN: {
    canCreateGolfCourse: true,
    canManageAllTeeTimes: true,
    canManageUsers: true,
    canRegisterPerformance: true,
    canViewAllData: true,
    canApproveTeamReservations: true,
  },
  ADMIN: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: true,
    canManageUsers: true,
    canRegisterPerformance: true,
    canViewAllData: true,
    canApproveTeamReservations: true,
  },
  TEAM_LEADER: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: false,
    canManageUsers: false,
    canRegisterPerformance: false,
    canViewAllData: false,
    canApproveTeamReservations: true,
  },
  INTERNAL_MANAGER: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: true,
    canManageUsers: false,
    canRegisterPerformance: true,
    canViewAllData: false,
    canApproveTeamReservations: false,
  },
  EXTERNAL_MANAGER: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: true,
    canManageUsers: false,
    canRegisterPerformance: true,
    canViewAllData: false,
    canApproveTeamReservations: false,
  },
  PARTNER: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: true,
    canManageUsers: false,
    canRegisterPerformance: true,
    canViewAllData: false,
    canApproveTeamReservations: false,
  },
  GOLF_COURSE: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: false,
    canManageUsers: false,
    canRegisterPerformance: false,
    canViewAllData: false,
    canApproveTeamReservations: false,
  },
  MEMBER: {
    canCreateGolfCourse: false,
    canManageAllTeeTimes: false,
    canManageUsers: false,
    canRegisterPerformance: false,
    canViewAllData: false,
    canApproveTeamReservations: false,
  },
}

// 시간대 분류 헬퍼
export const getTimeSlot = (time: string): string => {
  const hour = parseInt(time.split(':')[0])
  if (hour < 10) return '1부'
  if (hour < 15) return '2부'
  return '3부'
}

// 예약 유형 결정 헬퍼
export const getBookingType = (players: number): string => {
  return players === 4 ? '부킹' : '조인'
}

// 날짜 유효성 검증 헬퍼
export const isValidFutureDate = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

// 10분 타이머 만료 체크 헬퍼
export const isReservationExpired = (reservedAt: Date): boolean => {
  const now = new Date()
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
  return reservedAt < tenMinutesAgo
}

// Mock 티타임 데이터 생성
export const createMockTeeTimeData = (overrides = {}) => ({
  id: 'test-teetime-id',
  golfCourseId: 'test-course-id',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 내일
  time: '08:00',
  timeSlot: '1부',
  greenFee: 10.5,
  players: 4,
  bookingType: '부킹',
  requirements: '요청사항 없음',
  holes: '18홀',
  caddy: '포함',
  prepayment: 5.0,
  mealIncluded: true,
  cartIncluded: true,
  status: 'AVAILABLE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock 골프장 데이터 생성
export const createMockGolfCourseData = (overrides = {}) => ({
  id: 'test-course-id',
  orderNumber: 1,
  region: '제주' as const,
  name: '테스트골프장',
  address: '제주특별자치도 서귀포시',
  phone: '064-123-4567',
  operationStatus: '수동' as const,
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock 사용자 데이터 생성
export const createMockUserData = (overrides = {}) => ({
  id: 'test-user-id',
  phone: '01012345678',
  password: '$2a$10$test.hashed.password',
  name: '테스트유저',
  accountType: 'MEMBER' as AccountType,
  teamId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock 팀 데이터 생성
export const createMockTeamData = (overrides = {}) => ({
  id: 'test-team-id',
  name: '테스트팀',
  leaderId: 'test-leader-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// API 응답 Mock 생성
export const createMockApiResponse = (data: any, status = 200) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers({
    'content-type': 'application/json',
  }),
})

// 예약 상태 전환 시뮬레이터
export class ReservationSimulator {
  private status: string
  private reservedAt: Date | null
  private confirmedAt: Date | null

  constructor(initialStatus = 'AVAILABLE') {
    this.status = initialStatus
    this.reservedAt = null
    this.confirmedAt = null
  }

  reserve(userId: string) {
    if (this.status !== 'AVAILABLE') {
      throw new Error('Tee time is not available')
    }
    this.status = 'RESERVED'
    this.reservedAt = new Date()
    return { status: this.status, reservedBy: userId, reservedAt: this.reservedAt }
  }

  confirm() {
    if (this.status !== 'RESERVED') {
      throw new Error('Tee time is not reserved')
    }
    if (this.reservedAt && isReservationExpired(this.reservedAt)) {
      this.cancel()
      throw new Error('Reservation expired')
    }
    this.status = 'CONFIRMED'
    this.confirmedAt = new Date()
    return { status: this.status, confirmedAt: this.confirmedAt }
  }

  cancel() {
    if (this.status === 'RESERVED') {
      this.status = 'AVAILABLE'
      this.reservedAt = null
      return { status: this.status }
    }
    throw new Error('Cannot cancel non-reserved tee time')
  }

  complete() {
    if (this.status !== 'CONFIRMED') {
      throw new Error('Tee time is not confirmed')
    }
    this.status = 'COMPLETED'
    return { status: this.status }
  }

  getStatus() {
    return {
      status: this.status,
      reservedAt: this.reservedAt,
      confirmedAt: this.confirmedAt,
    }
  }
}

// Test용 날짜 헬퍼
export const getTestDates = () => ({
  today: new Date(),
  tomorrow: new Date(Date.now() + 24 * 60 * 60 * 1000),
  nextWeek: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  nextMonth: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000),
  next90Days: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
})

// Test 계정 정보
export const TEST_ACCOUNTS = {
  SUPER_ADMIN: { phone: '01034424668', password: 'admin1234' },
  ADMIN: { phone: '01000000000', password: 'admin' },
  TEAM_LEADER: { phone: '01000000001', password: 'admin' },
  INTERNAL_MANAGER: { phone: '01011111111', password: 'admin' },
  EXTERNAL_MANAGER: { phone: '01022222222', password: 'admin' },
  PARTNER: { phone: '01033333333', password: 'admin' },
  GOLF_COURSE: { phone: '01044444444', password: 'admin' },
  MEMBER: { phone: '01055555555', password: 'admin' },
}