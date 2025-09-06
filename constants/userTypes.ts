/**
 * 사용자 계정 유형 라벨 매핑
 */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '관리자', 
  TEAM_LEADER: '팀장',
  INTERNAL_MANAGER: '내부매니저',
  EXTERNAL_MANAGER: '외부매니저',
  PARTNER: '파트너',
  GOLF_COURSE: '골프장',
  MEMBER: '회원'
} as const;

/**
 * 계정 유형을 한국어 라벨로 변환
 */
export const getAccountTypeLabel = (accountType: string): string => {
  return ACCOUNT_TYPE_LABELS[accountType] || accountType;
};

/**
 * 계정 유형별 배지 색상 클래스
 */
export const ACCOUNT_TYPE_BADGE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  TEAM_LEADER: 'bg-blue-100 text-blue-800 border-blue-200',
  INTERNAL_MANAGER: 'bg-green-100 text-green-800 border-green-200',
  EXTERNAL_MANAGER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PARTNER: 'bg-orange-100 text-orange-800 border-orange-200',
  GOLF_COURSE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  MEMBER: 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

/**
 * 계정 유형에 따른 배지 색상 클래스 반환
 */
export const getAccountTypeBadgeColor = (accountType: string): string => {
  return ACCOUNT_TYPE_BADGE_COLORS[accountType] || ACCOUNT_TYPE_BADGE_COLORS.MEMBER;
};