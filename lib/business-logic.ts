import { TimeSlot, BookingType, Region } from '@prisma/client';
import { prisma } from './prisma';

// 티타임 자동 분류 로직
export function classifyTimeSlot(time: Date): TimeSlot {
  const hour = time.getHours();
  if (hour < 10) return TimeSlot.SLOT_1;      // 1부: 10시 이전
  if (hour < 15) return TimeSlot.SLOT_2;      // 2부: 10시-15시
  return TimeSlot.SLOT_3;                     // 3부: 15시 이후
}

// 골프장 기반 지역 자동 입력
export async function getRegionByGolfCourse(golfCourseId: number): Promise<Region> {
  const golfCourse = await prisma.golfCourse.findUnique({
    where: { id: golfCourseId }
  });
  return golfCourse?.region || Region.GYEONGGI_NORTH;
}

// 부킹/조인 자동 분류
export function determineBookingType(players: number): BookingType {
  return players === 4 ? BookingType.BOOKING : BookingType.JOIN;
}

// 예약 10분 타이머 체크
export function isReservationExpired(reservedAt: Date): boolean {
  const now = new Date();
  const diffMinutes = (now.getTime() - reservedAt.getTime()) / (1000 * 60);
  return diffMinutes > 10;
}

// 권한 체크 시스템
export async function checkPermission(userId: number, action: string, resource: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { team: true, managedTeam: true }
  });
  
  if (!user) return false;
  
  // 기본 권한 매트릭스
  const permissions = {
    'SUPER_ADMIN': ['*'],
    'ADMIN': ['tee-times:*', 'golf-courses:*', 'members:*', 'performance:*'],
    'TEAM_LEADER': ['tee-times:read', 'tee-times:create', 'tee-times:confirm', 'performance:*'],
    'INTERNAL_MANAGER': ['tee-times:read', 'tee-times:create', 'performance:register'],
    'EXTERNAL_MANAGER': ['tee-times:read', 'tee-times:create', 'performance:register'],
    'PARTNER': ['tee-times:read', 'tee-times:create', 'performance:register'],
    'GOLF_COURSE': ['tee-times:read:own'],
    'MEMBER': ['tee-times:read']
  };
  
  const userPermissions = permissions[user.accountType] || [];
  
  // 모든 권한 또는 특정 액션 권한 체크
  return userPermissions.includes('*') || 
         userPermissions.includes(`${resource}:*`) ||
         userPermissions.includes(`${resource}:${action}`);
}

// 티타임 매트릭스 데이터 생성
export async function generateTeeTimeMatrix(region: Region, date: string) {
  const targetDate = new Date(date);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  const golfCourses = await prisma.golfCourse.findMany({
    where: { region },
    orderBy: { sequence: 'asc' },
    include: {
      teeTimes: {
        where: {
          date: {
            gte: targetDate,
            lt: nextDate
          },
          status: {
            in: ['AVAILABLE', 'RESERVED', 'CONFIRMED']
          }
        }
      }
    }
  });
  
  const matrix = golfCourses.map(course => {
    const timeSlots = {
      SLOT_1: { booking: 0, join: 0 },
      SLOT_2: { booking: 0, join: 0 },
      SLOT_3: { booking: 0, join: 0 }
    };
    
    course.teeTimes.forEach(teeTime => {
      if (teeTime.bookingType === BookingType.BOOKING) {
        timeSlots[teeTime.timeSlot].booking++;
      } else {
        timeSlots[teeTime.timeSlot].join++;
      }
    });
    
    return {
      id: course.id,
      name: course.name,
      timeSlots
    };
  });
  
  return {
    region,
    date: date,
    golfCourses: matrix
  };
}

// 지역별 한글 이름 매핑
export const REGION_NAMES = {
  GYEONGGI_NORTH: '경기북부',
  GYEONGGI_SOUTH: '경기남부', 
  GYEONGGI_EAST: '경기동부',
  GANGWON: '강원',
  GYEONGSANG: '경상',
  CHUNGNAM: '충남',
  JEOLLA: '전라',
  JEJU: '제주'
};

// 계정 유형별 한글 이름 매핑
export const ACCOUNT_TYPE_NAMES = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '관리자',
  TEAM_LEADER: '팀장',
  INTERNAL_MANAGER: '내부매니저',
  EXTERNAL_MANAGER: '외부매니저',
  PARTNER: '거래처',
  GOLF_COURSE: '골프장',
  MEMBER: '회원'
};

// 날짜 포맷팅
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
}

// 시간 포맷팅
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}