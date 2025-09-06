// Matrix View 관련 타입 정의
export interface GolfCourse {
  id: string;
  name: string;
  region: string;
}

export interface DateColumn {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  isToday: boolean;
  isWeekend: boolean;
}

export interface TeeTimeCount {
  timeSlot1: number;
  timeSlot2: number;
  timeSlot3: number;
}

export interface DateData extends TeeTimeCount {
  date: string;
  total: number;
}

export interface GolfCourseData {
  id: string;
  name: string;
  dates: DateData[];
}

export interface RegionData {
  region: string;
  golfCourses: GolfCourseData[];
}

export interface MatrixSummary {
  totalGolfCourses: number;
  totalTeeTimes: number;
  teeTimeType: string;
  bookingType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface MatrixResponse {
  matrixData: RegionData[];
  dateColumns: DateColumn[];
  summary: MatrixSummary;
}