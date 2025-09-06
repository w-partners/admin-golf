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
    orderBy: { sequence: 'asc' },
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
      confirmedBy: true,
      connected: true,
      connections: {
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
  const time = new Date(data.time);
  const hour = time.getHours();
  let timeSlot: string;
  
  if (hour < 10) {
    timeSlot = 'MORNING';
  } else if (hour < 15) {
    timeSlot = 'AFTERNOON';
  } else {
    timeSlot = 'EVENING';
  }
  
  const bookingType = data.players === 4 ? 'BOOKING' : 'JOIN';
  
  // Get golf course region
  const golfCourse = await prisma.golfCourse.findUnique({
    where: { id: parseInt(data.golfCourseId) },
    select: { region: true }
  });
  
  return await prisma.teeTime.create({
    data: {
      ...data,
      golfCourseId: parseInt(data.golfCourseId),
      timeSlot,
      bookingType,
      region: golfCourse?.region || 'JEJU',
      status: 'AVAILABLE'
    },
    include: {
      golfCourse: true,
      manager: true
    }
  });
}

// GolfCourse Helper Functions
export async function getAllGolfCourses() {
  return await prisma.golfCourse.findMany({
    orderBy: [
      { region: 'asc' },
      { sequence: 'asc' },
      { name: 'asc' }
    ]
  });
}

export async function getGolfCourseById(id: string) {
  return await prisma.golfCourse.findUnique({
    where: { id: parseInt(id) },
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
  const where: any = {
    status: 'COMPLETED',
    ...(managerId && { confirmedById: parseInt(managerId) })
  };
  
  return await prisma.teeTime.findMany({
    where,
    include: {
      golfCourse: true,
      confirmedBy: true,
      manager: true
    },
    orderBy: { confirmedAt: 'desc' }
  });
}

export async function updateTeeTimePerformance(id: string, performanceData: any) {
  return await prisma.teeTime.update({
    where: { id: parseInt(id) },
    data: {
      performanceReg: true,
      commission: parseFloat(performanceData.commission),
      settlement: performanceData.settlement,
      notes: performanceData.notes
    }
  });
}