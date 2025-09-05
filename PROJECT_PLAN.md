# 골프장 예약 관리 시스템 - 프로젝트 실행 계획

## 즉시 실행 작업 (Day 1-2)

### 1. 프로젝트 기본 구조 완성
```bash
# Next.js 프로젝트 초기화
npx create-next-app@latest admin-golf --typescript --tailwind --app --no-src-dir

# 필수 패키지 설치
pnpm add @prisma/client prisma next-auth@beta bcryptjs
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add react-hook-form zod @hookform/resolvers
pnpm add date-fns react-hot-toast
pnpm add -D @types/bcryptjs

# shadcn/ui 초기화
npx shadcn@latest init
npx shadcn@latest add button card dialog form input label select table tabs toast
```

### 2. 환경 설정 파일
```env
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/golf_admin"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
REDIS_URL="redis://localhost:6379"
```

### 3. 데이터베이스 스키마 (prisma/schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  TEAM_LEADER
  INTERNAL_MANAGER
  EXTERNAL_MANAGER
  PARTNER
  GOLF_COURSE
  MEMBER
}

enum Region {
  SEOUL
  GYEONGGI
  GANGWON
  CHUNGCHEONG
  JEOLLA
  GYEONGSANG
  JEJU
  OTHER
}

enum TimeSlot {
  SLOT_1  // 10시 이전
  SLOT_2  // 10시-15시
  SLOT_3  // 15시 이후
}

enum BookingType {
  BOOKING  // 4명
  JOIN     // 4명 미만
}

