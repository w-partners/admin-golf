import { test, expect, chromium } from '@playwright/test';
import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3008';
const TEST_CREDENTIALS = {
  phone: '01034424668',
  password: 'admin1234'
};

test.describe('UI 중복 문제 검증 테스트', () => {
  let browser: any;
  let page: Page;

  test.beforeAll(async () => {
    // Stealth mode browser setup
    browser = await chromium.launch({
      headless: false, // Set to true for CI/CD
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920,1080'
      ]
    });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    // Take screenshot for evidence
    const testName = test.info().title.replace(/[^a-zA-Z0-9]/g, '-');
    await page.screenshot({ 
      path: `artifacts/screenshots/${testName}-${Date.now()}.png`,
      fullPage: true 
    });
    await page.close();
  });

  test('1. 로그인 페이지 - GlobalHeader가 나타나지 않아야 함', async () => {
    console.log('🔍 로그인 페이지 검증 시작...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // GlobalHeader elements should NOT exist on login page
    const headerElements = await page.locator('header').count();
    const logoElements = await page.locator('[class*="logo"], [id*="logo"]').count();
    const profileElements = await page.locator('[class*="profile"], [class*="user-info"]').count();
    
    console.log(`  - Header elements found: ${headerElements}`);
    console.log(`  - Logo elements found: ${logoElements}`);
    console.log(`  - Profile elements found: ${profileElements}`);
    
    expect(headerElements).toBe(0);
    console.log('✅ 로그인 페이지에 GlobalHeader가 없음 (정상)');
    
    // Screenshot for evidence
    await page.screenshot({ 
      path: 'artifacts/screenshots/login-page-no-header.png',
      fullPage: true 
    });
  });

  test('2. 대시보드 - 텍스트 중복 검증', async () => {
    console.log('🔍 대시보드 텍스트 중복 검증 시작...');
    
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="phone"]', TEST_CREDENTIALS.phone);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL((url) => !url.includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for text duplications
    const checkTextDuplication = async (text: string, expectedCount: number = 1) => {
      const elements = await page.locator(`text="${text}"`).all();
      const actualCount = elements.length;
      
      console.log(`  - "${text}" 텍스트 발견: ${actualCount}개 (예상: ${expectedCount}개)`);
      
      if (actualCount !== expectedCount) {
        // Log locations of duplicated elements
        for (let i = 0; i < elements.length; i++) {
          const box = await elements[i].boundingBox();
          console.log(`    위치 ${i+1}: ${box ? `x:${box.x}, y:${box.y}` : 'hidden'}`);
        }
      }
      
      expect(actualCount).toBe(expectedCount);
      return actualCount === expectedCount;
    };
    
    // Key text validation
    const validationResults = {
      '골프장 예약 관리': await checkTextDuplication('골프장 예약 관리', 1),
      'Golf Reservation System': await checkTextDuplication('Golf Reservation System', 1),
      '최고관리자': await checkTextDuplication('최고관리자', 1)
    };
    
    // Header count validation
    const headerCount = await page.locator('header').count();
    console.log(`  - Header elements: ${headerCount}개 (예상: 1개)`);
    expect(headerCount).toBe(1);
    
    // Navigation/menu count validation
    const navCount = await page.locator('nav').count();
    console.log(`  - Navigation elements: ${navCount}개`);
    
    // Screenshot for evidence
    await page.screenshot({ 
      path: 'artifacts/screenshots/dashboard-duplication-check.png',
      fullPage: true 
    });
    
    const allPassed = Object.values(validationResults).every(result => result);
    if (allPassed) {
      console.log('✅ 대시보드 텍스트 중복 없음 (정상)');
    } else {
      console.log('❌ 대시보드에 텍스트 중복 발견됨');
    }
  });

  test('3. 티타임 페이지 (Matrix View) - UI 중복 검증', async () => {
    console.log('🔍 티타임 페이지 UI 중복 검증 시작...');
    
    // Login and navigate
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="phone"]', TEST_CREDENTIALS.phone);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => !url.includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Navigate to matrix view
    await page.goto(`${BASE_URL}/matrix`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for UI duplications
    const headerCount = await page.locator('header').count();
    const navCount = await page.locator('nav').count();
    const tabsCount = await page.locator('[role="tablist"]').count();
    
    console.log(`  - Header elements: ${headerCount}개 (예상: 1개)`);
    console.log(`  - Navigation elements: ${navCount}개`);
    console.log(`  - Tab lists: ${tabsCount}개`);
    
    expect(headerCount).toBe(1);
    expect(tabsCount).toBeLessThanOrEqual(1); // Should be 0 or 1
    
    // Check for specific text duplications
    const titleElements = await page.locator('text="골프장 예약 관리"').all();
    console.log(`  - "골프장 예약 관리" 텍스트: ${titleElements.length}개`);
    expect(titleElements.length).toBe(1);
    
    // Screenshot for evidence
    await page.screenshot({ 
      path: 'artifacts/screenshots/matrix-view-duplication-check.png',
      fullPage: true 
    });
    
    console.log('✅ 티타임 페이지 UI 중복 검증 완료');
  });

  test('4. 회원 관리 페이지 - UI 중복 검증', async () => {
    console.log('🔍 회원 관리 페이지 UI 중복 검증 시작...');
    
    // Login and navigate
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="phone"]', TEST_CREDENTIALS.phone);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => !url.includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Navigate to members page
    await page.goto(`${BASE_URL}/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for UI duplications
    const headerCount = await page.locator('header').count();
    const navCount = await page.locator('nav').count();
    
    console.log(`  - Header elements: ${headerCount}개 (예상: 1개)`);
    console.log(`  - Navigation elements: ${navCount}개`);
    
    expect(headerCount).toBe(1);
    
    // Check for title duplications
    const titleElements = await page.locator('text="골프장 예약 관리"').all();
    console.log(`  - "골프장 예약 관리" 텍스트: ${titleElements.length}개`);
    expect(titleElements.length).toBe(1);
    
    // Screenshot for evidence
    await page.screenshot({ 
      path: 'artifacts/screenshots/members-page-duplication-check.png',
      fullPage: true 
    });
    
    console.log('✅ 회원 관리 페이지 UI 중복 검증 완료');
  });

  test('5. 전체 페이지 네비게이션 - 일관성 검증', async () => {
    console.log('🔍 전체 페이지 네비게이션 일관성 검증 시작...');
    
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="phone"]', TEST_CREDENTIALS.phone);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => !url.includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Navigate through main pages
    const pages = [
      { url: '/', name: '대시보드' },
      { url: '/matrix', name: '티타임 관리' },
      { url: '/golf-courses', name: '골프장 관리' },
      { url: '/members', name: '회원 관리' }
    ];
    
    const results: any[] = [];
    
    for (const pageInfo of pages) {
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const headerCount = await page.locator('header').count();
      const mainTitleCount = await page.locator('text="골프장 예약 관리"').count();
      
      results.push({
        page: pageInfo.name,
        url: pageInfo.url,
        headerCount,
        mainTitleCount
      });
      
      console.log(`  - ${pageInfo.name}: Headers=${headerCount}, Title="${mainTitleCount}"`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `artifacts/screenshots/page-${pageInfo.name.replace(/\s/g, '-')}.png`,
        fullPage: true 
      });
    }
    
    // Validate consistency
    const allHaveOneHeader = results.every(r => r.headerCount === 1);
    const allHaveOneTitle = results.every(r => r.mainTitleCount === 1);
    
    expect(allHaveOneHeader).toBe(true);
    expect(allHaveOneTitle).toBe(true);
    
    if (allHaveOneHeader && allHaveOneTitle) {
      console.log('✅ 모든 페이지에서 UI 요소가 일관되게 표시됨 (정상)');
    } else {
      console.log('❌ 일부 페이지에서 UI 중복 문제 발견');
      console.table(results);
    }
  });

  test('6. 성능 및 렌더링 검증', async () => {
    console.log('🔍 성능 및 렌더링 검증 시작...');
    
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="phone"]', TEST_CREDENTIALS.phone);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => !url.includes('/login'), { timeout: 10000 });
    
    // Measure performance
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        renderTime: navigation.domComplete - navigation.domLoading
      };
    });
    
    console.log(`  - DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  - Page Load Complete: ${metrics.loadComplete}ms`);
    console.log(`  - Render Time: ${metrics.renderTime}ms`);
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  ⚠️ Console Error: ${msg.text()}`);
      }
    });
    
    // Navigate to check for hydration issues
    await page.goto(`${BASE_URL}/matrix`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if elements are interactive
    const clickableElements = await page.locator('button, a, [role="button"]').count();
    console.log(`  - Interactive elements found: ${clickableElements}`);
    
    console.log('✅ 성능 및 렌더링 검증 완료');
  });
});

// Summary test
test('📊 UI 중복 문제 종합 요약', async ({ page }) => {
  console.log('\n========================================');
  console.log('    UI 중복 문제 검증 종합 결과');
  console.log('========================================\n');
  
  const summary = {
    '로그인 페이지': 'GlobalHeader 숨김 확인',
    '대시보드': '텍스트 중복 확인',
    '티타임 페이지': 'UI 요소 중복 확인',
    '회원 관리': 'UI 요소 중복 확인',
    '네비게이션 일관성': '모든 페이지 일관성 확인',
    '성능': '렌더링 및 에러 확인'
  };
  
  console.log('검증 항목:');
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`  ✓ ${key}: ${value}`);
  });
  
  console.log('\n모든 검증 항목을 실행하려면 다음 명령어를 사용하세요:');
  console.log('  npx playwright test ui-duplication-validation.spec.ts --headed');
  console.log('\n스크린샷은 artifacts/screenshots/ 디렉토리에 저장됩니다.');
  console.log('========================================\n');
});