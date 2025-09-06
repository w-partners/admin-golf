import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper functions for database operations
export async function findGolfCoursesByRegion(region: string) {
  return await prisma.golfCourse.findMany({
    where: { region },
    orderBy: { orderIndex: 'asc' },
    include: {
      teeTimes: {
        where: {
          date: {
            gte: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 90))
          }
        },
        orderBy: { date: 'asc' }
      }
    }
  });
}

// TeeTime Helper Functions
export async function getTeeTimesByDateRange(startDate: Date, endDate: Date) {
  return await prisma.teeTime.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      golfCourse: true,
      reservedBy: true,
      confirmedBy: true,
      relatedTeeTimes: {
        include: {
          golfCourse: true
        }
      }
    },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });
}

export async function createTeeTime(data: any) {
  // Auto-classification logic
  const hour = parseInt(data.time.split(':')[0]);
  let timePart: 'PART_1' | 'PART_2' | 'PART_3';
  
  if (hour < 10) {
    timePart = 'PART_1';
  } else if (hour < 15) {
    timePart = 'PART_2';
  } else {
    timePart = 'PART_3';
  }
  
  const bookingType = data.players === 4 ? 'BOOKING' : 'JOIN';
  
  // Get golf course region
  const golfCourse = await prisma.golfCourse.findUnique({
    where: { id: data.golfCourseId },
    select: { region: true }
  });
  
  return await prisma.teeTime.create({
    data: {
      ...data,
      timePart,
      bookingType,
      region: golfCourse?.region || 'JEJU',
      status: 'AVAILABLE'
    },
    include: {
      golfCourse: true,
      reservedBy: true
    }
  });
}

// GolfCourse Helper Functions
export async function getAllGolfCourses() {
  return await prisma.golfCourse.findMany({
    orderBy: [
      { region: 'asc' },
      { orderIndex: 'asc' },
      { name: 'asc' }
    ]
  });
}

export async function getGolfCourseById(id: string) {
  return await prisma.golfCourse.findUnique({
    where: { id },
    include: {
      teeTimes: {
        where: {
          date: {
            gte: new Date()
          }
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ],
        take: 20
      }
    }
  });
}

// User Helper Functions
export async function getUsersByRole(role: string) {
  return await prisma.user.findMany({
    where: { accountType: role as any },
    orderBy: { createdAt: 'desc' },
    include: {
      team: true,
      managedTeam: true
    }
  });
}

// Performance Helper Functions
export async function getCompletedTeeTimes(managerId?: string) {
  const where = {
    status: 'COMPLETED' as const,
    ...(managerId && { confirmedById: managerId })
  };
  
  return await prisma.teeTime.findMany({
    where,
    include: {
      golfCourse: true,
      confirmedBy: true,
      reservedBy: true
    },
    orderBy: { completedAt: 'desc' }
  });
}

export async function updateTeeTimePerformance(id: string, performanceData: any) {
  return await prisma.teeTime.update({
    where: { id },
    data: {
      performanceRegistered: true,
      commissionType: performanceData.commissionType,
      commissionAmount: performanceData.commissionAmount,
      settlementMethod: performanceData.settlementMethod,
      notes: performanceData.notes,
      completedAt: new Date()
    }
  });
}