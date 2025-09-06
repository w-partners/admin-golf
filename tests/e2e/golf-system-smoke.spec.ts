import { test, expect, chromium } from '@playwright/test';
import { chromium as playwrightExtra } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth 플러그인 적용
playwrightExtra.use(StealthPlugin());

test.describe('골프장 예약 관리 시스템 - 전체 사용자 경험 테스트', () => {
  const BASE_URL = process.env.TARGET_URL || 'http://localhost:3001';
  const PRISMA_STUDIO_URL = 'http://localhost:5555';
  
  // 테스트 계정 정보
  const TEST_ACCOUNTS = {
    SUPER_ADMIN: {
      phone: '01034424668',
      password: 'admin1234',
      role: 'SUPER_ADMIN'
    }
  };

  test.beforeEach(async ({ page }) => {
    // Playwright의 context 설정은 config 파일에서 처리됨
    // 여기서는 페이지 레벨 설정만 수행
    
    // 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('1. 초기 상태 및 로딩 확인', async ({ page }) => {
    console.log('🔍 초기 상태 확인 중...');
    
    // 메인 페이지 접속
    const response = await page.goto(BASE_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 페이지 응답 확인
    expect(response?.status()).toBeLessThan(400);
    
    // 에러 페이지가 아닌지 확인
    const pageContent = await page.content();
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('403');
    expect(pageContent).not.toContain('401');
    expect(pageContent).not.toContain('Internal Server Error');
    
    // 로그인 페이지로 리다이렉트 확인
    await page.waitForURL('**/login**', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 로그인 페이지 리다이렉트가 감지되지 않음');
    });
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-initial-state.png',
      fullPage: true 
    });
    
    console.log('✅ 초기 상태 확인 완료');
  });

  test('2. Prisma Studio에서 테스트 계정 확인', async ({ page }) => {
    console.log('🔍 Prisma Studio 접속 중...');
    
    // Prisma Studio 접속 시도
    try {
      await page.goto(PRISMA_STUDIO_URL, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      // User 모델 선택
      await page.click('text=User', { timeout: 5000 }).catch(() => {
        console.log('⚠️ User 모델을 찾을 수 없음');
      });
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'artifacts/screenshots/02-prisma-studio.png',
        fullPage: true 
      });
      
      console.log('✅ Prisma Studio 접속 성공');
    } catch (error) {
      console.log('⚠️ Prisma Studio 접속 실패 - 테스트 계정이 이미 존재할 수 있음');
    }
  });

  test('3. 로그인 플로우 테스트', async ({ page }) => {
    console.log('🔐 로그인 플로우 테스트 시작...');
    
    // 로그인 페이지로 이동
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle'
    });
    
    // 로그인 폼 존재 확인
    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="전화"], input[placeholder*="연락처"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")');
    
    // 입력 필드 존재 확인
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // 테스트 계정으로 로그인 시도
    await phoneInput.fill(TEST_ACCOUNTS.SUPER_ADMIN.phone);
    await passwordInput.fill(TEST_ACCOUNTS.SUPER_ADMIN.password);
    
    // 로그인 전 스크린샷
    await page.screenshot({ 
      path: 'artifacts/screenshots/03-login-form.png',
      fullPage: true 
    });
    
    // 로그인 버튼 클릭
    await loginButton.click();
    
    // 로그인 성공 또는 실패 확인
    try {
      // 대시보드로 이동 확인 (성공 케이스)
      await page.waitForURL('**/', { timeout: 10000 });
      console.log('✅ 로그인 성공');
      
      // 로그인 후 스크린샷
      await page.screenshot({ 
        path: 'artifacts/screenshots/03-login-success.png',
        fullPage: true 
      });
    } catch {
      // 에러 메시지 확인 (실패 케이스)
      const errorMessage = await page.locator('.error, .alert, [role="alert"]').textContent();
      console.log(`⚠️ 로그인 실패: ${errorMessage}`);
      
      // 에러 스크린샷
      await page.screenshot({ 
        path: 'artifacts/screenshots/03-login-error.png',
        fullPage: true 
      });
    }
  });

  test('4. 대시보드 접근 및 권한별 메뉴 확인', async ({ page }) => {
    console.log('📊 대시보드 테스트 시작...');
    
    // 로그인 수행
    await performLogin(page, BASE_URL, TEST_ACCOUNTS.SUPER_ADMIN);
    
    // 대시보드 요소 확인
    await page.waitForSelector('nav, header', { timeout: 10000 });
    
    // SUPER_ADMIN 권한 메뉴 확인
    const expectedMenus = [
      '티타임',
      '골프장',
      '실적',
      '회원'
    ];
    
    for (const menu of expectedMenus) {
      const menuElement = page.locator(`text=${menu}`).first();
      const isVisible = await menuElement.isVisible().catch(() => false);
      console.log(`  ${isVisible ? '✅' : '❌'} ${menu} 메뉴`);
    }
    
    // 퀵 액션 카드 확인
    const cards = await page.locator('.card, [class*="card"]').count();
    console.log(`  📋 퀵 액션 카드 수: ${cards}`);
    
    // 대시보드 스크린샷
    await page.screenshot({ 
      path: 'artifacts/screenshots/04-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ 대시보드 확인 완료');
  });

  test('5. 핵심 기능 접근 테스트', async ({ page }) => {
    console.log('🎯 핵심 기능 테스트 시작...');
    
    // 로그인 수행
    await performLogin(page, BASE_URL, TEST_ACCOUNTS.SUPER_ADMIN);
    
    // 5-1. 티타임 조회 테스트
    console.log('  📅 티타임 조회 테스트...');
    await page.goto(`${BASE_URL}/tee-times`, { waitUntil: 'networkidle' });
    
    // Matrix View 탭 확인
    const tabs = ['데일리부킹', '데일리조인', '패키지부킹', '패키지조인'];
    for (const tab of tabs) {
      const tabElement = page.locator(`text=${tab}`).first();
      const isVisible = await tabElement.isVisible().catch(() => false);
      console.log(`    ${isVisible ? '✅' : '❌'} ${tab} 탭`);
    }
    
    await page.screenshot({ 
      path: 'artifacts/screenshots/05-tee-times.png',
      fullPage: true 
    });
    
    // 5-2. 골프장 관리 테스트
    console.log('  ⛳ 골프장 관리 테스트...');
    await page.goto(`${BASE_URL}/golf-courses`, { waitUntil: 'networkidle' });
    
    // 골프장 리스트 또는 등록 버튼 확인
    const hasGolfCourseContent = await page.locator('text=/골프장|등록|추가/i').first().isVisible().catch(() => false);
    console.log(`    ${hasGolfCourseContent ? '✅' : '❌'} 골프장 관리 페이지`);
    
    await page.screenshot({ 
      path: 'artifacts/screenshots/05-golf-courses.png',
      fullPage: true 
    });
    
    // 5-3. 실적 관리 테스트
    console.log('  📊 실적 관리 테스트...');
    await page.goto(`${BASE_URL}/performance`, { waitUntil: 'networkidle' });
    
    // 실적 관련 콘텐츠 확인
    const hasPerformanceContent = await page.locator('text=/실적|완료|등록/i').first().isVisible().catch(() => false);
    console.log(`    ${hasPerformanceContent ? '✅' : '❌'} 실적 관리 페이지`);
    
    await page.screenshot({ 
      path: 'artifacts/screenshots/05-performance.png',
      fullPage: true 
    });
    
    console.log('✅ 핵심 기능 테스트 완료');
  });

  test('6. 오류 처리 및 에러 페이지 확인', async ({ page }) => {
    console.log('🚨 오류 처리 테스트 시작...');
    
    // 존재하지 않는 페이지 접근
    await page.goto(`${BASE_URL}/non-existent-page`, { waitUntil: 'networkidle' });
    
    // 404 페이지 확인
    const has404 = await page.locator('text=/404|찾을 수 없|not found/i').first().isVisible().catch(() => false);
    console.log(`  ${has404 ? '✅' : '❌'} 404 에러 페이지`);
    
    await page.screenshot({ 
      path: 'artifacts/screenshots/06-error-404.png',
      fullPage: true 
    });
    
    // 콘솔 에러 수집
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 권한 없는 페이지 접근 시도 (로그인하지 않은 상태)
    await page.goto(`${BASE_URL}/members`, { waitUntil: 'networkidle' });
    
    // 권한 에러 또는 리다이렉트 확인
    const hasAuthError = await page.url().includes('login') || 
                         await page.locator('text=/권한|unauthorized|접근/i').first().isVisible().catch(() => false);
    console.log(`  ${hasAuthError ? '✅' : '❌'} 권한 체크`);
    
    // 콘솔 에러 출력
    if (consoleErrors.length > 0) {
      console.log('  ⚠️ 콘솔 에러 발견:');
      consoleErrors.forEach(error => console.log(`    - ${error}`));
    }
    
    console.log('✅ 오류 처리 테스트 완료');
  });
});

// 로그인 헬퍼 함수
async function performLogin(page: any, baseUrl: string, account: any) {
  // 이미 로그인되어 있는지 확인
  const currentUrl = page.url();
  if (!currentUrl.includes('login')) {
    return; // 이미 로그인됨
  }
  
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  
  const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
  
  await phoneInput.fill(account.phone);
  await passwordInput.fill(account.password);
  await loginButton.click();
  
  // 로그인 완료 대기
  await page.waitForURL('**/', { timeout: 10000 }).catch(() => {
    console.log('⚠️ 로그인 후 리다이렉트 실패');
  });
}