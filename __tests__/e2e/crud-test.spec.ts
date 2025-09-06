import { test, expect, Page, Browser, chromium } from '@playwright/test'

// 테스트 설정
test.describe('Golf Course CRUD Operations', () => {
  let browser: Browser
  let page: Page

  test.beforeAll(async () => {
    // Stealth 모드로 브라우저 시작
    browser = await chromium.launch({
      headless: false, // UI 확인을 위해 브라우저 표시
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    })
    
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezone: 'Asia/Seoul',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    })
    
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await browser.close()
  })

  test('1. 로그인 테스트', async () => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3003/login')
    
    // 페이지 로드 확인
    await expect(page.locator('h1')).toContainText('골프장 예약 관리')
    
    // 빠른 로그인 버튼으로 최고관리자 로그인
    await page.click('button:has-text("최고관리자")')
    
    // 로그인 성공 확인
    await page.waitForURL('http://localhost:3003/')
    await expect(page.locator('h1')).toContainText('안녕하세요')
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/01-login-success.png' })
  })

  test('2. 티타임 목록 조회 (Read)', async () => {
    // 티타임 페이지로 이동
    await page.goto('http://localhost:3003/tee-times')
    
    // Matrix View 로드 확인
    await expect(page.locator('text=티타임 매트릭스')).toBeVisible()
    
    // 탭 전환 테스트
    await page.click('text=데일리조인')
    await page.waitForTimeout(500)
    
    await page.click('text=패키지부킹')
    await page.waitForTimeout(500)
    
    await page.click('text=패키지조인')
    await page.waitForTimeout(500)
    
    // 다시 데일리부킹으로
    await page.click('text=데일리부킹')
    
    // 오늘 버튼 클릭
    await page.click('button:has-text("오늘")')
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/02-tee-times-list.png', fullPage: true })
  })

  test('3. 새 티타임 등록 (Create)', async () => {
    // 티타임 등록 페이지로 이동
    await page.goto('http://localhost:3003/tee-times/new')
    
    // 폼 필드 입력
    await page.selectOption('select[name="golfCourseId"]', { index: 1 }) // 첫 번째 골프장 선택
    await page.fill('input[name="date"]', '2025-01-10')
    await page.fill('input[name="time"]', '08:00')
    await page.fill('input[name="greenFee"]', '15')
    await page.fill('input[name="players"]', '4')
    await page.fill('textarea[name="requirements"]', '테스트 예약입니다')
    await page.selectOption('select[name="holes"]', '18홀')
    await page.selectOption('select[name="caddie"]', '포함')
    await page.fill('input[name="advancePayment"]', '5')
    await page.check('input[name="mealIncluded"]')
    await page.check('input[name="cartIncluded"]')
    
    // 등록 버튼 클릭
    await page.click('button:has-text("티타임 등록")')
    
    // 등록 성공 확인
    await page.waitForURL('**/tee-times')
    await expect(page.locator('text=티타임이 성공적으로 등록되었습니다')).toBeVisible({ timeout: 10000 })
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/03-tee-time-created.png' })
  })

  test('4. 골프장 관리 페이지 테스트', async () => {
    // 골프장 관리 페이지로 이동
    await page.goto('http://localhost:3003/golf-courses')
    
    // 페이지 로드 확인
    await expect(page.locator('h1')).toContainText('골프장 관리')
    
    // 골프장 목록 확인
    const golfCourseRows = page.locator('table tbody tr')
    const rowCount = await golfCourseRows.count()
    expect(rowCount).toBeGreaterThan(0)
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/04-golf-courses-list.png', fullPage: true })
  })

  test('5. 새 골프장 등록 (Create)', async () => {
    // 골프장 등록 페이지로 이동
    await page.goto('http://localhost:3003/golf-courses/new')
    
    // 폼 필드 입력
    await page.selectOption('select[name="region"]', '제주')
    await page.fill('input[name="name"]', '테스트 골프장')
    await page.fill('input[name="address"]', '제주도 서귀포시 테스트로 123')
    await page.fill('input[name="phone"]', '064-123-4567')
    await page.selectOption('select[name="status"]', 'MANUAL')
    await page.fill('textarea[name="notes"]', 'E2E 테스트용 골프장입니다')
    
    // 등록 버튼 클릭
    await page.click('button:has-text("골프장 등록")')
    
    // 등록 성공 확인
    await page.waitForURL('**/golf-courses')
    await expect(page.locator('text=골프장이 성공적으로 등록되었습니다')).toBeVisible({ timeout: 10000 })
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/05-golf-course-created.png' })
  })

  test('6. 골프장 정보 수정 (Update)', async () => {
    await page.goto('http://localhost:3003/golf-courses')
    
    // 테스트 골프장 찾기
    const testGolfCourse = page.locator('tr:has-text("테스트 골프장")')
    
    // 수정 버튼 클릭
    await testGolfCourse.locator('button:has-text("수정")').click()
    
    // 수정 페이지에서 정보 변경
    await page.fill('input[name="name"]', '테스트 골프장 (수정됨)')
    await page.fill('textarea[name="notes"]', 'E2E 테스트로 수정된 골프장입니다')
    
    // 저장 버튼 클릭
    await page.click('button:has-text("변경사항 저장")')
    
    // 수정 성공 확인
    await page.waitForURL('**/golf-courses')
    await expect(page.locator('text=골프장 정보가 수정되었습니다')).toBeVisible({ timeout: 10000 })
    
    // 수정된 내용 확인
    await expect(page.locator('text=테스트 골프장 (수정됨)')).toBeVisible()
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/06-golf-course-updated.png' })
  })

  test('7. 골프장 삭제 (Delete)', async () => {
    await page.goto('http://localhost:3003/golf-courses')
    
    // 테스트 골프장 찾기
    const testGolfCourse = page.locator('tr:has-text("테스트 골프장 (수정됨)")')
    
    // 삭제 버튼 클릭
    await testGolfCourse.locator('button:has-text("삭제")').click()
    
    // 확인 다이얼로그 처리
    page.on('dialog', async dialog => {
      await dialog.accept()
    })
    
    // 삭제 성공 확인
    await expect(page.locator('text=골프장이 삭제되었습니다')).toBeVisible({ timeout: 10000 })
    
    // 삭제된 골프장이 목록에 없는지 확인
    await expect(page.locator('text=테스트 골프장 (수정됨)')).not.toBeVisible()
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/07-golf-course-deleted.png' })
  })

  test('8. 회원 관리 테스트', async () => {
    // 회원 관리 페이지로 이동
    await page.goto('http://localhost:3003/members')
    
    // 페이지 로드 확인
    await expect(page.locator('h1')).toContainText('회원 관리')
    
    // 회원 목록 확인
    const memberRows = page.locator('table tbody tr')
    const rowCount = await memberRows.count()
    expect(rowCount).toBeGreaterThan(0)
    
    // 권한 필터링 테스트
    await page.selectOption('select[name="accountType"]', 'TEAM_LEADER')
    await page.waitForTimeout(500)
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/08-members-list.png', fullPage: true })
  })

  test('9. 실적 관리 페이지 테스트', async () => {
    // 실적 관리 페이지로 이동
    await page.goto('http://localhost:3003/performance')
    
    // 페이지 로드 확인
    await expect(page.locator('h1')).toContainText('실적 관리')
    
    // 완료된 티타임 목록 확인
    const performanceRows = page.locator('table tbody tr')
    const rowCount = await performanceRows.count()
    
    // 실적 등록 버튼 확인
    if (rowCount > 0) {
      await expect(page.locator('button:has-text("실적 등록")').first()).toBeVisible()
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'artifacts/test-results/09-performance-list.png', fullPage: true })
  })

  test('10. 반응형 디자인 테스트', async () => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 메인 페이지
    await page.goto('http://localhost:3003/')
    await page.screenshot({ path: 'artifacts/test-results/10-mobile-home.png' })
    
    // 티타임 페이지
    await page.goto('http://localhost:3003/tee-times')
    await page.screenshot({ path: 'artifacts/test-results/10-mobile-teetimes.png' })
    
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // 티타임 페이지
    await page.goto('http://localhost:3003/tee-times')
    await page.screenshot({ path: 'artifacts/test-results/10-tablet-teetimes.png' })
    
    // 데스크톱으로 복원
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('11. 최종 시스템 검증', async () => {
    // 메인 대시보드
    await page.goto('http://localhost:3003/')
    
    // 시스템 상태 확인
    await expect(page.locator('text=시스템이 정상적으로 운영 중입니다')).toBeVisible()
    await expect(page.locator('text=데이터베이스 연결 상태: 양호')).toBeVisible()
    
    // 최종 전체 스크린샷
    await page.screenshot({ path: 'artifacts/test-results/11-final-dashboard.png', fullPage: true })
    
    console.log('✅ 모든 CRUD 테스트가 성공적으로 완료되었습니다!')
  })
})