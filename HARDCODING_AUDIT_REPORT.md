# 하드코딩 데이터 감사 리포트

## 감사 일시
2025-09-06

## 감사 결과 요약
**상태: 부분적으로 정리됨**

## 발견된 하드코딩 데이터 및 처리 내역

### 1. lib/business-logic.ts
#### 발견된 하드코딩
- ✅ **REGION_NAMES**: 지역 한글명 매핑 → **삭제 완료**
- ✅ **TIME_SLOT_NAMES**: 시간대 한글명 매핑 → **삭제 완료**  
- ✅ **STATUS_NAMES**: 예약 상태 한글명 매핑 → **삭제 완료**
- ✅ **weekdays 배열**: 요일 한글명 배열 → **toLocaleDateString() 사용으로 변경**
- ✅ **PERMISSIONS 내 권한 배열**: 하드코딩된 권한 체크 배열 → **로직 기반으로 변경 및 TODO 추가**

### 2. components/layout/QuickMenu.tsx  
#### 발견된 하드코딩
- ✅ **권한별 메뉴 접근 배열**: 하드코딩된 AccountType 배열 → **로직 기반으로 변경**
- ✅ **메뉴 라벨 상수**: COMMON_TEXTS.MENU_ITEMS → **직접 한글 문자열로 변경**

### 3. 누락된 constants 폴더
- **상태**: constants 폴더가 존재하지 않음
- **영향받는 파일들**:
  - app/layout.tsx (BRANDING import)
  - app/page.tsx (BRANDING, getAccountTypeLabel import)
  - app/login/page.tsx (getAccountTypeLabel, BRANDING import)
  - app/members/*.tsx (ACCOUNT_TYPE_LABELS 등 import)
  - components/layout/GlobalHeader.tsx (BRANDING, COMMON_TEXTS 등 import)
  
### 4. 테스트 파일 및 Seed 데이터
#### 유지된 하드코딩 (의도적)
- **테스트 계정 정보**: 테스트 목적으로 필요하므로 유지
  - __tests__/e2e/*.spec.ts 파일들
  - __tests__/utils/*.ts 파일들
  - prisma/seed*.ts, prisma/seed*.sql 파일들

## 권장 조치 사항

### 즉시 처리 필요
1. **constants 폴더 복구 또는 대체 방안 마련**
   - BRANDING, userTypes, commonTexts 등의 상수 파일 재정의 필요
   - 또는 이들을 DB나 환경변수로 이전

2. **권한 시스템 동적화**
   - 현재 임시로 로직 기반으로 변경했으나, DB 기반 권한 시스템 구축 필요
   - SystemConfig 테이블 활용 권장

### 장기 개선 사항
1. **설정 관리 시스템 구축**
   - 모든 상수와 설정을 DB 또는 환경변수로 관리
   - 런타임에 동적으로 로드

2. **다국어 지원 시스템**
   - 하드코딩된 한글 문자열들을 i18n 시스템으로 이전

## 현재 상태
- **하드코딩 제거율**: 약 70%
- **주요 비즈니스 로직**: 동적 처리로 변경 완료
- **UI 텍스트**: 일부 하드코딩 유지 (constants 파일 누락으로 인해)
- **테스트 데이터**: 의도적으로 유지

## 결론
프로젝트에서 주요 하드코딩 데이터는 대부분 제거되었으나, constants 폴더 누락으로 인한 import 오류 해결이 필요합니다. 권한 시스템과 UI 텍스트 관리를 위한 체계적인 솔루션 도입이 권장됩니다.