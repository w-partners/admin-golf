import { z } from 'zod'

// Common Enums
export const AccountTypeEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'TEAM_LEADER',
  'INTERNAL_MANAGER',
  'EXTERNAL_MANAGER',
  'PARTNER',
  'GOLF_COURSE',
  'MEMBER',
])

export const RegionEnum = z.enum([
  '제주',
  '경기',
  '강원',
  '충청',
  '호남',
  '영남',
  '경상',
  '기타',
])

export const TeeTimeStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
])

export const TeeTimeTypeEnum = z.enum(['DAILY', 'PACKAGE'])
export const BookingTypeEnum = z.enum(['BOOKING', 'JOIN'])
export const TimeSlotEnum = z.enum(['1부', '2부', '3부'])
export const GolfCourseStatusEnum = z.enum(['ACTIVE', 'API_INTEGRATION', 'MANUAL', 'INACTIVE'])

// Phone number validation
export const phoneNumberSchema = z.string().regex(/^010[0-9]{8}$/, '연락처는 010으로 시작하는 11자리 숫자여야 합니다')

// Time validation (HH:MM format)
export const timeSchema = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, '시간 형식이 올바르지 않습니다 (HH:MM)')

// Auth Schemas
export const LoginRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

// User Schemas
export const CreateUserRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
  accountType: AccountTypeEnum,
  teamId: z.string().optional(),
})

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  accountType: AccountTypeEnum.optional(),
  teamId: z.string().optional(),
})

// Team Schemas
export const CreateTeamRequestSchema = z.object({
  name: z.string().min(1, '팀 이름을 입력해주세요'),
  leaderId: z.string().min(1, '팀장을 선택해주세요'),
})

export const UpdateTeamRequestSchema = z.object({
  name: z.string().min(1).optional(),
  leaderId: z.string().min(1).optional(),
})

// Golf Course Schemas
export const CreateGolfCourseRequestSchema = z.object({
  order: z.number().int().positive().optional(),
  region: RegionEnum,
  name: z.string().min(1, '골프장명을 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
  phoneNumber: z.string().min(1, '연락처를 입력해주세요'),
  status: GolfCourseStatusEnum.default('ACTIVE'),
  notes: z.string().optional(),
})

export const UpdateGolfCourseRequestSchema = z.object({
  order: z.number().int().positive().optional(),
  region: RegionEnum.optional(),
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  status: GolfCourseStatusEnum.optional(),
  notes: z.string().optional(),
})

// Tee Time Schemas
export const CreateTeeTimeRequestSchema = z.object({
  golfCourseId: z.string().min(1, '골프장을 선택해주세요'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  time: timeSchema,
  greenFee: z.number().positive('그린피는 0보다 커야 합니다'),
  playerCount: z.number().int().min(1).max(4, '인원은 1~4명이어야 합니다'),
  requirements: z.string().min(1, '요청사항을 입력해주세요'),
  holeType: z.enum(['18홀', '9홀']),
  caddie: z.boolean(),
  advance: z.number().nonnegative('선입금은 0 이상이어야 합니다'),
  mealIncluded: z.boolean(),
  cartIncluded: z.boolean(),
  teeTimeType: TeeTimeTypeEnum.default('DAILY'),
  connectedTeeTimeId: z.string().optional(),
  accommodationInfo: z.string().optional(),
})

export const UpdateTeeTimeRequestSchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  time: timeSchema.optional(),
  greenFee: z.number().positive().optional(),
  playerCount: z.number().int().min(1).max(4).optional(),
  requirements: z.string().min(1).optional(),
  holeType: z.enum(['18홀', '9홀']).optional(),
  caddie: z.boolean().optional(),
  advance: z.number().nonnegative().optional(),
  mealIncluded: z.boolean().optional(),
  cartIncluded: z.boolean().optional(),
  connectedTeeTimeId: z.string().optional(),
  accommodationInfo: z.string().optional(),
})

// 10분 타이머 관련 Schemas
export const ReserveTeeTimeRequestSchema = z.object({
  teeTimeId: z.string().min(1, '티타임 ID가 필요합니다'),
})

export const ConfirmTeeTimeRequestSchema = z.object({
  teeTimeId: z.string().min(1, '티타임 ID가 필요합니다'),
  notes: z.string().optional(),
})

export const CancelTeeTimeRequestSchema = z.object({
  teeTimeId: z.string().min(1, '티타임 ID가 필요합니다'),
  reason: z.string().optional(),
})

