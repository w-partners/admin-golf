// 골프장 예약 시스템 타입 정의

export type AccountType = 
  | 'SUPER_ADMIN'     // 슈퍼관리자
  | 'ADMIN'           // 관리자
  | 'TEAM_LEADER'     // 팀장
  | 'INTERNAL_MANAGER' // 내부매니저
  | 'EXTERNAL_MANAGER' // 외부매니저
  | 'PARTNER'         // 파트너
  | 'GOLF_COURSE'     // 골프장
  | 'MEMBER';         // 회원

export type Region = 
  | 'GANGWON'   // 강원
  | 'GYEONGGI'  // 경기
  | 'GYEONGNAM' // 경남
  | 'GYEONGBUK' // 경북
  | 'JEONNAM'   // 전남
  | 'JEONBUK'   // 전북
  | 'CHUNGNAM'  // 충남
  | 'JEJU';     // 제주

export type OperStatus = 
  | 'API_INTEGRATED' // API연동
  | 'MANUAL'         // 수동
  | 'STANDBY';       // 대기

export type TimeSlot = 
  | 'MORNING'   // 1부 (< 10시)
  | 'AFTERNOON' // 2부 (10-15시)
  | 'EVENING';  // 3부 (>= 15시)

export type BookingType = 
  | 'BOOKING' // 부킹 (4명)
  | 'JOIN';   // 조인 (4명 미만)

export type TeeTimeStatus = 
  | 'AVAILABLE' // 예약가능
  | 'RESERVED'  // 예약중 (10분 타이머)
  | 'CONFIRMED' // 확정
  | 'COMPLETED' // 완료
  | 'CANCELLED'; // 취소

export type TeeTimeType = 
  | 'DAILY'   // 데일리
  | 'PACKAGE'; // 패키지

export type UserStatus = 
  | 'ACTIVE'    // 활성
  | 'INACTIVE'  // 비활성
  | 'SUSPENDED'; // 정지

// 한글 매핑 객체들
export const AccountTypeLabels: Record<AccountType, string> = {
  SUPER_ADMIN: '슈퍼관리자',
  ADMIN: '관리자',
  TEAM_LEADER: '팀장',
  INTERNAL_MANAGER: '내부매니저', 
  EXTERNAL_MANAGER: '외부매니저',
  PARTNER: '파트너',
  GOLF_COURSE: '골프장',
  MEMBER: '회원'
};

export const RegionLabels: Record<Region, string> = {
  GANGWON: '강원',
  GYEONGGI: '경기',
  GYEONGNAM: '경남',
  GYEONGBUK: '경북',
  JEONNAM: '전남',
  JEONBUK: '전북',
  CHUNGNAM: '충남',
  JEJU: '제주'
};

export const TimeSlotLabels: Record<TimeSlot, string> = {
  MORNING: '1부',
  AFTERNOON: '2부', 
  EVENING: '3부'
};

export const BookingTypeLabels: Record<BookingType, string> = {
  BOOKING: '부킹',
  JOIN: '조인'
};

export const TeeTimeStatusLabels: Record<TeeTimeStatus, string> = {
  AVAILABLE: '예약가능',
  RESERVED: '예약중',
  CONFIRMED: '확정',
  COMPLETED: '완료',
  CANCELLED: '취소'
};

export const TeeTimeTypeLabels: Record<TeeTimeType, string> = {
  DAILY: '데일리',
  PACKAGE: '패키지'
};

export const UserStatusLabels: Record<UserStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지'
};

// 시간대 자동 분류 함수
export function getTimeSlotFromHour(hour: number): TimeSlot {
  if (hour < 10) return 'MORNING';
  if (hour < 15) return 'AFTERNOON';
  return 'EVENING';
}

// 예약 유형 자동 분류 함수
export function getBookingTypeFromPlayers(players: number): BookingType {
  return players >= 4 ? 'BOOKING' : 'JOIN';
}