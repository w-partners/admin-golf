# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **골프장 예약 관리 시스템 (Golf Course Reservation Management System)** - a comprehensive platform for golf course reservation intermediaries managing multiple golf courses with centralized booking and performance tracking.

**Tech Stack:**
- Next.js 15 + TypeScript (App Router)
- shadcn/ui + Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth.js (phone-based authentication)
- Playwright for testing

## Architecture

## 포트 설정 : 절대 변경 불가.
- 사이트의 포트는 3007
- 데이터베이스의 포트는 5555

## 한글 사용 원칙 (중요!)
- **모든 곳에서 한글 사용 권장**: 데이터베이스, 변수명, 상수, enum, 함수명, 파일명 등
- **JavaScript/TypeScript는 한글을 완전히 지원**: 객체 키, 변수명, 함수명 모두 한글 가능
- **Prisma는 한글 enum을 지원**: Region enum에 '강원', '경상' 등 한글 값 사용 가능
- **모든 영문 상수를 한글로 대체 필수**: GANGWON → 강원, ADMIN → 관리자 등
- **한글 우선 정책**: 기술적 제약이 없는 한 모든 식별자를 한글로 작성
- **예외**: npm 패키지명, 외부 API 호출, HTML 태그명 등 외부 제약이 있는 경우만 영문 사용

### Database Design
- **Golf Course**: ID, 순번, 지역(8개 지역), 골프장명, 주소, 연락처, 운영상태(API연동/수동/대기), 기타
- **Tee Time**: 복합 엔티티 (자동 분류: 시간→1부/2부/3부, 인원→부킹/조인, 골프장→지역)
- **User Management**: 연락처 기반 로그인, 팀 구조 (팀장-팀원 관계)
- **Performance Tracking**: 완료된 티타임 기반 실적 등록 시스템
- **Connected Tee Times**: 패키지 여행용 연결 티타임 (숙박 정보 포함)

### Business Logic
- **Time Slot Auto-Classification**: 
  - 1부: 10시 이전
  - 2부: 10시-15시
  - 3부: 15시 이후
- **Booking Type Auto-Determination**: 
  - 부킹: 4명
  - 조인: 4명 미만
- **Regional Auto-Input**: 골프장 선택 시 해당 지역 자동 입력
- **10-Minute Reservation Timer**: 
  - 프론트엔드 카운트다운 표시
  - 백그라운드 자동 취소 처리
- **Team Approval System**: 팀장이 팀원 예약 확정 가능

### Permission System
8 account types with specific access rights:
1. `SUPER_ADMIN` (01034424668/admin1234) - 모든 기능 + 골프장 등록
2. `ADMIN` (01000000000/admin) - 모든 기능 접근
3. `TEAM_LEADER` (01000000001/admin) - 팀 관리 + 팀원 예약 확정
4. `INTERNAL_MANAGER` (01011111111/admin) - 티타임 등록/수정, 실적 등록
5. `EXTERNAL_MANAGER` (01022222222/admin) - 매니저와 동일 권한
6. `PARTNER` (01033333333/admin) - 매니저와 동일 권한
7. `GOLF_COURSE` (01044444444/admin) - 자신의 골프장 티타임만 조회/수정
8. `MEMBER` (01055555555/admin) - 티타임 조회만

## Key Features

### Matrix View System
- **4 Tab Layout**: [데일리부킹] [데일리조인] [패키지부킹] [패키지조인]
- **Fixed Header Structure**: 지역 | 골프장 || 날짜 columns (90일 range)
- **Time Slot Display**: [1부 수][2부 수][3부 수] per golf course per date
- **Horizontal Scroll**: 날짜 columns with sticky 지역/골프장 columns
- **Click-through**: 특정 시간대 클릭 → 상세 티타임 목록 페이지

### Detailed Tee Time List
선택된 골프장/날짜의 티타임 테이블:
- 유형 | 시간 | 그린피 | 인원 | 요청사항 | 홀선택 | 캐디 | 선입금 | 식사포함 | 카트비포함 | 관리(예약하기)

### Reservation Flow
```
티타임 등록/API → 매니저 예약 → (10분 이내) → 예약확정 → 골프 완료 → 실적등록
```

### Team System
- **Team Structure**: 팀장-팀원 관계
- **Approval Rights**: 팀장이 팀원 예약 확정 가능
- **Access Control**: 자신 + 팀장 이상만 예약확정 권한

### Connected Tee Times (Package)
- **Multi-Course**: 다른 골프장 연결 가능
- **Accommodation**: 숙박 정보 필드 추가
- **Individual Cancellation**: 연결 티타임 개별 해제 가능 (10분 전까지)

### Data Validation Rules
**필수 입력**: 골프장, 날짜, 그린피, 인원, 요청사항, 홀선택, 캐디, 선입금, 식사, 카트비포함
**제약사항**: 
- 중복 등록 불가 (예약 클릭한 매니저 우선)
- 과거 날짜 등록 불가 (실적등록은 예외)
- 그린피 소수점 1자리까지 (만원 단위)

### State Management
- **예약 상태**: AVAILABLE → RESERVED (10분 타이머) → CONFIRMED → COMPLETED
- **자동 취소**: 10분 초과시 AVAILABLE로 복원
- **날짜 숨김**: 과거 날짜 티타임 자동 숨김 처리

## UI Layout Structure

### Global Header
```
[로고][회사명]                                [알림아이콘][사용자프로필정보][로그인/로그아웃버튼]
```

