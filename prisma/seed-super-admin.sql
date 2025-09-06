-- SUPER_ADMIN 계정 생성을 위한 SQL
-- bcrypt 해시: admin1234 -> $2a$10$tEfKa0uVh9wEtT7Wy1VcZeKqNrUxJZlqCx7JKhqFSXE8V5Io.5YqW

INSERT INTO "User" (
    "id",
    "phone",
    "password",
    "name",
    "accountType",
    "status",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    '01034424668',
    '$2a$10$tEfKa0uVh9wEtT7Wy1VcZeKqNrUxJZlqCx7JKhqFSXE8V5Io.5YqW',
    '최고관리자',
    'SUPER_ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT ("phone") 
DO UPDATE SET
    "name" = EXCLUDED."name",
    "password" = EXCLUDED."password",
    "accountType" = EXCLUDED."accountType",
    "status" = EXCLUDED."status",
    "updatedAt" = NOW();