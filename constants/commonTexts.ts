/**
 * 공통 텍스트 상수
 */
export const COMMON_TEXTS = {
  ACTIONS: {
    LOGIN: '로그인',
    LOGOUT: '로그아웃',
    REGISTER: '등록',
    EDIT: '수정',
    DELETE: '삭제',
    CANCEL: '취소',
    SAVE: '저장',
    CONFIRM: '확인',
    SEARCH: '검색',
    FILTER: '필터',
    RESET: '초기화',
    SUBMIT: '제출',
    CLOSE: '닫기'
  },
  LOADING_STATES: {
    LOGIN: '로그인 중...',
    LOGOUT: '로그아웃 중...',
    REGISTER: '등록 중...',
    SAVE: '저장 중...',
    DELETE: '삭제 중...',
    LOADING: '로딩 중...',
    PROCESSING: '처리 중...',
    SUBMITTING: '제출 중...'
  },
  STATUS: {
    SUCCESS: '성공',
    ERROR: '오류',
    WARNING: '경고',
    INFO: '정보',
    PENDING: '대기중',
    COMPLETED: '완료',
    FAILED: '실패'
  },
  MENU_ITEMS: {
    DASHBOARD: '대시보드',
    TEE_TIME_VIEW: '티타임 조회',
    TEE_TIME_CREATE: '티타임 등록',
    GOLF_COURSE: '골프장 관리',
    PERFORMANCE: '실적 관리',
    MEMBERS: '회원 관리',
    TEAM: '팀 관리',
    NOTICES: '공지사항',
    PROFILE: '내 정보'
  }
} as const;