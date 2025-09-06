-- Phase 4: 10분 타이머 자동 만료 시스템
-- 백그라운드 작업자 없이 DB 레벨에서 자동 처리

-- 1. 만료 처리 함수
CREATE OR REPLACE FUNCTION expire_reserved_tee_times()
RETURNS void AS $$
BEGIN
    -- RESERVED 상태인데 10분이 지난 티타임을 EXPIRED로 변경
    UPDATE "tee_times"
    SET 
        "status" = 'EXPIRED',
        "expiresAt" = NULL,
        "managerId" = NULL,
        "booker" = NULL
    WHERE 
        "status" = 'RESERVED' 
        AND "expiresAt" IS NOT NULL
        AND "expiresAt" < CURRENT_TIMESTAMP;
        
    -- 예약 로그 기록 (reservation_logs 테이블이 있는 경우)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_logs') THEN
        INSERT INTO "reservation_logs" ("teeTimeId", "userId", "action", "previousStatus", "newStatus", "details", "createdAt")
        SELECT 
            t."id",
            COALESCE(t."managerId", 1), -- 시스템 사용자 ID를 1로 가정
            'EXPIRE'::"ReservationAction",
            'RESERVED'::"TeeTimeStatus",
            'EXPIRED'::"TeeTimeStatus",
            '{"reason": "10분 타이머 만료", "expiredAt": "' || CURRENT_TIMESTAMP || '"}'::jsonb,
            CURRENT_TIMESTAMP
        FROM "tee_times" t
        WHERE 
            t."status" = 'EXPIRED'
            AND t."updatedAt" >= CURRENT_TIMESTAMP - INTERVAL '1 second';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 자동 만료 처리 뷰 (실시간 상태 확인용)
CREATE OR REPLACE VIEW "active_reservations" AS
SELECT 
    t.*,
    CASE 
        WHEN t."status" = 'RESERVED' AND t."expiresAt" < CURRENT_TIMESTAMP THEN 'EXPIRED'
        ELSE t."status"
    END as "effective_status",
    CASE 
        WHEN t."status" = 'RESERVED' AND t."expiresAt" IS NOT NULL THEN
            GREATEST(0, EXTRACT(EPOCH FROM (t."expiresAt" - CURRENT_TIMESTAMP))::INTEGER)
        ELSE NULL
    END as "seconds_remaining"
FROM "tee_times" t;

-- 3. Matrix View 최적화를 위한 Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS "matrix_view_cache" AS
SELECT 
    t."date",
    t."golfCourseId",
    gc."name" as "golfCourseName",
    gc."region",
    t."type",
    t."bookingType",
    t."timeSlot",
    COUNT(*) as "count",
    SUM(CASE WHEN t."status" = 'AVAILABLE' THEN 1 ELSE 0 END) as "available_count",
    SUM(CASE WHEN t."status" IN ('RESERVED', 'CONFIRMED') THEN 1 ELSE 0 END) as "reserved_count"
FROM "tee_times" t
INNER JOIN "golf_courses" gc ON t."golfCourseId" = gc."id"
WHERE 
    t."deletedAt" IS NULL
    AND t."date" >= CURRENT_DATE
    AND t."date" <= CURRENT_DATE + INTERVAL '90 days'
GROUP BY 
    t."date", 
    t."golfCourseId", 
    gc."name",
    gc."region",
    t."type", 
    t."bookingType", 
    t."timeSlot";

-- 4. Materialized View 인덱스
CREATE INDEX IF NOT EXISTS "idx_matrix_view_cache_lookup"
ON "matrix_view_cache" ("date", "region", "type", "bookingType");

-- 5. 자동 갱신 함수
CREATE OR REPLACE FUNCTION refresh_matrix_view_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY "matrix_view_cache";
END;
$$ LANGUAGE plpgsql;

-- 6. 예약 상태 변경 시 로그 자동 기록 트리거
CREATE OR REPLACE FUNCTION log_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservation_logs') 
       AND (OLD."status" IS DISTINCT FROM NEW."status") THEN
        INSERT INTO "reservation_logs" (
            "teeTimeId", 
            "userId", 
            "action", 
            "previousStatus", 
            "newStatus", 
            "details",
            "createdAt"
        ) VALUES (
            NEW."id",
            COALESCE(NEW."managerId", 1),
            CASE 
                WHEN NEW."status" = 'RESERVED' THEN 'RESERVE'
                WHEN NEW."status" = 'CONFIRMED' THEN 'CONFIRM'
                WHEN NEW."status" = 'CANCELLED' THEN 'CANCEL'
                WHEN NEW."status" = 'COMPLETED' THEN 'COMPLETE'
                WHEN NEW."status" = 'EXPIRED' THEN 'EXPIRE'
                ELSE 'UPDATE'
            END::"ReservationAction",
            OLD."status",
            NEW."status",
            jsonb_build_object(
                'managerId', NEW."managerId",
                'booker', NEW."booker",
                'timestamp', CURRENT_TIMESTAMP
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_tee_time_status_changes ON "tee_times";
CREATE TRIGGER log_tee_time_status_changes
AFTER UPDATE ON "tee_times"
FOR EACH ROW
EXECUTE FUNCTION log_reservation_status_change();

-- 7. 정기 정리 작업 (옵션)
-- pg_cron extension이 설치된 경우 사용 가능
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('expire-reservations', '*/1 * * * *', 'SELECT expire_reserved_tee_times();');
-- SELECT cron.schedule('refresh-matrix-cache', '*/5 * * * *', 'SELECT refresh_matrix_view_cache();');