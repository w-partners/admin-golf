-- Phase 2: 성능 최적화 인덱스 (Matrix View 최적화)
-- 데이터에 영향 없이 조회 성능만 개선

-- 1. Matrix View 핵심 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_matrix_view" 
ON "tee_times" ("date", "region", "timeSlot", "status") 
WHERE "deletedAt" IS NULL;

-- 2. 골프장별 티타임 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_golf_course_date" 
ON "tee_times" ("date", "golfCourseId", "status") 
WHERE "deletedAt" IS NULL;

-- 3. 10분 타이머 처리 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_timer_processing" 
ON "tee_times" ("status", "expiresAt") 
WHERE "status" = 'RESERVED';

-- 4. 매니저별 티타임 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_manager" 
ON "tee_times" ("managerId", "status", "date") 
WHERE "managerId" IS NOT NULL;

-- 5. 실적 미등록 티타임 조회
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_performance_pending" 
ON "tee_times" ("performanceReg", "date", "status") 
WHERE "performanceReg" = false AND "status" = 'COMPLETED';

-- 6. 타입별 조회 (데일리/패키지, 부킹/조인)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_type_booking" 
ON "tee_times" ("type", "bookingType", "date") 
WHERE "deletedAt" IS NULL;

-- 7. User 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_account_status" 
ON "users" ("accountType", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_team" 
ON "users" ("teamId") 
WHERE "teamId" IS NOT NULL;

-- 8. GolfCourse 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_golf_courses_region_active" 
ON "golf_courses" ("region", "operStatus", "isActive") 
WHERE "isActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_golf_courses_name" 
ON "golf_courses" ("name");

-- 9. Notice 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notices_active" 
ON "notices" ("isActive", "createdAt" DESC) 
WHERE "isActive" = true;

-- 10. 복합 인덱스 (날짜 범위 쿼리 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tee_times_date_range" 
ON "tee_times" ("date", "golfCourseId", "timeSlot", "type", "bookingType") 
WHERE "deletedAt" IS NULL AND "status" != 'CANCELLED';

-- 인덱스 통계 업데이트 (성능 최적화)
ANALYZE "tee_times";
ANALYZE "golf_courses";
ANALYZE "users";