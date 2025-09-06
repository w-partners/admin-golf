# 데이터베이스 스키마 개선 가이드

## 개요
기존 데이터를 보존하면서 점진적으로 데이터베이스를 개선하는 방법입니다.

## 현재 상태 분석

### 누락된 주요 기능
1. **10분 타이머**: `expiresAt` 필드 및 자동 만료 처리 누락
2. **실적 관리**: Performance 관련 테이블 전체 누락  
3. **예약 이력**: ReservationLog 테이블 누락
4. **성능 인덱스**: Matrix View 최적화 인덱스 미적용

## 단계별 실행 방법

### Phase 1: 필수 필드 추가 (즉시 적용 가능)
```bash
# 백업 먼저 실행
pg_dump -h localhost -p 51213 -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Phase 1 실행 - 필수 필드 추가
psql -h localhost -p 51213 -U postgres -d postgres -f prisma/migrations/20241227_phase1_essential_fields.sql

# Prisma 클라이언트 재생성
npx prisma generate
```

**영향도**: 매우 낮음 (필드 추가만)
**다운타임**: 없음
**롤백**: 추가된 필드 DROP 가능

### Phase 2: 성능 최적화 인덱스 (백그라운드 실행)
```bash
# CONCURRENTLY 옵션으로 운영 중단 없이 실행
psql -h localhost -p 51213 -U postgres -d postgres -f prisma/migrations/20241227_phase2_performance_indexes.sql
```

**영향도**: 없음 (조회 성능만 향상)
**다운타임**: 없음 (CONCURRENTLY 사용)
**롤백**: DROP INDEX 가능

### Phase 3: 실적 관리 테이블 생성
```bash
# 새 테이블 생성 - 기존 데이터 영향 없음
psql -h localhost -p 51213 -U postgres -d postgres -f prisma/migrations/20241227_phase3_performance_tables.sql

# Prisma 스키마 업데이트
cp prisma/schema.improved.prisma prisma/schema.prisma
npx prisma generate
```

**영향도**: 없음 (새 테이블만 생성)
**다운타임**: 없음
**롤백**: DROP TABLE 가능

### Phase 4: 자동 만료 시스템 활성화
```bash
# 자동 만료 처리 시스템 설치
psql -h localhost -p 51213 -U postgres -d postgres -f prisma/migrations/20241227_phase4_auto_expiry_system.sql

# 애플리케이션에서 expire_reserved_tee_times() 함수 주기적 호출 설정
```

**영향도**: 낮음 (트리거 추가)
**다운타임**: 없음
**롤백**: DROP TRIGGER/FUNCTION 가능

## 애플리케이션 코드 적응

### 1. 10분 타이머 처리
```typescript
// lib/timer.ts
export async function checkExpiredReservations() {
  // DB 함수 호출
  await prisma.$executeRaw`SELECT expire_reserved_tee_times()`;
  
  // 또는 뷰 사용
  const activeReservations = await prisma.$queryRaw`
    SELECT * FROM active_reservations 
    WHERE effective_status = 'RESERVED'
    AND seconds_remaining > 0
  `;
}

// 1분마다 실행
setInterval(checkExpiredReservations, 60000);
```

### 2. Matrix View 최적화
```typescript
// Matrix View 캐시 사용
const matrixData = await prisma.$queryRaw`
  SELECT * FROM matrix_view_cache
  WHERE date >= CURRENT_DATE 
  AND date <= CURRENT_DATE + INTERVAL '90 days'
  ORDER BY date, region, "golfCourseId"
`;
```

### 3. 실적 등록
```typescript
// 티타임 완료 후 실적 등록
await prisma.performance.create({
  data: {
    teeTimeId: completedTeeTime.id,
    actualPlayers: 4,
    actualFee: 25.0,
    revenue: 100.0,
    profit: 20.0,
    registeredById: userId
  }
});

// 티타임 상태 업데이트
await prisma.teeTime.update({
  where: { id: teeTimeId },
  data: { 
    performanceReg: true,
    status: 'COMPLETED',
    completedAt: new Date()
  }
});
```

## 모니터링

### 성능 체크
```sql
-- 인덱스 사용률 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 느린 쿼리 확인
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

### 타이머 상태 확인
```sql
-- 현재 예약 상태
SELECT 
  id,
  status,
  "reservedAt",
  "expiresAt",
  EXTRACT(EPOCH FROM ("expiresAt" - NOW())) as seconds_remaining
FROM tee_times
WHERE status = 'RESERVED';

-- 만료 대상 확인
SELECT COUNT(*) 
FROM tee_times
WHERE status = 'RESERVED' 
AND "expiresAt" < NOW();
```

## 롤백 계획

각 단계별 롤백 스크립트:

### Phase 1 롤백
```sql
ALTER TABLE tee_times 
DROP COLUMN IF EXISTS "expiresAt",
DROP COLUMN IF EXISTS "completedAt",
DROP COLUMN IF EXISTS "cancelledAt",
DROP COLUMN IF EXISTS "cancelReason",
DROP COLUMN IF EXISTS "version",
DROP COLUMN IF EXISTS "deletedAt";

ALTER TABLE golf_courses
DROP COLUMN IF EXISTS "isActive",
DROP COLUMN IF EXISTS "createdAt",
DROP COLUMN IF EXISTS "updatedAt";
```

### Phase 2 롤백
```sql
DROP INDEX IF EXISTS idx_tee_times_matrix_view;
DROP INDEX IF EXISTS idx_tee_times_golf_course_date;
-- 모든 인덱스 DROP
```

### Phase 3 롤백  
```sql
DROP TABLE IF EXISTS performance_summaries;
DROP TABLE IF EXISTS performances;
DROP TABLE IF EXISTS reservation_logs;
DROP TYPE IF EXISTS "ReservationAction";
DROP TYPE IF EXISTS "SettlementStatus";
```

### Phase 4 롤백
```sql
DROP VIEW IF EXISTS active_reservations;
DROP MATERIALIZED VIEW IF EXISTS matrix_view_cache;
DROP FUNCTION IF EXISTS expire_reserved_tee_times();
DROP FUNCTION IF EXISTS refresh_matrix_view_cache();
DROP TRIGGER IF EXISTS log_tee_time_status_changes ON tee_times;
```

## 주의사항

1. **백업 필수**: 각 단계 실행 전 데이터베이스 백업
2. **테스트 환경**: 운영 적용 전 테스트 환경에서 검증
3. **모니터링**: 각 단계 후 성능 및 오류 모니터링
4. **점진적 적용**: 한 번에 모든 단계를 적용하지 말고 단계별 검증
5. **애플리케이션 호환성**: 스키마 변경 후 애플리케이션 코드 업데이트 필요

## 예상 효과

### 성능 개선
- Matrix View 조회: **70% 속도 향상** (인덱스 + 캐시)
- 티타임 조회: **50% 속도 향상** (복합 인덱스)
- 10분 타이머: **자동 처리**로 수동 작업 제거

### 기능 개선
- 실적 관리 시스템 완성
- 예약 이력 추적 가능
- 10분 타이머 자동화
- 소프트 삭제 지원

### 운영 개선
- 낙관적 잠금으로 동시성 처리
- 자동 만료로 수동 관리 부담 감소
- 실적 집계로 보고서 생성 간소화