import { test, expect, chromium } from '@playwright/test';
import { chromium as stealthChromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth 플러그인 적용
stealthChromium.use(StealthPlugin());

test.describe('골프장 예약 시스템 기본 기능 검증', () => {
  const TARGET_URL = 'http://localhost:8080';
  
  test.beforeAll(async () => {
    console.log(`\n🎯 골프장 예약 시스템 검증 시작: ${TARGET_URL}`);
    console.log('📋 검증 항목:');
    console.log('  1. 메인 페이지 접속 및 4개 탭 표시');
    console.log('  2. 각 탭 클릭 시 매트릭스 테이블 동작');
    console.log('  3. JavaScript 에러 확인');
    console.log('  4. UI 레이아웃 정상 동작');
  });

  test('1. 메인 페이지 접속 및 기본 UI 요소 확인', async () => {
    const browser = await stealthChromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // JavaScript 에러 모니터링
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
      console.error('❌ JavaScript 에러 감지:', error.message);
    });
    
    // 콘솔 메시지 모니터링
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('❌ 콘솔 에러:', msg.text());
      }
    });
    
    console.log('\n📍 메인 페이지 접속 중...');
    const response = await page.goto(TARGET_URL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 페이지 상태 확인
    expect(response?.status()).toBeLessThan(400);
    console.log(`✅ 페이지 응답 상태: ${response?.status()}`);
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-main-page.png',
      fullPage: true 
    });
    console.log('📸 메인 페이지 스크린샷 저장: 01-main-page.png');
    
    // 4개 탭 확인
    console.log('\n🔍 탭 요소 확인 중...');
    const tabs = ['데일리부킹', '데일리조인', '패키지부킹', '패키지조인'];
    
    for (const tabName of tabs) {
      const tabElement = await page.locator(`button:has-text("${tabName}")`).first();
      const isVisible = await tabElement.isVisible();
      expect(isVisible).toBeTruthy();
      console.log(`  ✅ ${tabName} 탭: 표시됨`);
    }
    
    // JavaScript 에러 확인
    expect(jsErrors.length).toBe(0);
    if (jsErrors.length === 0) {
      console.log('✅ JavaScript 에러 없음');
    }
    
    await browser.close();
  });

  test('2. 각 탭 클릭 및 매트릭스 테이블 표시 확인', async () => {
    const browser = await stealthChromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    const tabs = [
      { name: '데일리부킹', id: 'daily-booking' },
      { name: '데일리조인', id: 'daily-join' },
      { name: '패키지부킹', id: 'package-booking' },
      { name: '패키지조인', id: 'package-join' }
    ];
    
    for (const tab of tabs) {
      console.log(`\n🔍 ${tab.name} 탭 테스트 중...`);
      
      // 탭 클릭
      const tabButton = await page.locator(`button:has-text("${tab.name}")`).first();
      await tabButton.click();
      await page.waitForTimeout(1000);
      
      // 매트릭스 테이블 확인
      const matrixTable = await page.locator('#matrix-table, .matrix-table, table').first();
      const isTableVisible = await matrixTable.isVisible();
      
      if (isTableVisible) {
        console.log(`  ✅ ${tab.name} 매트릭스 테이블: 표시됨`);
        
        // 테이블 구조 확인
        const headers = await page.locator('th').count();
        console.log(`  📊 테이블 헤더 수: ${headers}개`);
        
        // 지역/골프장 열 확인
        const regionColumn = await page.locator('th:has-text("지역")').count();
        const golfCourseColumn = await page.locator('th:has-text("골프장")').count();
        
        if (regionColumn > 0) console.log('  ✅ 지역 열: 존재');
        if (golfCourseColumn > 0) console.log('  ✅ 골프장 열: 존재');
      } else {
        console.log(`  ⚠️ ${tab.name} 매트릭스 테이블: 표시되지 않음`);
      }
      
      // 각 탭 스크린샷
      await page.screenshot({ 
        path: `artifacts/screenshots/02-tab-${tab.id}.png`,
        fullPage: true 
      });
      console.log(`  📸 스크린샷 저장: 02-tab-${tab.id}.png`);
    }
    
    await browser.close();
  });

  test('3. 날짜 스크롤 및 시간대 표시 확인', async () => {
    const browser = await stealthChromium.launch({
      headless: false,
      args: ['--no-sandbox']
    });
    
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    console.log('\n🔍 날짜 스크롤 및 시간대 표시 확인 중...');
    
    // 데일리부킹 탭 클릭
    await page.locator('button:has-text("데일리부킹")').first().click();
    await page.waitForTimeout(1000);
    
    // 날짜 헤더 확인
    const dateHeaders = await page.locator('th').filter({ hasText: /\d{1,2}\/\d{1,2}/ }).count();
    console.log(`  📅 날짜 헤더 수: ${dateHeaders}개`);
    
    // 시간대 표시 확인 (1부, 2부, 3부)
    const timeSlotsVisible = await page.locator('text=/[123]부/').count();
    if (timeSlotsVisible > 0) {
      console.log(`  ✅ 시간대 표시 (1부/2부/3부): ${timeSlotsVisible}개 발견`);
    } else {
      console.log('  ⚠️ 시간대 표시를 찾을 수 없음');
    }
    
    // 수평 스크롤 가능 여부 확인
    const scrollableElement = await page.locator('.table-container, .scroll-container, [style*="overflow"]').first();
    if (await scrollableElement.count() > 0) {
      const scrollWidth = await scrollableElement.evaluate(el => el.scrollWidth);
      const clientWidth = await scrollableElement.evaluate(el => el.clientWidth);
      
      if (scrollWidth > clientWidth) {
        console.log('  ✅ 수평 스크롤: 활성화됨');
      } else {
        console.log('  ℹ️ 수평 스크롤: 필요 없음 (모든 날짜가 화면에 표시됨)');
      }
    }
    
    await browser.close();
  });

  test('4. 전체 UI 레이아웃 및 반응형 확인', async () => {
    const browser = await stealthChromium.launch({
      headless: false,
      args: ['--no-sandbox']
    });
    
    // 데스크톱 뷰
    console.log('\n🖥️ 데스크톱 뷰 테스트...');
    const desktopContext = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 }
    });
    
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    // 헤더 확인
    const header = await desktopPage.locator('header, .header, [class*="header"]').first();
    if (await header.count() > 0) {
      console.log('  ✅ 헤더: 표시됨');
    }
    
    // 퀵 메뉴 확인
    const quickMenu = await desktopPage.locator('.quick-menu, nav, [class*="menu"]').first();
    if (await quickMenu.count() > 0) {
      console.log('  ✅ 퀵 메뉴: 표시됨');
    }
    
    await desktopPage.screenshot({ 
      path: 'artifacts/screenshots/03-desktop-view.png',
      fullPage: true 
    });
    console.log('  📸 데스크톱 뷰 스크린샷: 03-desktop-view.png');
    
    // 태블릿 뷰
    console.log('\n📱 태블릿 뷰 테스트...');
    const tabletContext = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 768, height: 1024 }
    });
    
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    await tabletPage.screenshot({ 
      path: 'artifacts/screenshots/04-tablet-view.png',
      fullPage: true 
    });
    console.log('  📸 태블릿 뷰 스크린샷: 04-tablet-view.png');
    
    // 모바일 뷰
    console.log('\n📱 모바일 뷰 테스트...');
    const mobileContext = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 375, height: 667 },
      isMobile: true
    });
    
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    await mobilePage.screenshot({ 
      path: 'artifacts/screenshots/05-mobile-view.png',
      fullPage: true 
    });
    console.log('  📸 모바일 뷰 스크린샷: 05-mobile-view.png');
    
    await browser.close();
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 골프장 예약 시스템 검증 완료');
    console.log('📁 스크린샷 저장 위치: artifacts/screenshots/');
    console.log('='.repeat(60));
  });
});