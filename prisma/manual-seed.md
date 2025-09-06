# Prisma Studio를 통한 수동 시드 데이터 생성 가이드

## 문제 상황
Prisma Client가 Prisma Postgres 로컬 서버와의 HTTP 통신에서 타임아웃이 발생하고 있습니다.
이는 로컬 Prisma Postgres 서버의 문제로 보입니다.

## 해결 방법

### 방법 1: Prisma Studio를 통한 수동 입력

1. Prisma Studio 접속 (이미 실행 중: http://localhost:5555)

2. User 테이블에서 "Add record" 클릭

3. 다음 정보를 입력:
   - phone: `01034424668`
   - password: `$2b$10$89HhrwwhAQ8pyvpqYTAVtunX6l2m//xFZj4YWsL82bLtwbns2FuA6`
   - name: `최고관리자`
   - accountType: `SUPER_ADMIN`
   - status: `ACTIVE`
   - 나머지 필드는 비워두거나 기본값 사용

4. Save 클릭

### 방법 2: 직접 PostgreSQL 연결 사용

현재 DATABASE_URL이 Prisma Postgres 프록시를 사용하고 있습니다.
실제 PostgreSQL 서버는 localhost:51214에서 실행 중입니다.

1. .env 파일 수정 (임시):
```env
# 기존 (Prisma Postgres 프록시)
# DATABASE_URL="prisma+postgres://localhost:51213/..."

# 직접 연결 (임시)
DATABASE_URL="postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable"
```

2. 시드 스크립트 재실행:
```bash
npx tsx prisma/seed-minimal.ts
```

3. 완료 후 원래 DATABASE_URL로 복원

### 방법 3: Prisma Postgres 서버 재시작

1. 현재 Prisma Postgres 프로세스 종료:
```bash
# Windows
taskkill /F /IM "prisma.exe"
```

2. Prisma Studio 재시작:
```bash
npx prisma studio
```

## 테스트 계정 정보

생성할 SUPER_ADMIN 계정:
- 전화번호: `01034424668`
- 비밀번호: `admin1234`
- 이름: `최고관리자`
- 권한: `SUPER_ADMIN`
- 상태: `ACTIVE`

## 비밀번호 해시값
```
admin1234 → $2b$10$89HhrwwhAQ8pyvpqYTAVtunX6l2m//xFZj4YWsL82bLtwbns2FuA6
```

이 해시값은 bcryptjs를 사용하여 rounds 10으로 생성되었습니다.
필요시 `node prisma/generate-hash.js`를 실행하여 새로운 해시를 생성할 수 있습니다.

## 검증

계정 생성 후 다음을 확인:
1. Prisma Studio에서 User 테이블에 데이터가 표시되는지 확인
2. 애플리케이션에서 로그인 테스트 (01034424668 / admin1234)