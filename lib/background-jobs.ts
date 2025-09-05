import { PrismaClient, TeeTimeStatus } from '@prisma/client';
import { isReservationExpired } from './business-logic';

const prisma = new PrismaClient();

/**
 * 만료된 예약을 자동으로 취소하는 백그라운드 작업
 * 실제 운영에서는 cron job이나 별도의 worker로 실행
 */
export async function checkAndCancelExpiredReservations() {
  try {
    // RESERVED 상태인 모든 티타임 조회
    const reservedTeeTimes = await prisma.teeTime.findMany({
      where: {
        status: TeeTimeStatus.RESERVED,
        reservedAt: {
          not: null
        }
      },
      select: {
        id: true,
        reservedAt: true,
        golfCourse: {
          select: {
            name: true
          }
        },
        date: true,
        time: true
      }
    });

    const expiredTeeTimes = reservedTeeTimes.filter(tt => 
      isReservationExpired(tt.reservedAt)
    );

    if (expiredTeeTimes.length === 0) {
      console.log('[Background Job] 만료된 예약 없음');
      return { cancelled: 0 };
    }

    // 만료된 예약들을 AVAILABLE로 변경
    const updatePromises = expiredTeeTimes.map(tt =>
      prisma.teeTime.update({
        where: { id: tt.id },
        data: {
          status: TeeTimeStatus.AVAILABLE,
          reservedAt: null,
          managerId: null,
          booker: null
        }
      })
    );

    await Promise.all(updatePromises);

    console.log(`[Background Job] ${expiredTeeTimes.length}개 예약 자동 취소됨`);
    expiredTeeTimes.forEach(tt => {
      console.log(`  - ${tt.golfCourse.name} ${tt.date.toLocaleDateString()} ${tt.time.toLocaleTimeString()}`);
    });

    return { cancelled: expiredTeeTimes.length };
  } catch (error) {
    console.error('[Background Job] 예약 취소 처리 중 오류:', error);
    throw error;
  }
}

/**
 * 지정된 간격으로 만료 체크 실행
 * @param intervalMs - 체크 간격 (밀리초)
 * @returns 정리 함수
 */
export function startExpirationChecker(intervalMs: number = 60000) { // 기본 1분마다
  console.log('[Background Job] 예약 만료 체커 시작');
  
  // 즉시 한 번 실행
  checkAndCancelExpiredReservations();
  
  // 주기적으로 실행
  const intervalId = setInterval(() => {
    checkAndCancelExpiredReservations();
  }, intervalMs);

  // 정리 함수 반환
  return () => {
    console.log('[Background Job] 예약 만료 체커 중지');
    clearInterval(intervalId);
  };
}

/**
 * 과거 날짜 티타임 숨김 처리
 * 매일 자정에 실행되어야 함
 */
export async function archivePastTeeTimes() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 과거 날짜이면서 AVAILABLE 상태인 티타임들을 CANCELLED로 변경
    const result = await prisma.teeTime.updateMany({
      where: {
        date: {
          lt: today
        },
        status: TeeTimeStatus.AVAILABLE
      },
      data: {
        status: TeeTimeStatus.CANCELLED
      }
    });

    console.log(`[Background Job] ${result.count}개 과거 티타임 아카이브됨`);
    return { archived: result.count };
  } catch (error) {
    console.error('[Background Job] 과거 티타임 아카이브 중 오류:', error);
    throw error;
  }
}

/**
 * 완료된 티타임 자동 상태 변경
 * 티타임 시간이 지난 CONFIRMED 상태를 COMPLETED로 변경
 */
export async function markCompletedTeeTimes() {
  try {
    const now = new Date();

    // 현재 시간보다 이전이면서 CONFIRMED 상태인 티타임들
    const completedTeeTimes = await prisma.teeTime.findMany({
      where: {
        status: TeeTimeStatus.CONFIRMED,
        time: {
          lt: now
        }
      },
      select: {
        id: true,
        golfCourse: {
          select: {
            name: true
          }
        },
        date: true,
        time: true
      }
    });

    if (completedTeeTimes.length === 0) {
      console.log('[Background Job] 완료 처리할 티타임 없음');
      return { completed: 0 };
    }

    // COMPLETED로 상태 변경
    const updatePromises = completedTeeTimes.map(tt =>
      prisma.teeTime.update({
        where: { id: tt.id },
        data: {
          status: TeeTimeStatus.COMPLETED
        }
      })
    );

    await Promise.all(updatePromises);

    console.log(`[Background Job] ${completedTeeTimes.length}개 티타임 완료 처리됨`);
    return { completed: completedTeeTimes.length };
  } catch (error) {
    console.error('[Background Job] 완료 처리 중 오류:', error);
    throw error;
  }
}

/**
 * 모든 백그라운드 작업 시작
 * @returns 모든 정리 함수들
 */
export function startAllBackgroundJobs() {
  const cleanupFunctions: (() => void)[] = [];

  // 1. 예약 만료 체커 (1분마다)
  const stopExpirationChecker = startExpirationChecker(60000);
  cleanupFunctions.push(stopExpirationChecker);

  // 2. 완료 티타임 체커 (5분마다)
  const completedInterval = setInterval(() => {
    markCompletedTeeTimes();
  }, 5 * 60 * 1000);
  cleanupFunctions.push(() => clearInterval(completedInterval));

  // 3. 과거 티타임 아카이브 (1시간마다)
  const archiveInterval = setInterval(() => {
    archivePastTeeTimes();
  }, 60 * 60 * 1000);
  cleanupFunctions.push(() => clearInterval(archiveInterval));

  console.log('[Background Job] 모든 백그라운드 작업 시작됨');

  // 전체 정리 함수 반환
  return () => {
    console.log('[Background Job] 모든 백그라운드 작업 중지');
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}