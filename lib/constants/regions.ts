import { Region } from '@prisma/client';

// 지역 한글 매핑
export const 지역_한글 = {
  GANGWON: '강원',
  GYEONGGI: '경기', 
  GYEONGNAM: '경남',
  GYEONGBUK: '경북',
  JEONNAM: '전남',
  JEONBUK: '전북', 
  CHUNGNAM: '충남',
  JEJU: '제주'
} as const;

export const 지역_영문 = {
  '강원': 'GANGWON',
  '경기': 'GYEONGGI',
  '경남': 'GYEONGNAM', 
  '경북': 'GYEONGBUK',
  '전남': 'JEONNAM',
  '전북': 'JEONBUK',
  '충남': 'CHUNGNAM',
  '제주': 'JEJU'
} as const;

export const 지역목록 = Object.keys(지역_한글) as Region[];
export const 지역한글목록 = Object.values(지역_한글);

export const 지역변환 = {
  영문으로: (korean: string) => 지역_영문[korean as keyof typeof 지역_영문],
  한글로: (english: Region) => 지역_한글[english]
};

// 기존 함수 호환성 유지
export function getRegionLabel(region: string): string {
  return 지역_한글[region as Region] || region;
}