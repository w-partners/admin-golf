'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GolfCourse {
  id: number;
  name: string;
  region: string;
}

interface TeeTime {
  id: number;
  golfCourseId: number;
  date: string;
  time: string;
  timeSlot: string;
  bookingType: string;
  players: number;
  greenFee: number;
  status: string;
}

interface MatrixData {
  [golfCourseId: number]: {
    [date: string]: {
      '1부': number;
      '2부': number;
      '3부': number;
    };
  };
}

const GOLF_COURSES: GolfCourse[] = [
  { id: 1, name: '오라CC', region: '제주' },
  { id: 2, name: '라헨느CC', region: '제주' },
  { id: 3, name: '블랙스톤CC', region: '제주' },
  { id: 4, name: '파인비치CC', region: '경남' },
  { id: 5, name: '아난티코브CC', region: '경남' },
  { id: 6, name: '해슬리나인브릿지', region: '제주' },
  { id: 7, name: '롯데스카이힐CC', region: '제주' },
  { id: 8, name: '통영마리나베이CC', region: '경남' },
];

// 셀 컴포넌트를 메모이제이션
const TeeTimeCell = memo(({ 
  count, 
  onClick, 
  timeSlot 
}: { 
  count: number; 
  onClick: () => void; 
  timeSlot: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1 text-xs hover:bg-blue-50 transition-colors',
        count > 0 && 'bg-green-50 font-semibold text-green-700'
      )}
    >
      {count > 0 ? count : '-'}
    </button>
  );
});

TeeTimeCell.displayName = 'TeeTimeCell';

// 행 컴포넌트를 메모이제이션
const GolfCourseRow = memo(({
  golfCourse,
  dates,
  matrixData,
  onCellClick
}: {
  golfCourse: GolfCourse;
  dates: Date[];
  matrixData: MatrixData;
  onCellClick: (golfCourse: GolfCourse, date: Date, timeSlot: string) => void;
}) => {
  const getCellData = useCallback((date: Date, timeSlot: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return matrixData[golfCourse.id]?.[dateKey]?.[timeSlot as '1부' | '2부' | '3부'] || 0;
  }, [matrixData, golfCourse.id]);

  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 z-10 bg-white border p-2 text-sm font-medium">
        {golfCourse.region}
      </td>
      <td className="sticky left-24 z-10 bg-white border p-2 text-sm">
        {golfCourse.name}
      </td>
      {dates.map((date) => (
        <td key={date.toISOString()} className="border p-0">
          <div className="grid grid-cols-3 divide-x">
            {['1부', '2부', '3부'].map((timeSlot) => (
              <TeeTimeCell
                key={timeSlot}
                count={getCellData(date, timeSlot)}
                onClick={() => onCellClick(golfCourse, date, timeSlot)}
                timeSlot={timeSlot}
              />
            ))}
          </div>
        </td>
      ))}
    </tr>
  );
});

GolfCourseRow.displayName = 'GolfCourseRow';

export function MatrixView() {
  const [activeTab, setActiveTab] = useState('daily-booking');
  const [startDate, setStartDate] = useState(0);
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [matrixData, setMatrixData] = useState<MatrixData>({});
  const [cache, setCache] = useState<Map<string, any>>(new Map());

  // 날짜 배열을 메모이제이션
  const dates = useMemo(
    () => Array.from({ length: 30 }, (_, i) => addDays(new Date(), startDate + i)),
    [startDate]
  );

  // API 호출 함수 최적화
  const fetchTeeTimes = useCallback(async () => {
    const start = format(dates[0], 'yyyy-MM-dd');
    const end = format(dates[dates.length - 1], 'yyyy-MM-dd');
    const bookingType = activeTab.includes('booking') ? 'BOOKING' : 'JOIN';
    
    // 캐시 키 생성
    const cacheKey = `${start}-${end}-${bookingType}`;
    
    // 캐시에서 데이터 확인
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      setTeeTimes(cachedData.teeTimes);
      setMatrixData(cachedData.matrixData);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/public/tee-times?startDate=${start}&endDate=${end}&bookingType=${bookingType}`,
        {
          headers: {
            'Cache-Control': 'max-age=60'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const processed = processMatrixData(data);
        
        // 캐시에 저장
        const newCache = new Map(cache);
        newCache.set(cacheKey, {
          teeTimes: data,
          matrixData: processed
        });
        setCache(newCache);
        
        setTeeTimes(data);
        setMatrixData(processed);
      }
    } catch (error) {
      console.error('Error fetching tee times:', error);
    } finally {
      setLoading(false);
    }
  }, [dates, activeTab, cache]);

  useEffect(() => {
    fetchTeeTimes();
  }, [fetchTeeTimes]);

  // 데이터 처리 함수 최적화
  const processMatrixData = useCallback((teeTimes: TeeTime[]) => {
    const matrix: MatrixData = {};
    
    for (const teeTime of teeTimes) {
      if (!matrix[teeTime.golfCourseId]) {
        matrix[teeTime.golfCourseId] = {};
      }
      
      const dateKey = format(new Date(teeTime.date), 'yyyy-MM-dd');
      
      if (!matrix[teeTime.golfCourseId][dateKey]) {
        matrix[teeTime.golfCourseId][dateKey] = {
          '1부': 0,
          '2부': 0,
          '3부': 0,
        };
      }
      
      matrix[teeTime.golfCourseId][dateKey][teeTime.timeSlot as keyof typeof matrix[number][string]]++;
    }
    
    return matrix;
  }, []);

  const handleCellClick = useCallback((golfCourse: GolfCourse, date: Date, timeSlot: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log(`Clicked: ${golfCourse.name} - ${dateStr} - ${timeSlot}`);
    // 여기에 상세 페이지로 이동하는 로직 추가
  }, []);

  const handlePrevDates = useCallback(() => {
    setStartDate(prev => Math.max(0, prev - 7));
  }, []);

  const handleNextDates = useCallback(() => {
    setStartDate(prev => Math.min(60, prev + 7));
  }, []);

  // 탭 레이블 메모이제이션
  const tabLabel = useMemo(() => {
    switch(activeTab) {
      case 'daily-booking': return '데일리 부킹 (4명)';
      case 'daily-join': return '데일리 조인 (1-3명)';
      case 'package-booking': return '패키지 부킹 (4명)';
      case 'package-join': return '패키지 조인 (1-3명)';
      default: return '';
    }
  }, [activeTab]);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily-booking">데일리부킹</TabsTrigger>
          <TabsTrigger value="daily-join">데일리조인</TabsTrigger>
          <TabsTrigger value="package-booking">패키지부킹</TabsTrigger>
          <TabsTrigger value="package-join">패키지조인</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{tabLabel}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevDates}
                disabled={startDate === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {format(dates[0], 'MM/dd')} - {format(dates[dates.length - 1], 'MM/dd')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDates}
                disabled={startDate >= 60}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border p-2 text-left w-24">지역</th>
                  <th className="sticky left-24 z-20 bg-gray-50 border p-2 text-left w-32">골프장</th>
                  {dates.map((date) => (
                    <th key={date.toISOString()} className="border p-1 text-center min-w-[100px] bg-gray-50">
                      <div className="text-xs font-normal">
                        {format(date, 'MM/dd')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(date, 'EEE', { locale: ko })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GOLF_COURSES.map((golfCourse) => (
                  <GolfCourseRow
                    key={golfCourse.id}
                    golfCourse={golfCourse}
                    dates={dates}
                    matrixData={matrixData}
                    onCellClick={handleCellClick}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">데이터 로딩 중...</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}