// Performance Schemas
export const CompletePerformanceRequestSchema = z.object({
  teeTimeId: z.string().min(1, '티타임 ID가 필요합니다'),
  actualPlayerCount: z.number().int().min(1).max(4, '실제 인원은 1~4명이어야 합니다'),
  actualGreenFee: z.number().positive('실제 그린피는 0보다 커야 합니다'),
  notes: z.string().optional(),
})

// Query Parameter Schemas
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().regex(/^[a-zA-Z]+:(asc|desc)$/).optional(),
})

export const TeeTimeListParamsSchema = PaginationParamsSchema.extend({
  golfCourseId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: TeeTimeStatusEnum.optional(),
  teeTimeType: TeeTimeTypeEnum.optional(),
  bookingType: BookingTypeEnum.optional(),
})

export const MatrixViewParamsSchema = z.object({
  type: TeeTimeTypeEnum.optional(),
  booking: BookingTypeEnum.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(1).max(90).default(90),
})

export const PerformanceSummaryParamsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  managerId: z.string().optional(),
  teamId: z.string().optional(),
  golfCourseId: z.string().optional(),
})

export const PerformanceStatsParamsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  groupBy: z.enum(['manager', 'team', 'golfCourse', 'region']).optional(),
})

// Validation Helper Functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))
    
    throw {
      code: 'VALIDATION_ERROR',
      message: '입력값이 올바르지 않습니다',
      errors,
    }
  }
  
  return result.data
}

// Time Slot 자동 분류 함수
export function getTimeSlot(time: string): '1부' | '2부' | '3부' {
  const [hours] = time.split(':').map(Number)
  
  if (hours < 10) return '1부'
  if (hours < 15) return '2부'
  return '3부'
}

// Booking Type 자동 결정 함수
export function getBookingType(playerCount: number): 'BOOKING' | 'JOIN' {
  return playerCount === 4 ? 'BOOKING' : 'JOIN'
}

// 날짜 유효성 검사 함수
export function isValidFutureDate(date: string): boolean {
  const inputDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return inputDate >= today
}

// 10분 타이머 만료 확인 함수
export function isReservationExpired(reservedAt: Date | string): boolean {
  const reserved = new Date(reservedAt)
  const now = new Date()
  const tenMinutes = 10 * 60 * 1000 // 10분 in milliseconds
  
  return now.getTime() - reserved.getTime() > tenMinutes
}

// 권한 체크 함수
export function hasPermission(
  userType: z.infer<typeof AccountTypeEnum>,
  requiredTypes: z.infer<typeof AccountTypeEnum>[]
): boolean {
  return requiredTypes.includes(userType)
}

// 매니저 이상 권한 체크
export function isManager(userType: z.infer<typeof AccountTypeEnum>): boolean {
  const managerTypes: z.infer<typeof AccountTypeEnum>[] = [
    'INTERNAL_MANAGER',
    'EXTERNAL_MANAGER',
    'PARTNER',
    'TEAM_LEADER',
    'ADMIN',
    'SUPER_ADMIN',
  ]
  return hasPermission(userType, managerTypes)
}

// 관리자 이상 권한 체크
export function isAdmin(userType: z.infer<typeof AccountTypeEnum>): boolean {
  const adminTypes: z.infer<typeof AccountTypeEnum>[] = ['ADMIN', 'SUPER_ADMIN']
  return hasPermission(userType, adminTypes)
}

export default {
  // Schemas
  LoginRequestSchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  CreateTeamRequestSchema,
  UpdateTeamRequestSchema,
  CreateGolfCourseRequestSchema,
  UpdateGolfCourseRequestSchema,
  CreateTeeTimeRequestSchema,
  UpdateTeeTimeRequestSchema,
  ReserveTeeTimeRequestSchema,
  ConfirmTeeTimeRequestSchema,
  CancelTeeTimeRequestSchema,
  CompletePerformanceRequestSchema,
  PaginationParamsSchema,
  TeeTimeListParamsSchema,
  MatrixViewParamsSchema,
  PerformanceSummaryParamsSchema,
  PerformanceStatsParamsSchema,
  
  // Helper Functions
  validateRequest,
  getTimeSlot,
  getBookingType,
  isValidFutureDate,
  isReservationExpired,
  hasPermission,
  isManager,
  isAdmin,
}