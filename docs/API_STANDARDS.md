# API 표준 문서

## 목차
1. [API 설계 원칙](#api-설계-원칙)
2. [URL 구조 및 명명 규칙](#url-구조-및-명명-규칙)
3. [HTTP 메서드 사용](#http-메서드-사용)
4. [요청/응답 형식](#요청응답-형식)
5. [에러 처리 표준](#에러-처리-표준)
6. [페이지네이션](#페이지네이션)
7. [인증 및 권한](#인증-및-권한)
8. [비즈니스 로직](#비즈니스-로직)

## API 설계 원칙

### RESTful 설계
- 리소스 중심의 URL 설계
- HTTP 메서드를 통한 액션 표현
- 상태를 포함하지 않는 stateless 설계
- 일관된 명명 규칙 사용

### 버전 관리
- 현재 버전: v1.0.0
- 향후 버전 관리 시 URL path에 버전 포함 예정 (예: `/api/v2/`)

## URL 구조 및 명명 규칙

### 기본 구조
```
{base_url}/api/{resource}/{id?}/{action?}
```

### 명명 규칙
- 복수형 명사 사용: `/users`, `/tee-times`, `/golf-courses`
- kebab-case 사용: `/tee-times`, `/golf-courses`
- 액션은 동사형으로 표현: `/reserve`, `/confirm`, `/cancel`

### URL 예시
```
GET    /api/tee-times           # 티타임 목록 조회
POST   /api/tee-times           # 티타임 생성
GET    /api/tee-times/{id}      # 특정 티타임 조회
PUT    /api/tee-times/{id}      # 티타임 수정
DELETE /api/tee-times/{id}      # 티타임 삭제
POST   /api/tee-times/reserve   # 티타임 예약 (액션)
POST   /api/tee-times/confirm   # 티타임 확정 (액션)
```

## HTTP 메서드 사용

| 메서드 | 용도 | 멱등성 | 안전성 |
|--------|------|--------|--------|
| GET | 리소스 조회 | ✅ | ✅ |
| POST | 리소스 생성, 액션 실행 | ❌ | ❌ |
| PUT | 리소스 전체 수정 | ✅ | ❌ |
| PATCH | 리소스 부분 수정 | ❌ | ❌ |
| DELETE | 리소스 삭제 | ✅ | ❌ |

## 요청/응답 형식

### Content-Type
- 요청: `application/json`
- 응답: `application/json`

### 날짜/시간 형식
- 날짜: `YYYY-MM-DD` (예: `2024-01-01`)
- 시간: `HH:MM` (예: `14:30`)
- 날짜시간: ISO 8601 형식 (예: `2024-01-01T14:30:00.000Z`)

### 성공 응답 구조
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 목록 응답 구조
```json
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 에러 처리 표준

### 에러 응답 형식
```json
{
  "code": "ERROR_CODE",
  "message": "사용자 친화적 에러 메시지",
  "details": {
    "field": "추가 정보"
  }
}
```

### 검증 에러 형식
```json
{
  "code": "VALIDATION_ERROR",
  "message": "입력값이 올바르지 않습니다",
  "errors": [
    {
      "field": "phoneNumber",
      "message": "연락처는 010으로 시작하는 11자리 숫자여야 합니다",
      "code": "invalid_format"
    }
  ]
}
```

### 표준 에러 코드

| HTTP 상태 코드 | 에러 코드 | 설명 |
|---------------|-----------|------|
| 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| 400 | BAD_REQUEST | 잘못된 요청 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 403 | FORBIDDEN | 권한 부족 |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | CONFLICT | 리소스 충돌 (중복, 상태 충돌 등) |
| 409 | INVALID_STATUS | 잘못된 상태 전환 |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류 |

## 페이지네이션

### Query Parameters
- `page`: 페이지 번호 (1부터 시작, 기본값: 1)
- `limit`: 페이지당 항목 수 (1-100, 기본값: 20)
- `sort`: 정렬 기준 (형식: `field:asc` 또는 `field:desc`)

### 요청 예시
```
GET /api/tee-times?page=2&limit=50&sort=date:desc
```

### 응답 예시
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

## 인증 및 권한

### 인증 방식
- Bearer Token (JWT)
- 헤더: `Authorization: Bearer {token}`

### 권한 레벨
1. **SUPER_ADMIN**: 모든 기능 접근 (시스템 관리)
2. **ADMIN**: 모든 기능 접근
3. **TEAM_LEADER**: 팀 관리 + 팀원 예약 확정
4. **INTERNAL_MANAGER**: 티타임 등록/수정, 실적 등록
5. **EXTERNAL_MANAGER**: 매니저와 동일 권한
6. **PARTNER**: 매니저와 동일 권한
7. **GOLF_COURSE**: 자신의 골프장 티타임만 조회/수정
8. **MEMBER**: 티타임 조회만

### 권한 체크 규칙
- 매니저 이상: INTERNAL_MANAGER, EXTERNAL_MANAGER, PARTNER, TEAM_LEADER, ADMIN, SUPER_ADMIN
- 관리자 이상: ADMIN, SUPER_ADMIN
- 팀장: TEAM_LEADER (팀원 예약 확정 권한)

## 비즈니스 로직

### 10분 예약 타이머
```
예약(RESERVED) → 10분 이내 확정(CONFIRMED) 또는 자동 취소(AVAILABLE)
```

**타이머 상태 응답**:
```json
{
  "teeTimeId": "uuid",
  "status": "RESERVED",
  "reservedAt": "2024-01-01T10:00:00.000Z",
  "expiresAt": "2024-01-01T10:10:00.000Z",
  "remainingSeconds": 300,
  "isExpired": false
}
```

### 시간대 자동 분류
- **1부**: 10시 이전
- **2부**: 10시 ~ 15시
- **3부**: 15시 이후

### 예약 유형 자동 결정
- **부킹(BOOKING)**: 4명
- **조인(JOIN)**: 4명 미만

### 지역 자동 입력
골프장 선택 시 해당 지역이 자동으로 설정됨

### Matrix View 데이터 구조
```json
{
  "matrixData": [
    {
      "region": "제주",
      "golfCourses": [
        {
          "id": "uuid",
          "name": "골프장명",
          "dates": [
            {
              "date": "2024-01-01",
              "timeSlot1": 3,  // 1부 티타임 수
              "timeSlot2": 5,  // 2부 티타임 수
              "timeSlot3": 2,  // 3부 티타임 수
              "total": 10
            }
          ]
        }
      ]
    }
  ],
  "dateColumns": [
    {
      "date": "2024-01-01",
      "displayDate": "1/1",
      "dayOfWeek": "월",
      "isToday": true,
      "isWeekend": false
    }
  ],
  "summary": {
    "totalGolfCourses": 50,
    "totalTeeTimes": 500,
    "teeTimeType": "DAILY",
    "bookingType": "BOOKING",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-03-31"
    }
  }
}
```

### 실적 관리
- 완료된 티타임만 실적 등록 가능
- 실제 인원수와 실제 그린피 기록
- 수익 = 실제 인원수 × 실제 그린피

### 팀 시스템
- 팀장이 팀원의 예약 확정 가능
- 팀별 실적 집계 지원

## API 클라이언트 사용 예시

### TypeScript 클라이언트
```typescript
import { api } from '@/lib/api/client'

// 로그인
const loginResponse = await api.auth.login({
  phoneNumber: '01012345678',
  password: 'password123'
})

// 티타임 예약
const reservation = await api.teeTimes.reserve({
  teeTimeId: 'uuid-123'
})

// 타이머 상태 확인
const timerStatus = await api.teeTimes.getTimerStatus('uuid-123')

// Matrix View 데이터 조회
const matrixData = await api.teeTimes.getMatrix({
  type: 'DAILY',
  booking: 'BOOKING',
  startDate: '2024-01-01',
  days: 90
})

// 실적 등록
const performance = await api.performance.complete({
  teeTimeId: 'uuid-123',
  actualPlayerCount: 4,
  actualGreenFee: 15.5,
  notes: '완료'
})
```

### 에러 처리
```typescript
try {
  const result = await api.teeTimes.reserve({ teeTimeId })
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // 로그인 페이지로 이동
        break
      case 'CONFLICT':
        // 이미 예약된 티타임
        break
      case 'VALIDATION_ERROR':
        // 입력값 검증 실패
        console.error(error.details)
        break
      default:
        // 기타 에러
        console.error(error.message)
    }
  }
}
```

## 테스트

### Contract Test 실행
```bash
npm test tests/api/contract.test.ts
```

### API 문서 검증
```bash
npx swagger-cli validate api/openapi.yaml
```

### TypeScript 타입 생성
```bash
npx openapi-typescript api/openapi.yaml -o lib/api/types.ts
```

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2024-01-XX | 초기 API 설계 및 문서화 |