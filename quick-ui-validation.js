const { chromium } = require('playwright');

(async () => {
  const BASE_URL = 'http://localhost:3009';
  const TEST_CREDENTIALS = {
    phone: '01034424668',
    password: 'admin1234'
  };

  console.log('🚀 골프장 예약 관리 시스템 UI 중복 검증 시작...\n');
  console.log('📍 대상 URL:', BASE_URL);
  console.log('=====================================\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1080']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul'
  });

  const page = await context.newPage();
  
  try {
    // 1. 로그인 페이지 검증
    console.log('1️⃣ 로그인 페이지 검증');
    console.log('-------------------');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const loginHeaders = await page.locator('header').count();
    const loginLogos = await page.locator('[class*="logo"], [id*="logo"]').count();
    const loginTitles = await page.locator('text="골프장 예약 관리"').count();
    
    console.log(`  ✓ Header 요소: ${loginHeaders}개 (예상: 0개)`);
    console.log(`  ✓ Logo 요소: ${loginLogos}개`);
    console.log(`  ✓ "골프장 예약 관리" 텍스트: ${loginTitles}개`);
    
    if (loginHeaders === 0) {
      console.log('  ✅ 로그인 페이지에 GlobalHeader 없음 (정상)\n');
    } else {
      console.log('  ❌ 로그인 페이지에 GlobalHeader가 표시됨 (문제)\n');
    }

    await page.screenshot({ path: 'artifacts/screenshots/1-login-page.png', fullPage: true });

    // 2. 로그인 수행
    console.log('2️⃣ 로그인 수행');
    console.log('-------------------');
    
    // 빠른 로그인 버튼 클릭 (최고관리자 계정)
    const quickLoginButton = page.locator('button').filter({ hasText: '최고관리자' });
    await quickLoginButton.click();
    
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('  ✅ 로그인 성공\n');

    // 3. 대시보드 검증
    console.log('3️⃣ 대시보드 페이지 검증');
    console.log('-------------------');
    
    const dashboardHeaders = await page.locator('header').count();
    const titleCount = await page.locator('text="골프장 예약 관리"').count();
    const systemTitleCount = await page.locator('text="Golf Reservation System"').count();
    const adminTextCount = await page.locator('text="최고관리자"').count();
    
    console.log(`  ✓ Header 요소: ${dashboardHeaders}개 (예상: 1개)`);
    console.log(`  ✓ "골프장 예약 관리" 텍스트: ${titleCount}개 (예상: 1개)`);
    console.log(`  ✓ "Golf Reservation System" 텍스트: ${systemTitleCount}개 (예상: 1개)`);
    console.log(`  ✓ "최고관리자" 텍스트: ${adminTextCount}개 (예상: 1개)`);
    
    const dashboardPassed = 
      dashboardHeaders === 1 && 
      titleCount === 1 && 
      systemTitleCount === 1 && 
      adminTextCount === 1;
    
    if (dashboardPassed) {
      console.log('  ✅ 대시보드 UI 중복 없음 (정상)\n');
    } else {
      console.log('  ❌ 대시보드에 UI 중복 발견 (문제)\n');
    }

    await page.screenshot({ path: 'artifacts/screenshots/2-dashboard.png', fullPage: true });

    // 4. Matrix 페이지 검증
    console.log('4️⃣ 티타임 관리 (Matrix) 페이지 검증');
    console.log('-------------------');
    await page.goto(`${BASE_URL}/matrix`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const matrixHeaders = await page.locator('header').count();
    const matrixTitleCount = await page.locator('text="골프장 예약 관리"').count();
    const tabLists = await page.locator('[role="tablist"]').count();
    
    console.log(`  ✓ Header 요소: ${matrixHeaders}개 (예상: 1개)`);
    console.log(`  ✓ "골프장 예약 관리" 텍스트: ${matrixTitleCount}개 (예상: 1개)`);
    console.log(`  ✓ Tab lists: ${tabLists}개`);
    
    const matrixPassed = matrixHeaders === 1 && matrixTitleCount === 1;
    
    if (matrixPassed) {
      console.log('  ✅ Matrix 페이지 UI 중복 없음 (정상)\n');
    } else {
      console.log('  ❌ Matrix 페이지에 UI 중복 발견 (문제)\n');
    }

    await page.screenshot({ path: 'artifacts/screenshots/3-matrix.png', fullPage: true });

    // 5. 회원 관리 페이지 검증
    console.log('5️⃣ 회원 관리 페이지 검증');
    console.log('-------------------');
    await page.goto(`${BASE_URL}/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const membersHeaders = await page.locator('header').count();
    const membersTitleCount = await page.locator('text="골프장 예약 관리"').count();
    
    console.log(`  ✓ Header 요소: ${membersHeaders}개 (예상: 1개)`);
    console.log(`  ✓ "골프장 예약 관리" 텍스트: ${membersTitleCount}개 (예상: 1개)`);
    
    const membersPassed = membersHeaders === 1 && membersTitleCount === 1;
    
    if (membersPassed) {
      console.log('  ✅ 회원 관리 페이지 UI 중복 없음 (정상)\n');
    } else {
      console.log('  ❌ 회원 관리 페이지에 UI 중복 발견 (문제)\n');
    }

    await page.screenshot({ path: 'artifacts/screenshots/4-members.png', fullPage: true });

    // 최종 결과
    console.log('=====================================');
    console.log('📊 최종 검증 결과');
    console.log('=====================================');
    
    const allPassed = 
      loginHeaders === 0 &&
      dashboardPassed &&
      matrixPassed &&
      membersPassed;
    
    if (allPassed) {
      console.log('\n✅✅✅ 모든 페이지에서 UI 중복 문제가 해결되었습니다! ✅✅✅');
      console.log('\n주요 확인 사항:');
      console.log('  ✓ 로그인 페이지에서 GlobalHeader가 숨겨짐');
      console.log('  ✓ 대시보드에서 텍스트 중복 없음');
      console.log('  ✓ 모든 페이지에서 Header가 정확히 1개만 표시됨');
      console.log('  ✓ "골프장 예약 관리" 텍스트가 각 페이지에서 1개만 표시됨');
    } else {
      console.log('\n❌ 일부 페이지에서 UI 중복 문제가 발견되었습니다.');
      console.log('\n문제가 발견된 항목:');
      if (loginHeaders > 0) console.log('  ❌ 로그인 페이지에 GlobalHeader가 표시됨');
      if (!dashboardPassed) console.log('  ❌ 대시보드에 UI 요소 중복');
      if (!matrixPassed) console.log('  ❌ Matrix 페이지에 UI 요소 중복');
      if (!membersPassed) console.log('  ❌ 회원 관리 페이지에 UI 요소 중복');
    }
    
    console.log('\n📸 스크린샷이 artifacts/screenshots/ 디렉토리에 저장되었습니다.');
    
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
  } finally {
    // 브라우저를 10초간 열어둔 후 종료
    console.log('\n⏰ 10초 후 브라우저가 자동으로 종료됩니다...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();