import { test, expect, Page } from '@playwright/test'

// 테스트 계정 정보
const TEST_ACCOUNTS = {
  INTERNAL_MANAGER: { phone: '01011111111', password: 'admin' },
  TEAM_LEADER: { phone: '01000000001', password: 'admin' },
  MEMBER: { phone: '01055555555', password: 'admin' },
  ADMIN: { phone: '01000000000', password: 'admin' },
}

// 로그인 헬퍼 함수
async function login(page: Page, phone: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="phone"]', phone)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

// 로그아웃 헬퍼 함수
async function logout(page: Page) {
  await page.click('button[aria-label="사용자 메뉴"]')
  await page.click('text=로그아웃')
  await page.waitForURL('/login')
}

test.describe('예약 전체 플로우 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 환경 설정
    await page.goto('/')
  })

  test('매니저의 티타임 등록부터 완료까지 전체 플로우', async ({ page }) => {
    // 1. 매니저로 로그인
    await login(page, TEST_ACCOUNTS.INTERNAL_MANAGER.phone, TEST_ACCOUNTS.INTERNAL_MANAGER.password)
    
    // 2. 티타임 등록 페이지로 이동
    await page.click('text=티타임등록')
    await expect(page).toHaveURL('/tee-times/new')
    
    // 3. 티타임 정보 입력
    await page.selectOption('select[name="golfCourseId"]', { label: '제주테스트CC' })
    
    // 날짜 선택 (내일)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.fill('input[name="date"]', dateString)
    
    // 시간 입력
    await page.fill('input[name="time"]', '08:00')
    
    // 그린피 입력
    await page.fill('input[name="greenFee"]', '12.5')
    
    // 인원 선택
    await page.selectOption('select[name="players"]', '4')
    
    // 요청사항 입력
    await page.fill('textarea[name="requirements"]', 'E2E 테스트 티타임')
    
    // 홀 선택
    await page.selectOption('select[name="holes"]', '18홀')
    
    // 캐디 포함 여부
    await page.selectOption('select[name="caddy"]', '포함')
    
    // 선입금 입력
    await page.fill('input[name="prepayment"]', '6.0')
    
    // 식사 포함 체크
    await page.check('input[name="mealIncluded"]')
    
    // 카트비 포함 체크
    await page.check('input[name="cartIncluded"]')
    
    // 4. 티타임 등록
    await page.click('button[type="submit"]')
    
    // 등록 성공 메시지 확인
    await expect(page.locator('.toast-success')).toContainText('티타임이 등록되었습니다')
    
    // 5. 티타임 목록으로 이동
    await page.goto('/tee-times')
    
    // 등록한 티타임 확인 (1부로 자동 분류)
    await expect(page.locator('text=08:00')).toBeVisible()
    await expect(page.locator('text=1부')).toBeVisible()
    await expect(page.locator('text=부킹')).toBeVisible() // 4명이므로 부킹
    
    // 6. 티타임 예약
    const teeTimeRow = page.locator('tr', { hasText: '08:00' })
    await teeTimeRow.locator('button:has-text("예약하기")').click()
    
    // 예약 확인 다이얼로그
    await expect(page.locator('.dialog-title')).toContainText('예약 확인')
    await page.click('button:has-text("예약")')
    
    // 예약 성공 및 타이머 표시 확인
    await expect(page.locator('.toast-success')).toContainText('예약되었습니다')
    await expect(page.locator('[data-testid="reservation-timer"]')).toBeVisible()
    await expect(page.locator('[data-testid="reservation-timer"]')).toContainText('10:00')
    
    // 7. 예약 확정
    await teeTimeRow.locator('button:has-text("예약확정")').click()
    
    // 확정 확인 다이얼로그
    await expect(page.locator('.dialog-title')).toContainText('예약 확정')
    await page.click('button:has-text("확정")')
    
    // 확정 성공 메시지
    await expect(page.locator('.toast-success')).toContainText('예약이 확정되었습니다')
    
    // 상태 변경 확인
    await expect(teeTimeRow.locator('.status-badge')).toContainText('CONFIRMED')
    
    // 8. 로그아웃
    await logout(page)
  })

  test('10분 타이머 만료 시 자동 취소', async ({ page }) => {
    // 매니저로 로그인
    await login(page, TEST_ACCOUNTS.INTERNAL_MANAGER.phone, TEST_ACCOUNTS.INTERNAL_MANAGER.password)
    
    // 티타임 목록 페이지
    await page.goto('/tee-times')
    
    // 예약 가능한 티타임 선택
    const availableTeeTime = page.locator('tr', { has: page.locator('.status-badge:has-text("AVAILABLE")') }).first()
    await availableTeeTime.locator('button:has-text("예약하기")').click()
    
    // 예약 확인
    await page.click('button:has-text("예약")')
    
    // 타이머 시작 확인
    const timer = page.locator('[data-testid="reservation-timer"]')
    await expect(timer).toBeVisible()
    
    // 시간을 10분 뒤로 조작 (테스트 환경에서만)
    await page.evaluate(() => {
      const now = Date.now()
      Date.now = () => now + 11 * 60 * 1000 // 11분 후
    })
    
    // 페이지 새로고침
    await page.reload()
    
    // 티타임이 다시 AVAILABLE 상태로 돌아갔는지 확인
    await expect(availableTeeTime.locator('.status-badge')).toContainText('AVAILABLE')
    
    // 만료 메시지 확인
    await expect(page.locator('.toast-warning')).toContainText('예약 시간이 만료되었습니다')
  })

  test('팀장의 팀원 예약 승인 플로우', async ({ page, context }) => {
    // 새 탭에서 팀원으로 로그인
    const memberPage = await context.newPage()
    await memberPage.goto('/')
    await login(memberPage, TEST_ACCOUNTS.MEMBER.phone, TEST_ACCOUNTS.MEMBER.password)
    
    // 티타임 목록으로 이동
    await memberPage.goto('/tee-times')
    
    // 티타임 예약 시도 (MEMBER는 예약 불가)
    const teeTimeRow = memberPage.locator('tr', { has: memberPage.locator('.status-badge:has-text("AVAILABLE")') }).first()
    await expect(teeTimeRow.locator('button:has-text("예약하기")')).toBeDisabled()
    
    // 팀장에게 예약 요청 (가정: 요청 기능이 있다면)
    // 여기서는 팀장이 직접 예약하는 시나리오로 진행
    
    // 팀장으로 로그인
    await login(page, TEST_ACCOUNTS.TEAM_LEADER.phone, TEST_ACCOUNTS.TEAM_LEADER.password)
    
    // 티타임 목록으로 이동
    await page.goto('/tee-times')
    
    // 티타임 예약 (팀원을 위해)
    const availableTeeTime = page.locator('tr', { has: page.locator('.status-badge:has-text("AVAILABLE")') }).first()
    await availableTeeTime.locator('button:has-text("예약하기")').click()
    
    // 팀원 선택 옵션이 있다면
    if (await page.locator('select[name="reserveFor"]').isVisible()) {
      await page.selectOption('select[name="reserveFor"]', { label: '일반회원' })
    }
    
    await page.click('button:has-text("예약")')
    
    // 예약 성공
    await expect(page.locator('.toast-success')).toContainText('예약되었습니다')
    
    // 팀장이 예약 확정
    await availableTeeTime.locator('button:has-text("예약확정")').click()
    await page.click('button:has-text("확정")')
    
    // 확정 성공
    await expect(page.locator('.toast-success')).toContainText('팀원 예약이 확정되었습니다')
    
    // 팀원 페이지에서 확인
    await memberPage.reload()
    await expect(memberPage.locator('.my-reservations')).toContainText('확정된 예약')
  })

  test('권한별 접근 제한 테스트', async ({ page }) => {
    // MEMBER로 로그인
    await login(page, TEST_ACCOUNTS.MEMBER.phone, TEST_ACCOUNTS.MEMBER.password)
    
    // 티타임 등록 페이지 접근 시도
    await page.goto('/tee-times/new')
    await expect(page).toHaveURL('/unauthorized')
    await expect(page.locator('h1')).toContainText('접근 권한이 없습니다')
    
    // 회원 관리 페이지 접근 시도
    await page.goto('/members')
    await expect(page).toHaveURL('/unauthorized')
    
    // 실적 등록 페이지 접근 시도
    await page.goto('/performance')
    await expect(page).toHaveURL('/unauthorized')
    
    // 로그아웃
    await logout(page)
    
    // ADMIN으로 로그인
    await login(page, TEST_ACCOUNTS.ADMIN.phone, TEST_ACCOUNTS.ADMIN.password)
    
    // 모든 페이지 접근 가능 확인
    await page.goto('/tee-times/new')
    await expect(page).toHaveURL('/tee-times/new')
    
    await page.goto('/members')
    await expect(page).toHaveURL('/members')
    
    await page.goto('/performance')
    await expect(page).toHaveURL('/performance')
  })

  test('Matrix View 실시간 업데이트 테스트', async ({ page, context }) => {
    // 두 개의 브라우저 탭 열기
    const page1 = page
    const page2 = await context.newPage()
    
    // 둘 다 매니저로 로그인
    await login(page1, TEST_ACCOUNTS.INTERNAL_MANAGER.phone, TEST_ACCOUNTS.INTERNAL_MANAGER.password)
    await login(page2, TEST_ACCOUNTS.EXTERNAL_MANAGER.phone, TEST_ACCOUNTS.EXTERNAL_MANAGER.password)
    
    // 둘 다 Matrix View로 이동
    await page1.goto('/tee-times')
    await page2.goto('/tee-times')
    
    // 데일리부킹 탭 선택
    await page1.click('[role="tab"]:has-text("데일리부킹")')
    await page2.click('[role="tab"]:has-text("데일리부킹")')
    
    // page1에서 특정 셀 클릭 (제주 - 내일 - 1부)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateColumn = tomorrow.getDate().toString()
    
    const cell = page1.locator(`[data-region="제주"][data-date*="${dateColumn}"][data-slot="1부"]`)
    const initialCount = await cell.textContent() || '0'
    
    // 티타임 추가
    await cell.click()
    await page1.click('button:has-text("티타임 추가")')
    
    // 티타임 정보 입력 및 저장
    await page1.fill('input[name="time"]', '07:30')
    await page1.fill('input[name="greenFee"]', '11.0')
    await page1.selectOption('select[name="players"]', '4')
    await page1.fill('textarea[name="requirements"]', '실시간 업데이트 테스트')
    await page1.click('button:has-text("저장")')
    
    // page2에서 업데이트 확인 (실시간 또는 폴링)
    await page2.waitForTimeout(2000) // WebSocket이 없다면 폴링 대기
    
    const updatedCell = page2.locator(`[data-region="제주"][data-date*="${dateColumn}"][data-slot="1부"]`)
    const updatedCount = await updatedCell.textContent() || '0'
    
    // 카운트가 증가했는지 확인
    expect(parseInt(updatedCount)).toBeGreaterThan(parseInt(initialCount))
  })

  test('연결된 티타임 (패키지) 예약 플로우', async ({ page }) => {
    // 매니저로 로그인
    await login(page, TEST_ACCOUNTS.INTERNAL_MANAGER.phone, TEST_ACCOUNTS.INTERNAL_MANAGER.password)
    
    // 패키지부킹 탭으로 이동
    await page.goto('/tee-times')
    await page.click('[role="tab"]:has-text("패키지부킹")')
    
    // 패키지 티타임 생성
    await page.click('button:has-text("패키지 생성")')
    
    // 첫 번째 티타임 (Day 1)
    await page.selectOption('select[name="day1.golfCourseId"]', { label: '제주테스트CC' })
    await page.fill('input[name="day1.date"]', '2024-01-15')
    await page.fill('input[name="day1.time"]', '08:00')
    await page.fill('input[name="day1.greenFee"]', '15.0')
    
    // 두 번째 티타임 (Day 2)
    await page.selectOption('select[name="day2.golfCourseId"]', { label: '경기테스트GC' })
    await page.fill('input[name="day2.date"]', '2024-01-16')
    await page.fill('input[name="day2.time"]', '09:00')
    await page.fill('input[name="day2.greenFee"]', '14.0')
    
    // 숙박 정보
    await page.fill('textarea[name="accommodationInfo"]', '제주 테스트호텔 1박')
    
    // 패키지 생성
    await page.click('button:has-text("패키지 생성")')
    
    // 생성 성공 확인
    await expect(page.locator('.toast-success')).toContainText('패키지가 생성되었습니다')
    
    // 패키지 예약
    const packageRow = page.locator('tr', { hasText: '패키지' })
    await packageRow.locator('button:has-text("패키지 예약")').click()
    
    // 패키지 전체 확정
    await page.click('button:has-text("전체 확정")')
    
    // 개별 티타임 취소 테스트 (10분 이내)
    await packageRow.locator('button:has-text("Day 2 취소")').click()
    await page.click('button:has-text("확인")')
    
    // Day 2만 취소되고 Day 1은 유지되는지 확인
    await expect(page.locator('text=Day 1: CONFIRMED')).toBeVisible()
    await expect(page.locator('text=Day 2: AVAILABLE')).toBeVisible()
  })
})