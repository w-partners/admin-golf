import { PrismaClient } from '@prisma/client';
import { cache } from 'react';

const prisma = new PrismaClient();

// 쿼리 최적화 전략

/**
 * 1. 인덱스 최적화
 * Prisma 스키마에 다음 인덱스 추가 권장:
 * @@index([golfCourseId, date, teeTimeType, bookingType])
 * @@index([date, status])
 * @@index([reservedAt])
 */

/**
 * 2. 선택적 필드 로딩 (select 사용)
 * 필요한 필드만 선택하여 데이터 전송량 감소
 */
export const getMatrixTeeTimes = cache(async (
  startDate: Date,
  endDate: Date,
  teeTimeType: string,
  bookingType: string
) => {
  return await prisma.teeTime.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      teeTimeType,
      bookingType,
      status: 'AVAILABLE'
    },
    select: {
      id: true,
      golfCourseId: true,
      date: true,
      time: true,
      players: true,
      greenFee: true
    },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });
});

/**
 * 3. 집계 쿼리 최적화
 * GROUP BY를 사용한 효율적인 카운트
 */
export const getMatrixCounts = cache(async (
  startDate: Date,
  endDate: Date,
  teeTimeType: string,
  bookingType: string
) => {
  const result = await prisma.$queryRaw`
    SELECT 
      golf_course_id,
      date,
      CASE 
        WHEN EXTRACT(HOUR FROM time) < 10 THEN '1부'
        WHEN EXTRACT(HOUR FROM time) < 15 THEN '2부'
        ELSE '3부'
      END as time_slot,
      COUNT(*) as count
    FROM tee_times
    WHERE 
      date >= ${startDate}
      AND date <= ${endDate}
      AND tee_time_type = ${teeTimeType}
      AND booking_type = ${bookingType}
      AND status = 'AVAILABLE'
    GROUP BY golf_course_id, date, time_slot
    ORDER BY golf_course_id, date, time_slot
  `;
  
  return result;
});

/**
 * 4. 배치 업데이트 최적화
 * 여러 레코드를 한 번에 업데이트
 */
export const updateExpiredReservations = async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  return await prisma.teeTime.updateMany({
    where: {
      status: 'RESERVED',
      reservedAt: {
        lt: tenMinutesAgo
      }
    },
    data: {
      status: 'AVAILABLE',
      reservedBy: null,
      reservedAt: null
    }
  });
};

/**
 * 5. 연결 풀 최적화
 * connection_limit 설정으로 동시 연결 제한
 */
export const optimizedPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=10'
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
});

/**
 * 6. 트랜잭션 최적화
 * 여러 작업을 하나의 트랜잭션으로 처리
 */
export const reserveTeeTime = async (
  teeTimeId: number,
  userId: number
) => {
  return await prisma.$transaction(async (tx) => {
    // 티타임 상태 확인
    const teeTime = await tx.teeTime.findUnique({
      where: { id: teeTimeId },
      select: { status: true }
    });
    
    if (teeTime?.status !== 'AVAILABLE') {
      throw new Error('이미 예약된 티타임입니다');
    }
    
    // 예약 처리
    const updated = await tx.teeTime.update({
      where: { id: teeTimeId },
      data: {
        status: 'RESERVED',
        reservedBy: userId,
        reservedAt: new Date()
      }
    });
    
    // 예약 이력 생성
    await tx.reservation.create({
      data: {
        teeTimeId,
        userId,
        status: 'PENDING'
      }
    });
    
    return updated;
  });
};

/**
 * 7. 커서 기반 페이지네이션
 * OFFSET 대신 커서 사용으로 성능 향상
 */
export const getTeeTimesWithCursor = async (
  cursor?: number,
  take: number = 50
) => {
  const teeTimes = await prisma.teeTime.findMany({
    take: take + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1
    }),
    orderBy: {
      id: 'asc'
    }
  });
  
  const hasNextPage = teeTimes.length > take;
  const items = hasNextPage ? teeTimes.slice(0, -1) : teeTimes;
  
  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : undefined
  };
};

/**
 * 8. Raw SQL 쿼리 최적화
 * 복잡한 쿼리는 Raw SQL로 직접 최적화
 */
export const getDailyStatistics = async (date: Date) => {
  return await prisma.$queryRaw`
    WITH time_slots AS (
      SELECT 
        gc.id as golf_course_id,
        gc.name as golf_course_name,
        gc.region,
        COALESCE(SUM(CASE WHEN EXTRACT(HOUR FROM tt.time) < 10 THEN 1 ELSE 0 END), 0) as slot_1,
        COALESCE(SUM(CASE WHEN EXTRACT(HOUR FROM tt.time) >= 10 AND EXTRACT(HOUR FROM tt.time) < 15 THEN 1 ELSE 0 END), 0) as slot_2,
        COALESCE(SUM(CASE WHEN EXTRACT(HOUR FROM tt.time) >= 15 THEN 1 ELSE 0 END), 0) as slot_3,
        COUNT(tt.id) as total
      FROM golf_courses gc
      LEFT JOIN tee_times tt ON gc.id = tt.golf_course_id 
        AND tt.date = ${date}
        AND tt.status = 'AVAILABLE'
      GROUP BY gc.id, gc.name, gc.region
    )
    SELECT * FROM time_slots
    ORDER BY region, golf_course_name
  `;
};

/**
 * 9. 캐싱 전략
 * React cache + Redis 레이어 추가 가능
 */
const CACHE_TTL = 60 * 1000; // 1분
const memoryCache = new Map<string, { data: any; timestamp: number }>();

export const cachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const cached = memoryCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await queryFn();
  memoryCache.set(key, { data, timestamp: Date.now() });
  
  return data;
};

/**
 * 10. 데이터베이스 연결 관리
 * 연결 해제 및 재사용
 */
export const cleanup = async () => {
  await prisma.$disconnect();
};

// Node.js 프로세스 종료시 연결 정리
process.on('beforeExit', async () => {
  await cleanup();
});