import { test, expect, Page, Browser, chromium } from '@playwright/test'

test.describe('UI 디자인 개선 검증', () => {
  let browser: Browser
  let page: Page

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    })
    
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezone: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 }
    })
    
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await browser.close()
  })

  test('1. 로그인 페이지 - 현대적 디자인 확인', async () => {
    await page.goto('http://localhost:3003/login')
    await page.waitForLoadState('networkidle')
    
    // 그라데이션 배경 확인
    const background = await page.locator('.bg-gradient-to-br').first()
    await expect(background).toBeVisible()
    
    // 로고 확인
    const logo = await page.locator('.bg-gradient-to-br.from-emerald-500')
    await expect(logo).toBeVisible()
    
    // 빠른 로그인 버튼들 확인
    await expect(page.locator('text=빠른 테스트 로그인')).toBeVisible()
    
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-01-login-modern.png',
      fullPage: true 
    })
  })

  test('2. 최고관리자로 로그인', async () => {
    await page.click('button:has-text("최고관리자")')
    await page.waitForURL('http://localhost:3003/')
    await page.waitForLoadState('networkidle')
    
    // 현대적인 환영 메시지 확인
    const welcomeCard = await page.locator('.bg-gradient-to-r.from-emerald-500')
    await expect(welcomeCard).toBeVisible()
    
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-02-dashboard-modern.png',
      fullPage: true 
    })
  })

  test('3. Matrix View - 개선된 디자인 확인', async () => {
    await page.goto('http://localhost:3003/tee-times')
    await page.waitForLoadState('networkidle')
    
    // Matrix 테이블 로드 대기
    await page.waitForTimeout(2000)
    
    // 그라데이션 헤더 확인
    const header = await page.locator('.bg-gradient-to-r.from-emerald-600')
    await expect(header).toBeVisible()
    
    // 오늘 버튼 스타일 확인
    const todayButton = await page.locator('button:has-text("오늘")').first()
    await expect(todayButton).toHaveClass(/bg-gradient-to-r/)
    
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-03-matrix-improved.png',
      fullPage: true 
    })
  })

  test('4. 각 탭별 Matrix View 확인', async () => {
    // 데일리조인
    await page.click('text=데일리조인')
    await page.waitForTimeout(1000)
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-04-daily-join.png',
      fullPage: true 
    })
    
    // 패키지부킹
    await page.click('text=패키지부킹')
    await page.waitForTimeout(1000)
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-04-package-booking.png',
      fullPage: true 
    })
    
    // 패키지조인
    await page.click('text=패키지조인')
    await page.waitForTimeout(1000)
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-04-package-join.png',
      fullPage: true 
    })
  })

  test('5. 색상 대비 및 가독성 확인', async () => {
    await page.goto('http://localhost:3003/')
    
    // 카드 hover 효과 확인
    const card = await page.locator('.hover\\:shadow-2xl').first()
    await card.hover()
    await page.waitForTimeout(500)
    
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-05-hover-effects.png',
      fullPage: true 
    })
    
    // 텍스트 가독성 확인
    const texts = await page.locator('.font-bold.text-gray-800').all()
    for (const text of texts.slice(0, 3)) {
      const color = await text.evaluate(el => 
        window.getComputedStyle(el).color
      )
      console.log('텍스트 색상:', color)
    }
  })

  test('6. 반응형 디자인 확인', async () => {
    // 모바일
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3003/')
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-06-mobile.png',
      fullPage: true 
    })
    
    // 태블릿
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-06-tablet.png',
      fullPage: true 
    })
    
    // 데스크톱
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-06-desktop.png',
      fullPage: true 
    })
  })

  test('7. 최종 UI 품질 검증', async () => {
    await page.goto('http://localhost:3003/tee-times')
    await page.waitForLoadState('networkidle')
    
    // 개선사항 체크리스트
    const improvements = {
      '그라데이션 배경': await page.locator('.bg-gradient-to-r').count() > 0,
      '그림자 효과': await page.locator('.shadow-2xl').count() > 0,
      '호버 효과': await page.locator('.hover\\:scale-105').count() > 0,
      '현대적 버튼': await page.locator('.bg-gradient-to-r.from-emerald-500').count() > 0,
      '개선된 색상': await page.locator('.text-emerald-600').count() > 0
    }
    
    console.log('UI 개선사항 체크리스트:')
    for (const [key, value] of Object.entries(improvements)) {
      console.log(`  - ${key}: ${value ? '✅' : '❌'}`)
    }
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'artifacts/test-results/ui-07-final-validation.png',
      fullPage: true 
    })
    
    // 모든 개선사항이 적용되었는지 확인
    const allImprovements = Object.values(improvements).every(v => v)
    expect(allImprovements).toBe(true)
  })
})