// TeeTime 관련 타입 정의

export type TeeTimeStatus = 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type TeeTimeType = 'DAILY' | 'PACKAGE'
export type BookingType = 'BOOKING' | 'JOIN'
export type RequestType = 'ANY' | 'COUPLE' | 'MALE' | 'FEMALE'
export type HolesType = '9' | '18' | '36'
export type CaddyType = 'CADDY' | 'NO_CADDY' | 'DRIVING_CADDY' | 'TRAINEE_CADDY'
export type TimeSlot = 1 | 2 | 3 // 1부, 2부, 3부

export interface TeeTime {
  id: string
  golfCourseId: string
  golfCourseName?: string
  date: Date | string
  time: string
  greenFee: number
  availableSlots: number
  totalSlots: number
  teeTimeType: TeeTimeType
  bookingType: BookingType
  requestType: RequestType
  holes: HolesType
  caddyType: CaddyType
  deposit: boolean
  mealIncluded: boolean
  cartFeeIncluded: boolean
  status: TeeTimeStatus
  reservedAt?: Date | string
  confirmedAt?: Date | string
  completedAt?: Date | string
  cancelledAt?: Date | string
  reservedBy?: User
  confirmedBy?: User
  cancelledBy?: User
  managerId?: string
  managerName?: string
  createdAt: Date | string
  updatedAt: Date | string
  // Package 관련 필드
  connectedTeeTimeIds?: string[]
  accommodationInfo?: string
}

export interface User {
  id: string
  name: string
  phone: string
  accountType: string
  teamId?: string
}

// Matrix View 관련 타입
export interface MatrixData {
  region: string
  golfCourses: {
    id: string
    name: string
    dates: {
      date: string
      timeSlot1: number
      timeSlot2: number
      timeSlot3: number
      total: number
    }[]
  }[]
}

export interface DateColumn {
  date: string
  displayDate: string
  dayOfWeek: string
  isToday: boolean
  isWeekend: boolean
}

export interface MatrixApiResponse {
  matrixData: MatrixData[]
  dateColumns: DateColumn[]
  summary: {
    totalGolfCourses: number
    totalTeeTimes: number
    teeTimeType: string
    bookingType: string
    dateRange: {
      start: string
      end: string
    }
  }
}

// TeeTime 생성/수정 요청 타입
export interface CreateTeeTimeRequest {
  golfCourseId: string
  date: string
  time: string
  greenFee: number
  availableSlots: number
  totalSlots: number
  teeTimeType: TeeTimeType
  bookingType: BookingType
  requestType: RequestType
  holes: HolesType
  caddyType: CaddyType
  deposit: boolean
  mealIncluded: boolean
  cartFeeIncluded: boolean
  // Package 관련 선택 필드
  connectedTeeTimeIds?: string[]
  accommodationInfo?: string
}

export interface UpdateTeeTimeRequest extends Partial<CreateTeeTimeRequest> {
  id: string
}

// 예약 관련 요청 타입
export interface ReserveTeeTimeRequest {
  teeTimeId: string
  userId?: string
  numberOfPlayers: number
  specialRequests?: string
}

export interface ConfirmReservationRequest {
  teeTimeId: string
  userId?: string
  confirmationNote?: string
}

export interface CancelReservationRequest {
  teeTimeId: string
  userId?: string
  cancelReason?: string
}

// 필터 관련 타입
export interface TeeTimeFilter {
  golfCourseId?: string
  date?: string
  dateFrom?: string
  dateTo?: string
  timeSlot?: TimeSlot
  teeTimeType?: TeeTimeType
  bookingType?: BookingType
  status?: TeeTimeStatus
  region?: string
  requestType?: RequestType
  holes?: HolesType
  caddyType?: CaddyType
}