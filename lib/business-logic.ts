import { TimeSlot, BookingType, Region, TeeTimeStatus } from '@prisma/client';

/**
 * 시간대를 기준으로 1부/2부/3부 자동 분류
 * @param time - 시간 (Date 객체 또는 string)
 * @returns TimeSlot enum
 */
export function classifyTimeSlot(time: Date | string): TimeSlot {
  const date = typeof time === 'string' ? new Date(time) : time;
  const hour = date.getHours();
  
  if (hour < 10) return TimeSlot.SLOT_1;  // 1부: 10시 이전
  if (hour < 15) return TimeSlot.SLOT_2;  // 2부: 10시-15시
  return TimeSlot.SLOT_3;                  // 3부: 15시 이후
}

/**
 * 인원수를 기준으로 부킹/조인 자동 결정
 * @param players - 예약 인원수
 * @returns BookingType enum
 */
export function determineBookingType(players: number): BookingType {
  return players === 4 ? BookingType.BOOKING : BookingType.JOIN;
}

/**
 * 10분 타이머 체크 - 예약 후 10분이 지났는지 확인
 * @param reservedAt - 예약 시간
 * @returns boolean - 10분 초과 여부
 */
export function isReservationExpired(reservedAt: Date | null): boolean {
  if (!reservedAt) return false;
  
  const now = new Date();
  const diffInMs = now.getTime() - reservedAt.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  
  return diffInMinutes > 10;
}

/**
 * 남은 예약 시간 계산 (초 단위)
 * @param reservedAt - 예약 시간
 * @returns number - 남은 시간(초), 만료시 0
 */
export function getRemainingSeconds(reservedAt: Date | null): number {
  if (!reservedAt) return 0;
  
  const now = new Date();
  const diffInMs = reservedAt.getTime() + (10 * 60 * 1000) - now.getTime();
  const remainingSeconds = Math.max(0, Math.floor(diffInMs / 1000));
  
  return remainingSeconds;
}

/**
 * 권한 체크 - 사용자가 특정 작업을 수행할 수 있는지 확인
 */
export const PERMISSIONS = {
  // 골프장 관리
  canManageGolfCourse: (accountType: string) => {
    return ['SUPER_ADMIN', 'ADMIN'].includes(accountType);
  },
  
  // 티타임 등록
  canCreateTeeTime: (accountType: string) => {
    return ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'INTERNAL_MANAGER', 
            'EXTERNAL_MANAGER', 'PARTNER'].includes(accountType);
  },
  
  // 티타임 예약
  canReserveTeeTime: (accountType: string) => {
    return ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'INTERNAL_MANAGER', 
            'EXTERNAL_MANAGER', 'PARTNER'].includes(accountType);
  },
  
  // 예약 확정 (자신 또는 팀원)
  canConfirmReservation: (
    accountType: string, 
    isOwn: boolean, 
    isTeamMember: boolean = false
  ) => {
    // 관리자는 모든 예약 확정 가능
    if (['SUPER_ADMIN', 'ADMIN'].includes(accountType)) return true;
    
    // 팀장은 팀원 예약 확정 가능
    if (accountType === 'TEAM_LEADER' && isTeamMember) return true;
    
    // 매니저는 자신의 예약만 확정
    if (['INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER'].includes(accountType) && isOwn) {
      return true;
    }
    
    return false;
  },
  
  // 실적 등록
  canRegisterPerformance: (accountType: string) => {
    return ['SUPER_ADMIN', 'ADMIN', 'INTERNAL_MANAGER', 
            'EXTERNAL_MANAGER', 'PARTNER'].includes(accountType);
  },
  
  // 회원 관리
  canManageUsers: (accountType: string) => {
    return ['SUPER_ADMIN', 'ADMIN'].includes(accountType);
  },
  
  // 팀 관리
  canManageTeam: (accountType: string) => {
    return ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'].includes(accountType);
  },
  
  // 골프장별 접근 (골프장 계정은 자신의 골프장만)
  canAccessGolfCourse: (
    accountType: string, 
    userGolfCourseId?: number, 
    targetGolfCourseId?: number
  ) => {
    // 관리자와 매니저는 모든 골프장 접근 가능
    if (accountType !== 'GOLF_COURSE') return true;
    
    // 골프장 계정은 자신의 골프장만
    return userGolfCourseId === targetGolfCourseId;
  }
};

/**
 * 날짜 범위 생성 (오늘부터 90일)
 * @returns Date[] - 90일간의 날짜 배열
 */
export function generateDateRange(days: number = 90): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * 날짜를 한국 형식으로 포맷
 * @param date - Date 객체
 * @returns string - "MM/DD (요일)" 형식
 */
export function formatDateKR(date: Date): string {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  
  return `${month}/${day} (${weekday})`;
}

/**
 * 시간을 한국 형식으로 포맷
 * @param time - Date 객체
 * @returns string - "HH:MM" 형식
 */
export function formatTimeKR(time: Date): string {
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * 지역 한글명 매핑
 */
export const REGION_NAMES: Record<Region, string> = {
  GYEONGGI_NORTH: '경기북부',
  GYEONGGI_SOUTH: '경기남부',
  GYEONGGI_EAST: '경기동부',
  GANGWON: '강원',
  GYEONGSANG: '경상',
  CHUNGNAM: '충남',
  JEOLLA: '전라',
  JEJU: '제주'
};

/**
 * 시간대 한글명 매핑
 */
export const TIME_SLOT_NAMES = {
  SLOT_1: '1부',
  SLOT_2: '2부',
  SLOT_3: '3부'
};

/**
 * 예약 상태 한글명 매핑
 */
export const STATUS_NAMES = {
  AVAILABLE: '예약가능',
  RESERVED: '예약중',
  CONFIRMED: '예약확정',
  COMPLETED: '완료',
  CANCELLED: '취소'
};

/**
 * 그린피 포맷 (만원 단위, 소수점 1자리)
 * @param fee - 그린피 (Decimal 또는 number)
 * @returns string - "12.5만원" 형식
 */
export function formatGreenFee(fee: number | string): string {
  const numFee = typeof fee === 'string' ? parseFloat(fee) : fee;
  return `${numFee.toFixed(1)}만원`;
}

/**
 * 과거 날짜인지 체크
 * @param date - 체크할 날짜
 * @returns boolean - 과거 날짜 여부
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

/**
 * 예약 가능 여부 체크
 * @param status - 티타임 상태
 * @param reservedAt - 예약 시간
 * @returns boolean - 예약 가능 여부
 */
export function isReservable(
  status: TeeTimeStatus,
  reservedAt: Date | null
): boolean {
  // AVAILABLE 상태거나
  if (status === TeeTimeStatus.AVAILABLE) return true;
  
  // RESERVED 상태인데 10분이 지났으면 예약 가능
  if (status === TeeTimeStatus.RESERVED && isReservationExpired(reservedAt)) {
    return true;
  }
  
  return false;
}

/**
 * 연결 티타임 해제 가능 여부 체크 (10분 전까지만)
 * @param teeTime - 티타임 시간
 * @returns boolean - 해제 가능 여부
 */
export function isUnlinkable(teeTime: Date): boolean {
  const now = new Date();
  const diffInMs = teeTime.getTime() - now.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  
  return diffInMinutes > 10;
}