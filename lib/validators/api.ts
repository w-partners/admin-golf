import { z } from 'zod';

// Matrix API 쿼리 파라미터 검증
export const matrixQuerySchema = z.object({
  type: z.enum(['DAILY', 'PACKAGE']).optional().default('DAILY'),
  booking: z.enum(['BOOKING', 'JOIN']).optional().default('BOOKING'),
  days: z.coerce.number().min(1).max(90).optional().default(90)
});

// 티타임 생성 스키마
export const teeTimeCreateSchema = z.object({
  golfCourseId: z.number().positive(),
  date: z.string().datetime(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  greenFee: z.number().positive().max(1000000),
  players: z.number().min(1).max(4),
  request: z.string().max(500),
  holes: z.enum(['18', '9']),
  caddy: z.enum(['YES', 'NO', 'OPTIONAL']),
  prepayment: z.boolean(),
  meal: z.boolean(),
  cartFee: z.boolean(),
  type: z.enum(['DAILY', 'PACKAGE']),
  lodging: z.string().max(200).optional(),
  notes: z.string().max(1000).optional()
});

// 티타임 업데이트 스키마
export const teeTimeUpdateSchema = teeTimeCreateSchema.partial();

// 예약 스키마
export const reservationSchema = z.object({
  teeTimeId: z.number().positive(),
  managerId: z.number().positive(),
  booker: z.string().min(1).max(100)
});

// 로그인 스키마
export const loginSchema = z.object({
  phone: z.string()
    .regex(/^01[0-9]{8,9}$/, '유효한 휴대폰 번호를 입력해주세요'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100, '비밀번호가 너무 깁니다')
});

// 사용자 생성 스키마
export const userCreateSchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string()
    .regex(/^01[0-9]{8,9}$/, '유효한 휴대폰 번호를 입력해주세요'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  accountType: z.enum([
    'MEMBER',
    'GOLF_COURSE',
    'PARTNER',
    'EXTERNAL_MANAGER',
    'INTERNAL_MANAGER',
    'TEAM_LEADER',
    'ADMIN',
    'SUPER_ADMIN'
  ]),
  company: z.string().max(100).optional(),
  region: z.enum([
    'JEJU',
    'GYEONGGI_SOUTH',
    'GYEONGGI_NORTH',
    'GYEONGGI_EAST',
    'GANGWON',
    'CHUNGNAM',
    'GYEONGSANG',
    'JEOLLA'
  ]).optional(),
  teamId: z.number().positive().optional(),
  notes: z.string().max(500).optional()
});

// 사용자 업데이트 스키마
export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

// 비밀번호 변경 스키마
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

// 골프장 생성 스키마
export const golfCourseCreateSchema = z.object({
  sequence: z.number().positive(),
  name: z.string().min(2).max(100),
  region: z.enum([
    'JEJU',
    'GYEONGGI_SOUTH',
    'GYEONGGI_NORTH',
    'GYEONGGI_EAST',
    'GANGWON',
    'CHUNGNAM',
    'GYEONGSANG',
    'JEOLLA'
  ]),
  address: z.string().min(5).max(200),
  contact: z.string().regex(/^0[0-9]{1,2}-[0-9]{3,4}-[0-9]{4}$/),
  operStatus: z.enum(['API_CONNECTED', 'MANUAL', 'PENDING']),
  defaultPlayers: z.number().min(1).max(4).default(4),
  notes: z.string().max(500).optional()
});

// 골프장 업데이트 스키마
export const golfCourseUpdateSchema = golfCourseCreateSchema.partial();

// 실적 등록 스키마
export const performanceSchema = z.object({
  teeTimeId: z.number().positive(),
  commission: z.number().min(0).max(10000000),
  settlement: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']),
  notes: z.string().max(500).optional()
});

// 페이지네이션 스키마
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// 날짜 범위 스키마
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "시작일은 종료일보다 이전이어야 합니다",
  path: ["endDate"],
});

// 검색 스키마
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['name', 'phone', 'company', 'all']).optional().default('all')
});

// ID 파라미터 스키마
export const idParamSchema = z.object({
  id: z.coerce.number().positive()
});

// 유효성 검증 헬퍼 함수
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}