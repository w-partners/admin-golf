import { chromium } from 'playwright';

async function validateUIElements() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const context = await browser.newContext({
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  
  console.log('=== UI 중복 요소 검증 시작 ===\n');
  
  // 1. 메인 페이지 접속
  console.log('1. 메인 페이지 접속 중...');
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // 로그인 상태 확인
  const isLoggedIn = await page.locator('button:has-text("로그아웃")').isVisible().catch(() => false);
  
  if (!isLoggedIn) {
    console.log('로그인이 필요합니다. 관리자 계정으로 로그인 진행...');
    
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    
    // 로그인 폼 입력
    await page.fill('input[name="phone"]', '01034424668');
    await page.fill('input[name="password"]', 'admin1234');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    // 로그인 후 페이지 전환 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }
  
  // 메인 페이지 전체 스크린샷
  await page.screenshot({ 
    path: 'artifacts/ui-validation/01-main-page-full.png', 
    fullPage: true 
  });
  console.log('✓ 메인 페이지 전체 스크린샷 캡처 완료\n');
  
  // 2. 중복 텍스트 검증
  console.log('2. 중복 텍스트 요소 검증 중...');
  
  const duplicateTexts = [
    '골프장 예약 관리',
    'Golf Reservation System',
    '최고관리자',
    '대시보드',
    '티타임',
    '골프장',
    '실적등록',
    '회원관리'
  ];
  
  const textDuplicates: any[] = [];
  
  for (const text of duplicateTexts) {
    const elements = await page.locator(`text="${text}"`).all();
    if (elements.length > 1) {
      textDuplicates.push({
        text,
        count: elements.length,
        locations: []
      });
      
      // 각 중복 요소의 위치 정보 수집
      for (let i = 0; i < elements.length; i++) {
        const box = await elements[i].boundingBox();
        const parentElement = await elements[i].evaluateHandle((el: any) => {
          return el.parentElement?.className || 'unknown';
        });
        textDuplicates[textDuplicates.length - 1].locations.push({
          index: i + 1,
          parentClass: await parentElement.jsonValue(),
          position: box
        });
      }
    }
  }
  
  if (textDuplicates.length > 0) {
    console.log('❌ 발견된 중복 텍스트:');
    textDuplicates.forEach(dup => {
      console.log(`  - "${dup.text}": ${dup.count}개 발견`);
      dup.locations.forEach((loc: any) => {
        console.log(`    위치 ${loc.index}: 부모 클래스 = ${loc.parentClass}`);
      });
    });
  } else {
    console.log('✓ 중복 텍스트 없음');
  }
  console.log('');
  
  // 3. 햄버거 메뉴 및 사이드바 검증
  console.log('3. 햄버거 메뉴 및 사이드바 검증 중...');
  
  let sidebarDuplicates: string[] = [];
  const hamburgerMenu = await page.locator('button[aria-label*="menu"], button:has(svg.lucide-menu)').first();
  if (await hamburgerMenu.isVisible()) {
    await hamburgerMenu.click();
    await page.waitForTimeout(1000);
    
    // 사이드바 스크린샷
    await page.screenshot({ 
      path: 'artifacts/ui-validation/02-sidebar-menu.png', 
      fullPage: false 
    });
    console.log('✓ 사이드바 메뉴 스크린샷 캡처 완료');
    
    // 사이드바 내 중복 메뉴 항목 확인
    const sidebarMenuItems = await page.locator('.sidebar nav a, aside nav a').all();
    const sidebarTexts: string[] = [];
    for (const item of sidebarMenuItems) {
      const text = await item.textContent();
      if (text) sidebarTexts.push(text.trim());
    }
    
    sidebarDuplicates = sidebarTexts.filter((item, index) => 
      sidebarTexts.indexOf(item) !== index
    );
    
    if (sidebarDuplicates.length > 0) {
      console.log('❌ 사이드바 내 중복 메뉴 항목:', sidebarDuplicates);
    } else {
      console.log('✓ 사이드바 내 중복 메뉴 항목 없음');
    }
    
    // 사이드바 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('⚠️ 햄버거 메뉴를 찾을 수 없습니다');
  }
  console.log('');
  
  // 4. 사용자 프로필 드롭다운 메뉴 검증
  console.log('4. 사용자 프로필 드롭다운 메뉴 검증 중...');
  
  let dropdownDuplicates: string[] = [];
  const userProfile = await page.locator('button:has-text("최고관리자"), button:has-text("01034424668")').first();
  if (await userProfile.isVisible()) {
    await userProfile.click();
    await page.waitForTimeout(1000);
    
    // 드롭다운 메뉴 스크린샷
    await page.screenshot({ 
      path: 'artifacts/ui-validation/03-profile-dropdown.png', 
      fullPage: false 
    });
    console.log('✓ 프로필 드롭다운 메뉴 스크린샷 캡처 완료');
    
    // 드롭다운 내 중복 항목 확인
    const dropdownItems = await page.locator('[role="menu"] [role="menuitem"], .dropdown-menu a').all();
    const dropdownTexts: string[] = [];
    for (const item of dropdownItems) {
      const text = await item.textContent();
      if (text) dropdownTexts.push(text.trim());
    }
    
    dropdownDuplicates = dropdownTexts.filter((item, index) => 
      dropdownTexts.indexOf(item) !== index
    );
    
    if (dropdownDuplicates.length > 0) {
      console.log('❌ 드롭다운 내 중복 항목:', dropdownDuplicates);
    } else {
      console.log('✓ 드롭다운 내 중복 항목 없음');
    }
    
    // 드롭다운 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('⚠️ 사용자 프로필 버튼을 찾을 수 없습니다');
  }
  console.log('');
  
  // 5. 헤더 영역 중복 요소 검증
  console.log('5. 헤더 영역 중복 요소 상세 검증 중...');
  
  // 헤더 영역 스크린샷
  const header = await page.locator('header, nav, .header, .navbar').first();
  if (await header.isVisible()) {
    await header.screenshot({ 
      path: 'artifacts/ui-validation/04-header-area.png'
    });
    console.log('✓ 헤더 영역 스크린샷 캡처 완료');
  }
  
  // 네비게이션 메뉴 중복 확인
  const navItems = await page.locator('nav a, .nav-link, .menu-item').all();
  const navTexts: string[] = [];
  for (const item of navItems) {
    const text = await item.textContent();
    if (text) navTexts.push(text.trim());
  }
  
  const navDuplicates = navTexts.filter((item, index) => 
    navTexts.indexOf(item) !== index
  );
  
  if (navDuplicates.length > 0) {
    console.log('❌ 네비게이션 내 중복 항목:', navDuplicates);
  } else {
    console.log('✓ 네비게이션 내 중복 항목 없음');
  }
  console.log('');
  
  // 6. 최종 검증 결과 요약
  console.log('=== 검증 결과 요약 ===\n');
  
  const totalDuplicates = textDuplicates.length + 
                          sidebarDuplicates.length + 
                          dropdownDuplicates.length + 
                          navDuplicates.length;
  
  if (totalDuplicates === 0) {
    console.log('✅ 모든 UI 중복 요소가 해결되었습니다!');
  } else {
    console.log(`⚠️ 총 ${totalDuplicates}개의 중복 요소가 발견되었습니다:`);
    
    if (textDuplicates.length > 0) {
      console.log('\n📝 텍스트 중복:');
      textDuplicates.forEach(dup => {
        console.log(`  - "${dup.text}": ${dup.count}개`);
      });
    }
    
    if (sidebarDuplicates.length > 0) {
      console.log('\n📋 사이드바 메뉴 중복:');
      [...new Set(sidebarDuplicates)].forEach(item => {
        console.log(`  - "${item}"`);
      });
    }
    
    if (dropdownDuplicates.length > 0) {
      console.log('\n👤 프로필 드롭다운 중복:');
      [...new Set(dropdownDuplicates)].forEach(item => {
        console.log(`  - "${item}"`);
      });
    }
    
    if (navDuplicates.length > 0) {
      console.log('\n🔗 네비게이션 메뉴 중복:');
      [...new Set(navDuplicates)].forEach(item => {
        console.log(`  - "${item}"`);
      });
    }
  }
  
  console.log('\n스크린샷 저장 위치:');
  console.log('  - artifacts/ui-validation/01-main-page-full.png');
  console.log('  - artifacts/ui-validation/02-sidebar-menu.png');
  console.log('  - artifacts/ui-validation/03-profile-dropdown.png');
  console.log('  - artifacts/ui-validation/04-header-area.png');
  
  await browser.close();
}

// 실행
validateUIElements().catch(console.error);