// 골프장 마스터 데이터 (전체 시스템 공통 사용)
export const GOLF_COURSES = [
  // 제주
  { id: '1', name: '취곡CC', region: '제주' },
  { id: '2', name: '포도CC', region: '제주' },
  { id: '3', name: '라온CC', region: '제주' },
  { id: '4', name: '해비치CC', region: '제주' },
  
  // 경기남부
  { id: '5', name: '신원CC', region: '경기남부' },
  { id: '6', name: '렉스필드CC', region: '경기남부' },
  { id: '7', name: '골든베이CC', region: '경기남부' },
  
  // 경기북부
  { id: '8', name: '아시아나CC', region: '경기북부' },
  { id: '9', name: '서원밸리CC', region: '경기북부' },
  
  // 경기동부
  { id: '10', name: '리베라CC', region: '경기동부' },
  { id: '11', name: '솔모로CC', region: '경기동부' },
  
  // 강원
  { id: '12', name: '비발디파크CC', region: '강원' },
  { id: '13', name: '파인리즈CC', region: '강원' },
  
  // 충남
  { id: '14', name: '실크리버CC', region: '충남' },
  { id: '15', name: '골드레이크CC', region: '충남' },
  
  // 경상
  { id: '16', name: '통도파인이스트CC', region: '경상' },
  { id: '17', name: '에덴밸리CC', region: '경상' },
  
  // 전라
  { id: '18', name: '남원CC', region: '전라' },
  { id: '19', name: '무주덕유산CC', region: '전라' }
] as const;

export const REGIONS = [...new Set(GOLF_COURSES.map(gc => gc.region))] as const;

export type GolfCourseId = typeof GOLF_COURSES[number]['id'];
export type Region = typeof REGIONS[number];