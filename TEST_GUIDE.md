# 골프장 예약 관리 시스템 테스트 가이드

## 📋 테스트 구조

```
__tests__/
├── unit/                    # 단위 테스트
│   ├── permissions.test.ts  # 권한 시스템 테스트
│   └── reservation.test.ts  # 예약 시스템 테스트
├── integration/             # 통합 테스트
│   └── api-teetimes.test.ts # API 엔드포인트 테스트
├── e2e/                     # E2E 테스트
│   └── reservation-flow.spec.ts # 예약 플로우 전체 테스트
└── utils/                   # 테스트 유틸리티
    ├── test-helpers.ts      # 테스트 헬퍼 함수
    └── db-test-helpers.ts   # 데이터베이스 테스트 유틸리티

components/__tests__/        # 컴포넌트 테스트
└── ReservationTimer.test.tsx # 예약 타이머 컴포넌트 테스트
```

## 🚀 테스트 실행 방법

### 환경 설정

```bash
# 테스트 데이터베이스 설정
export DATABASE_TEST_URL="postgresql://test:test@localhost:5432/golf_test"

# 테스트 의존성 설치
npm install

# Playwright 브라우저 설치 (E2E 테스트용)
npx playwright install
```

### 테스트 명령어

```bash
# 모든 테스트 실행
npm run test:all

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행
npm run test:integration

# E2E 테스트 실행
npm run test:e2e

# 테스트 커버리지 확인
npm run test:coverage

# Watch 모드로 테스트 실행 (개발 중)
npm run test:watch

# E2E 테스트 UI 모드
npm run test:e2e:ui

# E2E 테스트 디버그 모드
npm run test:e2e:debug
```

## 🎯 핵심 테스트 시나리오

### 1. 권한 시스템 테스트
- ✅ 8개 계정 유형별 권한 검증
- ✅ 팀장-팀원 관계 권한 테스트
- ✅ API 엔드포인트별 권한 검증
- ✅ 권한 에스컬레이션 방지
- ✅ 동적 권한 검증 (골프장 담당자, 팀장)

### 2. 예약 시스템 테스트
- ✅ 10분 타이머 로직
- ✅ 예약 상태 전환 (AVAILABLE → RESERVED → CONFIRMED → COMPLETED)
- ✅ 중복 예약 방지
- ✅ 자동 취소 로직
- ✅ 시간대 자동 분류 (1부/2부/3부)
- ✅ 예약 유형 자동 결정 (부킹/조인)

### 3. API 통합 테스트
- ✅ 티타임 CRUD 작업
- ✅ 예약/확정/취소 플로우
- ✅ 권한별 접근 제한
- ✅ 데이터 검증
- ✅ 에러 처리

### 4. E2E 테스트
- ✅ 전체 예약 플로우 (등록 → 예약 → 확정 → 완료)
- ✅ 10분 타이머 만료 시나리오
- ✅ 팀장의 팀원 예약 승인
- ✅ 권한별 접근 제한
- ✅ Matrix View 실시간 업데이트
- ✅ 패키지 티타임 예약

## 📊 테스트 커버리지 목표

- **전체 커버리지**: ≥80%
- **핵심 비즈니스 로직**: ≥90%
  - 권한 시스템
  - 10분 예약 타이머
  - 예약 상태 관리
- **API 엔드포인트**: 100%
- **UI 컴포넌트**: ≥70%

## 🔧 테스트 데이터

### 테스트 계정
```typescript
SUPER_ADMIN: { phone: '01034424668', password: 'admin1234' }
ADMIN: { phone: '01000000000', password: 'admin' }
TEAM_LEADER: { phone: '01000000001', password: 'admin' }
INTERNAL_MANAGER: { phone: '01011111111', password: 'admin' }
EXTERNAL_MANAGER: { phone: '01022222222', password: 'admin' }
PARTNER: { phone: '01033333333', password: 'admin' }
GOLF_COURSE: { phone: '01044444444', password: 'admin' }
MEMBER: { phone: '01055555555', password: 'admin' }
```

### 시드 데이터
- 3개 골프장 (제주, 경기, 부산)
- 5개 티타임 (다양한 상태)
- 8개 사용자 (각 권한별)
- 1개 팀 (팀장-팀원 관계)

## 🐛 디버깅

### Jest 테스트 디버깅
```bash
# VS Code 디버거 사용
# .vscode/launch.json에 설정 추가
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Playwright 테스트 디버깅
```bash
# 헤드리스 모드 비활성화
npx playwright test --headed

# 디버그 모드
npx playwright test --debug

# 특정 테스트만 실행
npx playwright test reservation-flow.spec.ts
```

## 📈 CI/CD 통합

GitHub Actions를 통한 자동화된 테스트:
1. PR 생성 시 자동 테스트 실행
2. 테스트 커버리지 리포트 생성
3. 테스트 실패 시 스크린샷/비디오 업로드
4. 커버리지 임계값 체크 (80%)

## ⚠️ 주의사항

1. **테스트 격리**: 각 테스트는 독립적으로 실행되어야 함
2. **데이터 정리**: 테스트 후 데이터베이스 정리 필수
3. **병렬 실행**: 통합/E2E 테스트는 순차 실행 권장
4. **타임아웃**: 10분 타이머 테스트 시 시간 조작 필요
5. **환경 변수**: 테스트 환경별 환경 변수 분리

## 🔄 지속적 개선

- [ ] 성능 테스트 추가
- [ ] 부하 테스트 시나리오
- [ ] 보안 테스트 강화
- [ ] 접근성 테스트 추가
- [ ] 시각적 회귀 테스트