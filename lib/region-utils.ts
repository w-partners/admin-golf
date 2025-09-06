// 지역 한글 매핑 유틸리티

export const REGION_LABELS = {
  'GANGWON': '강원',
  'GYEONGSANG': '경상', 
  'CHUNGCHEONG': '충청',
  'JEOLLA': '전라',
  'JEJU': '제주',
  'GYEONGBUK': '경북',
  'GYEONGNAM': '경남',
  'GYEONGDONG': '경동'
} as const;

export type RegionKey = keyof typeof REGION_LABELS;

export function getRegionLabel(region: string): string {
  return REGION_LABELS[region as RegionKey] || region;
}

export const REGION_OPTIONS = Object.entries(REGION_LABELS).map(([value, label]) => ({
  value,
  label
}));