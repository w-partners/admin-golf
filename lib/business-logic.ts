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
// 권한 체크 함수들은 DB나 설정 파일에서 동적으로 가져와야 함
// 임시로 기본 권한 체크 함수만 남김
export const PERMISSIONS = {
  canManageGolfCourse: (accountType: string) => {
    // TODO: DB에서 권한 정보 조회
    return accountType === 'SUPER_ADMIN' || accountType === 'ADMIN';
  },
  canCreateTeeTime: (accountType: string) => {
    // TODO: DB에서 권한 정보 조회
    return accountType !== 'MEMBER' && accountType !== 'GOLF_COURSE';
  },
  canReserveTeeTime: (accountType: string) => {
    // TODO: DB에서 권한 정보 조회
    return accountType !== 'MEMBER' && accountType !== 'GOLF_COURSE';
  },
  canConfirmReservation: (
    accountType: string, 
    isOwn: boolean, 
    isTeamMember: boolean = false
  ) => {
    // TODO: DB에서 권한 정보 조회
    if (accountType === 'SUPER_ADMIN' || accountType === 'ADMIN') return true;
    if (accountType === 'TEAM_LEADER' && isTeamMember) return true;
    if ((accountType === 'INTERNAL_MANAGER' || accountType === 'EXTERNAL_MANAGER' || accountType === 'PARTNER') && isOwn) {
      return true;
    }
    return false;
  },
  canRegisterPerformance: (accountType: string) => {
    // TODO: DB에서 권한 정보 조회
    return accountType !== 'MEMBER' && accountType !== 'GOLF_COURSE' && accountType !== 'TEAM_LEADER';
  },
  canManageUsers: (accountType: string) => {
    // TODO: DB에서 권한 정보 조회
    return accountType === 'SUPER_ADMIN' || accountType === 'ADMIN';
  },
  canManageTeam: (accountType: string) => {
    // TODO: DB에서 권한 정보 조회
    return accountType === 'SUPER_ADMIN' || accountType === 'ADMIN' || accountType === 'TEAM_LEADER';
  },
  canAccessGolfCourse: (
    accountType: string, 
    userGolfCourseId?: number, 
    targetGolfCourseId?: number
  ) => {
    // TODO: DB에서 권한 정보 조회
    if (accountType !== 'GOLF_COURSE') return true;
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
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' }).replace('요일', '');
  
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