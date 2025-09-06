-- Phase 1: 필수 필드 추가 (데이터 보존 보장)
-- 10분 타이머 및 기본 기능을 위한 필수 필드

-- 1. TeeTime 테이블 필수 필드 추가
ALTER TABLE "tee_times" 
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- 2. GolfCourse 테이블 필수 필드 추가
ALTER TABLE "golf_courses"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- 3. 기존 데이터 보정 (안전한 기본값 설정)
UPDATE "golf_courses" 
SET "isActive" = true 
WHERE "isActive" IS NULL;

UPDATE "golf_courses" 
SET "createdAt" = CURRENT_TIMESTAMP 
WHERE "createdAt" IS NULL;

UPDATE "golf_courses" 
SET "updatedAt" = CURRENT_TIMESTAMP 
WHERE "updatedAt" IS NULL;

-- 4. TeeTimeStatus enum에 EXPIRED 추가
-- PostgreSQL에서 enum 값 추가는 ALTER TYPE 사용
ALTER TYPE "TeeTimeStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- 5. 자동 expiresAt 설정을 위한 트리거 생성
CREATE OR REPLACE FUNCTION update_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."status" = 'RESERVED' AND NEW."reservedAt" IS NOT NULL THEN
        NEW."expiresAt" = NEW."reservedAt" + INTERVAL '10 minutes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_expires_at ON "tee_times";
CREATE TRIGGER set_expires_at
BEFORE INSERT OR UPDATE ON "tee_times"
FOR EACH ROW
EXECUTE FUNCTION update_expires_at();

-- 6. updatedAt 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_golf_courses_updated_at ON "golf_courses";
CREATE TRIGGER update_golf_courses_updated_at
BEFORE UPDATE ON "golf_courses"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();