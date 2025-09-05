import { PrismaClient, TeeTimeType, BookingType, TimeSlot, TeeTimeStatus } from '@prisma/client';
import { generateDateRange } from './business-logic';

const prisma = new PrismaClient();

/**
 * Matrix View용 데이터 구조
 */
export interface MatrixCell {
  slot1Count: number;  // 1부 수량
  slot2Count: number;  // 2부 수량
  slot3Count: number;  // 3부 수량
  total: number;       // 전체 수량
}

export interface MatrixRow {
  golfCourseId: number;
  golfCourseName: string;
  region: string;
  regionName: string;
  cells: Map<string, MatrixCell>; // dateKey -> MatrixCell
}

export interface MatrixData {
  dates: Date[];
  rows: MatrixRow[];
}

/**
 * Matrix View 데이터 조회
 * @param type - 티타임 유형 (DAILY/PACKAGE)
 * @param bookingType - 부킹 타입 (BOOKING/JOIN)
 * @param days - 표시할 일수 (기본 90일)
 */
export async function getMatrixData(
  type: TeeTimeType,
  bookingType: BookingType,
  days: number = 90
): Promise<MatrixData> {
  try {
    // 1. 날짜 범위 생성
    const dates = generateDateRange(days);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // 2. 모든 골프장 조회
    const golfCourses = await prisma.golfCourse.findMany({
      orderBy: [
        { region: 'asc' },
        { sequence: 'asc' }
      ]
    });

    // 3. 해당 기간의 티타임 데이터 조회
    const teeTimes = await prisma.teeTime.findMany({
      where: {
        type,
        bookingType,
        date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [TeeTimeStatus.AVAILABLE, TeeTimeStatus.RESERVED, TeeTimeStatus.CONFIRMED]
        }
      },
      select: {
        golfCourseId: true,
        date: true,
        timeSlot: true
      }
    });

    // 4. 데이터를 Matrix 형태로 변환
    const rows: MatrixRow[] = [];

    for (const gc of golfCourses) {
      const row: MatrixRow = {
        golfCourseId: gc.id,
        golfCourseName: gc.name,
        region: gc.region,
        regionName: getRegionName(gc.region),
        cells: new Map()
      };

      // 각 날짜에 대해 초기화
      for (const date of dates) {
        const dateKey = getDateKey(date);
        row.cells.set(dateKey, {
          slot1Count: 0,
          slot2Count: 0,
          slot3Count: 0,
          total: 0
        });
      }

      // 해당 골프장의 티타임 수량 계산
      const gcTeeTimes = teeTimes.filter(tt => tt.golfCourseId === gc.id);
      
      for (const tt of gcTeeTimes) {
        const dateKey = getDateKey(tt.date);
        const cell = row.cells.get(dateKey);
        
        if (cell) {
          switch (tt.timeSlot) {
            case TimeSlot.SLOT_1:
              cell.slot1Count++;
              break;
            case TimeSlot.SLOT_2:
              cell.slot2Count++;
              break;
            case TimeSlot.SLOT_3:
              cell.slot3Count++;
              break;
          }
          cell.total++;
        }
      }

      rows.push(row);
    }

    return { dates, rows };
  } catch (error) {
    console.error('Matrix 데이터 조회 오류:', error);
    throw error;
  }
}

/**
 * 특정 골프장/날짜의 상세 티타임 목록 조회
 * @param golfCourseId - 골프장 ID
 * @param date - 날짜
 * @param type - 티타임 유형 (옵션)
 * @param bookingType - 부킹 타입 (옵션)
 */
export async function getDetailedTeeTimes(
  golfCourseId: number,
  date: Date,
  type?: TeeTimeType,
  bookingType?: BookingType
) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      golfCourseId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    if (type) where.type = type;
    if (bookingType) where.bookingType = bookingType;

    const teeTimes = await prisma.teeTime.findMany({
      where,
      include: {
        golfCourse: true,
        manager: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        confirmedBy: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: [
        { time: 'asc' }
      ]
    });

    return teeTimes;
  } catch (error) {
    console.error('상세 티타임 조회 오류:', error);
    throw error;
  }
}

/**
 * Matrix View 요약 통계
 * @param type - 티타임 유형
 * @param bookingType - 부킹 타입
 */
export async function getMatrixSummary(
  type?: TeeTimeType,
  bookingType?: BookingType
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      date: {
        gte: today
      },
      status: {
        in: [TeeTimeStatus.AVAILABLE, TeeTimeStatus.RESERVED, TeeTimeStatus.CONFIRMED]
      }
    };

    if (type) where.type = type;
    if (bookingType) where.bookingType = bookingType;

    // 전체 수량
    const total = await prisma.teeTime.count({ where });

    // 시간대별 수량
    const slot1 = await prisma.teeTime.count({
      where: { ...where, timeSlot: TimeSlot.SLOT_1 }
    });
    const slot2 = await prisma.teeTime.count({
      where: { ...where, timeSlot: TimeSlot.SLOT_2 }
    });
    const slot3 = await prisma.teeTime.count({
      where: { ...where, timeSlot: TimeSlot.SLOT_3 }
    });

    // 상태별 수량
    const available = await prisma.teeTime.count({
      where: { ...where, status: TeeTimeStatus.AVAILABLE }
    });
    const reserved = await prisma.teeTime.count({
      where: { ...where, status: TeeTimeStatus.RESERVED }
    });
    const confirmed = await prisma.teeTime.count({
      where: { ...where, status: TeeTimeStatus.CONFIRMED }
    });

    return {
      total,
      bySlot: {
        slot1,
        slot2,
        slot3
      },
      byStatus: {
        available,
        reserved,
        confirmed
      }
    };
  } catch (error) {
    console.error('Matrix 요약 통계 조회 오류:', error);
    throw error;
  }
}

/**
 * 날짜를 키로 변환
 */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 지역 한글명 반환
 */
function getRegionName(region: string): string {
  const regionNames: Record<string, string> = {
    GYEONGGI_NORTH: '경기북부',
    GYEONGGI_SOUTH: '경기남부',
    GYEONGGI_EAST: '경기동부',
    GANGWON: '강원',
    GYEONGSANG: '경상',
    CHUNGNAM: '충남',
    JEOLLA: '전라',
    JEJU: '제주'
  };
  return regionNames[region] || region;
}