### Quick Menu (권한별 표시)
```
[티타임:모두] [티타임등록:매니저이상] [골프장리스트/등록:관리자이상] [실적등록:매니저이상] [회원관리:관리자이상]
```

### Matrix View Layout
```
[데일리부킹] [데일리조인] [패키지부킹] [패키지조인]
---------------------------------------------------------
||지역     | 골프장     || 오늘 | +1일 | +2일 | ... | +90일 ||
||제주     | 취곡CC     || [1부][2부][3부] | [1부][2부][3부] | ... ||
||제주     | 포도CC     || [1부][2부][3부] | [1부][2부][3부] | ... ||
---------------------------------------------------------
```
- 좌측 지역/골프장 columns: sticky (스크롤시 고정)
- 우측 날짜 columns: 수평 스크롤 (최대 90일)
- 각 셀: 해당 시간대 티타임 수량 표시

## Development Commands

**Server Configuration**:
- **Fixed Port**: 3007
- **Development URL**: http://localhost:3007
- **Login Credentials**: 01034424668 / admin1234

**Available Commands**:
- `npm run dev` - Development server (port 3007)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript checks
- `npm run quality` - Run lint and type-check
- `npm run test` - Unit tests
- `npm run test:e2e` - Playwright E2E tests
- `npm run db:push` - Push schema changes
- `npm run db:seed` - Seed database

## Testing

### E2E Test Setup
- Playwright with stealth mode for real-user simulation
- Korean locale (ko-KR) and Asia/Seoul timezone
- Chrome user agent with Windows context
- Tests expect TARGET_URL environment variable

Current test file: `smoke.stealth.spec.ts` - Basic smoke test that:
- Launches stealth browser
- Navigates to TARGET_URL
- Validates no error pages (500/403/401)

### Test Accounts (Planned)
- Super Admin: `01034424668` / `admin1234`
- Various role accounts: `010********` / `admin`

## File Structure (Planned)

### Pages Structure
```
app/
├── layout.tsx                    # Global header + quick menu
├── page.tsx                      # Dashboard (권한별 차별화)
├── login/page.tsx               # 연락처 기반 로그인
├── tee-times/
│   ├── page.tsx                 # Matrix view (4 tabs)
│   ├── [golfCourse]/[date]/page.tsx # 상세 티타임 목록
│   ├── new/page.tsx            # 티타임 등록 (매니저이상)
│   └── [id]/page.tsx           # 티타임 상세/수정
├── golf-courses/
│   ├── page.tsx                 # 골프장 리스트
│   ├── new/page.tsx            # 골프장 등록 (관리자이상)
│   └── [id]/page.tsx           # 골프장 상세/수정
├── performance/
│   └── page.tsx                 # 완료된 티타임 실적등록
├── members/
│   ├── page.tsx                 # 회원 리스트 (관리자이상)
│   ├── new/page.tsx            # 회원 등록
│   └── [id]/page.tsx           # 회원 상세/수정
├── notices/
│   └── page.tsx                 # 시스템 공지사항
└── unauthorized/                # 권한 부족 페이지
```

### Components Structure
```
components/
├── tee-time/
│   ├── MatrixView.tsx          # 4탭 매트릭스 뷰
│   ├── MatrixTable.tsx         # 스크롤 테이블 (sticky columns)
│   ├── TeeTimeDetailList.tsx   # 선택 골프장/날짜 상세 목록
│   ├── ReservationTimer.tsx    # 10분 카운트다운
│   └── ConnectedTeeTimeForm.tsx # 연결 티타임 (숙박 정보)
├── golf-course/
│   └── GolfCourseForm.tsx      # 골프장 등록/수정 폼
├── performance/
│   └── PerformanceList.tsx     # 완료된 티타임 리스트
├── layout/
│   ├── GlobalHeader.tsx        # 로고, 프로필, 로그인/아웃
│   ├── QuickMenu.tsx           # 권한별 메뉴 표시
│   └── MobileNav.tsx           # 모바일 반응형 네비
└── ui/ (shadcn/ui components)
```

### Database Models
```
prisma/
├── schema.prisma               # 모든 모델 정의
│   ├── User (팀 구조 포함)
│   ├── Team (팀장-팀원 관계)
│   ├── GolfCourse (8개 지역)
│   ├── TeeTime (연결 티타임, 숙박 정보)
│   ├── SystemConfig (동적 설정)
│   └── Notice (공지사항)
└── seed.ts                     # 초기 계정 + 설정값
```

## Key Business Rules

1. **Time Classification**: Auto-categorize based on hour (< 10 = 1부, < 15 = 2부, >= 15 = 3부)
2. **Booking Type**: 4 players = 부킹, < 4 players = 조인
3. **Reservation Timer**: 10-minute window for confirmation, auto-cancel if expired
4. **Regional Auto-fill**: Selecting golf course automatically sets region
5. **Permission Gates**: Each action validated against account type permissions
6. **Team Approval**: Team leaders must confirm member reservations

## Security Considerations

- Phone-based authentication (no email)
- bcrypt password hashing (10 rounds)
- NextAuth.js session management
- Middleware-based route protection
- API-level permission validation
- No sensitive data in logs

## Performance Optimizations

- Next.js App Router with SSR
- Prisma query optimization
- Redis caching for matrix data (planned)
- Component-level caching strategies
- Mobile-responsive design

## MCP Integration

Project uses shadcn MCP server for UI component generation:
- Remote MCP: `https://www.shadcn.io/api/mcp`
- Enables dynamic component creation with design system consistency