enum TeeTimeStatus {
  AVAILABLE
  RESERVED
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum OperationStatus {
  API_CONNECTED
  MANUAL
  PENDING
}

model User {
  id          String    @id @default(cuid())
  phone       String    @unique
  password    String
  name        String
  role        UserRole
  teamId      String?
  team        Team?     @relation("TeamMembers", fields: [teamId], references: [id])
  ledTeam     Team?     @relation("TeamLeader")
  reservations Reservation[]
  performances Performance[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([phone])
  @@index([teamId])
}

model Team {
  id          String   @id @default(cuid())
  name        String
  leaderId    String   @unique
  leader      User     @relation("TeamLeader", fields: [leaderId], references: [id])
  members     User[]   @relation("TeamMembers")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model GolfCourse {
  id              String          @id @default(cuid())
  order           Int             @unique
  region          Region
  name            String
  address         String
  phone           String
  operationStatus OperationStatus @default(MANUAL)
  notes           String?
  teeTimes        TeeTime[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([region])
  @@index([operationStatus])
}

model TeeTime {
  id               String        @id @default(cuid())
  golfCourseId     String
  golfCourse       GolfCourse    @relation(fields: [golfCourseId], references: [id])
  date             DateTime      @db.Date
  time             DateTime      @db.Time
  timeSlot         TimeSlot
  bookingType      BookingType
  greenFee         Decimal       @db.Decimal(10, 1)
  playerCount      Int
  requirements     String
  holes            String
  caddie           Boolean
  deposit          Decimal?      @db.Decimal(10, 1)
  mealIncluded     Boolean
  cartFeeIncluded  Boolean
  status           TeeTimeStatus @default(AVAILABLE)
  connectedGroupId String?
  connectedGroup   ConnectedTeeTimeGroup? @relation(fields: [connectedGroupId], references: [id])
  reservations     Reservation[]
  performance      Performance?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@unique([golfCourseId, date, time])
  @@index([date])
  @@index([status])
  @@index([timeSlot])
  @@index([bookingType])
  @@index([connectedGroupId])
}

model ConnectedTeeTimeGroup {
  id                String     @id @default(cuid())
  teeTimes          TeeTime[]
  accommodationInfo String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}

model Reservation {
  id              String        @id @default(cuid())
  teeTimeId       String
  teeTime         TeeTime       @relation(fields: [teeTimeId], references: [id])
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  reservedAt      DateTime      @default(now())
  expiresAt       DateTime
  confirmedAt     DateTime?
  confirmedBy     String?
  cancelledAt     DateTime?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([teeTimeId])
  @@index([expiresAt])
}

model Performance {
  id          String   @id @default(cuid())
  teeTimeId   String   @unique
  teeTime     TeeTime  @relation(fields: [teeTimeId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  completedAt DateTime
  revenue     Decimal  @db.Decimal(10, 1)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([completedAt])
}

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Notice {
  id        String   @id @default(cuid())
  title     String
  content   String
  isPinned  Boolean  @default(false)
  author    String
  viewCount Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isPinned])
  @@index([createdAt])
}
```

## Week 1: 기반 구축

### Day 1-2: 프로젝트 초기화
- [x] Next.js 15 프로젝트 생성
- [ ] 기본 폴더 구조 생성
- [ ] Prisma 스키마 작성 및 마이그레이션
- [ ] Seed 데이터 생성 (8개 권한별 테스트 계정)

### Day 3-4: 인증 시스템
- [ ] NextAuth.js 설정 (app/api/auth/[...nextauth]/route.ts)
- [ ] 로그인 페이지 UI (app/login/page.tsx)
- [ ] 세션 타입 정의 및 미들웨어
- [ ] 권한 검증 Hook 작성

### Day 5-7: 기본 API & UI
- [ ] 골프장 CRUD API
- [ ] 글로벌 레이아웃 (헤더, 퀵메뉴)
- [ ] 권한별 라우트 보호
- [ ] 기본 대시보드 페이지

## Week 2: 핵심 비즈니스 로직

### Day 8-9: 티타임 등록 시스템
- [ ] 티타임 등록 API (자동 분류 로직)
- [ ] 티타임 등록 폼 UI
- [ ] 중복 검증 및 날짜 제약

### Day 10-12: 예약 시스템
- [ ] 10분 타이머 컴포넌트
- [ ] 예약 상태 전환 API
- [ ] Redis 세션 관리 설정
- [ ] 백엔드 자동 취소 크론잡

### Day 13-14: 팀 시스템
- [ ] 팀장 승인 API
- [ ] 팀 관리 UI
- [ ] 권한 기반 액션 제한

## Week 3-4: 매트릭스 뷰 구현

### Week 3: 매트릭스 테이블
- [ ] 4탭 레이아웃 구성
- [ ] 스크롤 테이블 (sticky columns)
- [ ] 90일 날짜 컬럼 렌더링
- [ ] 가상화 스크롤 최적화

### Week 4: 상세 기능
- [ ] 시간대별 수량 계산 로직
- [ ] 클릭 이벤트 및 라우팅
- [ ] 상세 티타임 목록 페이지
- [ ] 모바일 반응형 처리

## Week 5-6: 보조 기능

### Week 5: 실적 & 회원 관리
- [ ] 실적 등록 시스템
- [ ] 회원 관리 CRUD
- [ ] 통계 대시보드

### Week 6: 공지 & 패키지
- [ ] 공지사항 시스템
- [ ] 연결 티타임 (패키지) 기능
- [ ] 숙박 정보 관리

## Week 7-8: 최적화 & 배포

### Week 7: 테스트 & 최적화
- [ ] E2E 테스트 작성
- [ ] 성능 최적화
- [ ] 보안 강화

### Week 8: 배포
- [ ] GCP 배포 환경 구축
- [ ] CI/CD 파이프라인
- [ ] 모니터링 설정
- [ ] 문서화

## 핵심 컴포넌트 구조

### 1. 매트릭스 뷰 컴포넌트
```typescript
// components/tee-time/MatrixView.tsx
interface MatrixViewProps {
  type: 'daily-booking' | 'daily-join' | 'package-booking' | 'package-join';
  dateRange: { start: Date; end: Date };
}

// components/tee-time/MatrixTable.tsx
interface MatrixTableProps {
  golfCourses: GolfCourse[];
  teeTimes: TeeTimeMatrix;
  onCellClick: (golfCourseId: string, date: string, timeSlot: TimeSlot) => void;
}
```

### 2. 예약 타이머 컴포넌트
```typescript
// components/tee-time/ReservationTimer.tsx
interface ReservationTimerProps {
  expiresAt: Date;
  onExpire: () => void;
}
```

### 3. 권한 검증 Hook
```typescript
// hooks/useAuth.ts
export function useRequireRole(requiredRoles: UserRole[]) {
  const { data: session } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!session || !requiredRoles.includes(session.user.role)) {
      router.push('/unauthorized');
    }
  }, [session, requiredRoles]);
  
  return session;
}
```

## API 라우트 구조

```
app/api/
├── auth/[...nextauth]/route.ts
├── golf-courses/
│   ├── route.ts              # GET(list), POST(create)
│   └── [id]/route.ts         # GET, PUT, DELETE
├── tee-times/
│   ├── route.ts              # GET(list), POST(create)
│   ├── [id]/route.ts         # GET, PUT, DELETE
│   ├── matrix/route.ts       # GET(matrix data)
│   └── reserve/route.ts      # POST(reservation)
├── reservations/
│   ├── route.ts              # GET(list)
│   ├── [id]/confirm/route.ts # POST(confirm)
│   └── [id]/cancel/route.ts  # POST(cancel)
├── performance/
│   └── route.ts              # GET, POST
├── users/
│   └── route.ts              # GET, POST, PUT
└── notices/
    └── route.ts              # GET, POST
```

## 성공 기준

### Week 1-2 체크포인트
- [ ] 로그인 가능
- [ ] 권한별 접근 제어 작동
- [ ] 골프장 CRUD 완성
- [ ] 티타임 등록 가능

### Week 3-4 체크포인트
- [ ] 매트릭스 뷰 렌더링
- [ ] 10분 타이머 작동
- [ ] 예약 플로우 완성
- [ ] 모바일 반응형

### Week 5-6 체크포인트
- [ ] 전체 기능 구현 완료
- [ ] 실적 등록 가능
- [ ] 패키지 티타임 작동

### Week 7-8 체크포인트
- [ ] 테스트 커버리지 80%
- [ ] 성능 목표 달성
- [ ] 프로덕션 배포 완료
- [ ] 문서화 완성

## 리스크 및 대응 방안

### 기술적 리스크
1. **90일 매트릭스 렌더링 성능**
   - 가상화 스크롤 구현
   - React Query 캐싱
   - 서버사이드 페이지네이션

2. **10분 타이머 동시성**
   - Redis 분산 락
   - 낙관적 업데이트
   - 트랜잭션 처리

3. **모바일 반응형 매트릭스**
   - 모바일 전용 뷰 제공
   - 터치 제스처 지원
   - 간소화된 UI

### 비즈니스 리스크
1. **예약 충돌**
   - 실시간 상태 동기화
   - 충돌 감지 및 알림
   - 자동 대안 제시

2. **권한 관리 복잡도**
   - 명확한 권한 매트릭스
   - 테스트 시나리오 문서화
   - 관리자 대시보드 제공