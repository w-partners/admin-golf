-- Phase 3: 실적 관리 시스템 구축
-- 새로운 테이블 생성 (기존 데이터 영향 없음)

-- 1. ReservationAction enum 생성
CREATE TYPE "ReservationAction" AS ENUM (
    'RESERVE',
    'CONFIRM',
    'CANCEL',
    'EXPIRE',
    'COMPLETE',
    'UPDATE'
);

-- 2. SettlementStatus enum 생성
CREATE TYPE "SettlementStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

-- 3. 예약 이력 테이블 (10분 타이머 추적)
CREATE TABLE IF NOT EXISTS "reservation_logs" (
    "id" SERIAL PRIMARY KEY,
    "teeTimeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "ReservationAction" NOT NULL,
    "previousStatus" "TeeTimeStatus",
    "newStatus" "TeeTimeStatus",
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_reservation_logs_tee_time"
        FOREIGN KEY ("teeTimeId") 
        REFERENCES "tee_times"("id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "fk_reservation_logs_user"
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE
);

-- 4. 실적 테이블
CREATE TABLE IF NOT EXISTS "performances" (
    "id" SERIAL PRIMARY KEY,
    "teeTimeId" INTEGER NOT NULL UNIQUE,
    "actualPlayers" INTEGER NOT NULL,
    "actualFee" DECIMAL(10, 2) NOT NULL,
    "revenue" DECIMAL(10, 2) NOT NULL,
    "profit" DECIMAL(10, 2) NOT NULL,
    "registeredById" INTEGER NOT NULL,
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_performances_tee_time"
        FOREIGN KEY ("teeTimeId") 
        REFERENCES "tee_times"("id") 
        ON DELETE RESTRICT,
    
    CONSTRAINT "fk_performances_registered_by"
        FOREIGN KEY ("registeredById") 
        REFERENCES "users"("id") 
        ON DELETE RESTRICT
);

-- 5. 실적 집계 테이블
CREATE TABLE IF NOT EXISTS "performance_summaries" (
    "id" SERIAL PRIMARY KEY,
    "period" VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    "userId" INTEGER,
    "teamId" INTEGER,
    "golfCourseId" INTEGER,
    "region" "Region",
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "totalProfit" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "avgPlayers" DECIMAL(5, 2) NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_performance_summaries_user"
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "fk_performance_summaries_team"
        FOREIGN KEY ("teamId") 
        REFERENCES "teams"("id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "fk_performance_summaries_golf_course"
        FOREIGN KEY ("golfCourseId") 
        REFERENCES "golf_courses"("id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "uq_performance_summaries_period_dimensions"
        UNIQUE ("period", "userId", "teamId", "golfCourseId", "region")
);

-- 6. 인덱스 생성
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_reservation_logs_tee_time" 
ON "reservation_logs" ("teeTimeId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_reservation_logs_user" 
ON "reservation_logs" ("userId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_performances_settlement" 
ON "performances" ("settlementStatus", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_performances_registered_by" 
ON "performances" ("registeredById", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_performance_summaries_period_user" 
ON "performance_summaries" ("period", "userId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_performance_summaries_period_team" 
ON "performance_summaries" ("period", "teamId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_performance_summaries_period_region" 
ON "performance_summaries" ("period", "region");

-- 7. 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_performances_updated_at ON "performances";
CREATE TRIGGER update_performances_updated_at
BEFORE UPDATE ON "performances"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();