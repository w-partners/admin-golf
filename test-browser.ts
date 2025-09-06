import { chromium } from 'playwright';
import { chromium as stealthChromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin
stealthChromium.use(StealthPlugin());

async function testGolfSystem() {
  console.log('🚀 브라우저를 시작합니다...');
  
  // Launch browser in non-headless mode (visible)
  const browser = await stealthChromium.launch({
    headless: false,
    args: [
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // Step 1: localhost:3001 접속
    console.log('\n📍 Step 1: localhost:3001에 접속합니다...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'screenshots/01-initial-page.png',
      fullPage: true 
    });
    console.log('✅ 초기 페이지 스크린샷 저장: screenshots/01-initial-page.png');

    // Check if redirected to login
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);

    // Step 2: Prisma Studio 접속
    console.log('\n📍 Step 2: Prisma Studio에 접속합니다...');
    const studioPage = await context.newPage();
    await studioPage.goto('http://localhost:5555', { waitUntil: 'networkidle' });
    await studioPage.waitForTimeout(2000);

    await studioPage.screenshot({ 
      path: 'screenshots/02-prisma-studio.png',
      fullPage: true 
    });
    console.log('✅ Prisma Studio 스크린샷 저장: screenshots/02-prisma-studio.png');

    // User 테이블 클릭
    console.log('User 테이블을 선택합니다...');
    await studioPage.click('text=User');
    await studioPage.waitForTimeout(2000);

    // Add record 버튼 클릭
    console.log('새 레코드 추가 버튼을 클릭합니다...');
    const addButton = await studioPage.waitForSelector('button:has-text("Add record")', { timeout: 5000 });
    if (addButton) {
      await addButton.click();
      await studioPage.waitForTimeout(2000);

      // 테스트 계정 데이터 입력
      console.log('테스트 계정 데이터를 입력합니다...');
      
      // Fill in the form fields
      await studioPage.fill('input[name="name"]', '최고관리자');
      await studioPage.fill('input[name="phone"]', '01034424668');
      await studioPage.fill('input[name="password"]', '$2b$10$89HhrwwhAQ8pyvpqYTAVtunX6l2m//xFZj4YWsL82bLtwbns2FuA6');
      
      // Select account type
      await studioPage.selectOption('select[name="accountType"]', 'SUPER_ADMIN');
      
      // Select status
      await studioPage.selectOption('select[name="status"]', 'ACTIVE');

      await studioPage.screenshot({ 
        path: 'screenshots/03-user-form-filled.png',
        fullPage: true 
      });
      console.log('✅ 사용자 폼 입력 스크린샷 저장: screenshots/03-user-form-filled.png');

      // Save the record
      const saveButton = await studioPage.waitForSelector('button:has-text("Save")', { timeout: 5000 });
      if (saveButton) {
        await saveButton.click();
        await studioPage.waitForTimeout(3000);
        console.log('✅ 테스트 계정이 생성되었습니다!');
      }
    }

    // Step 3: 로그인 페이지로 돌아가서 로그인 시도
    console.log('\n📍 Step 3: 로그인 페이지로 돌아가서 로그인을 시도합니다...');
    await page.bringToFront();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 로그인 폼 입력
    console.log('로그인 정보를 입력합니다...');
    await page.fill('input[name="phone"]', '01034424668');
    await page.fill('input[name="password"]', 'admin1234');

    await page.screenshot({ 
      path: 'screenshots/04-login-form-filled.png',
      fullPage: true 
    });
    console.log('✅ 로그인 폼 입력 스크린샷 저장: screenshots/04-login-form-filled.png');

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 4: 대시보드 확인
    console.log('\n📍 Step 4: 대시보드를 확인합니다...');
    await page.screenshot({ 
      path: 'screenshots/05-dashboard.png',
      fullPage: true 
    });
    console.log('✅ 대시보드 스크린샷 저장: screenshots/05-dashboard.png');

    // 각 메뉴 접근 테스트
    const menus = [
      { text: '티타임', path: 'tee-times' },
      { text: '골프장 관리', path: 'golf-courses' },
      { text: '회원 관리', path: 'members' }
    ];

    for (const menu of menus) {
      const menuElement = await page.$(`text=${menu.text}`);
      if (menuElement) {
        console.log(`\n${menu.text} 메뉴를 테스트합니다...`);
        await menuElement.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `screenshots/06-${menu.path}.png`,
          fullPage: true 
        });
        console.log(`✅ ${menu.text} 페이지 스크린샷 저장: screenshots/06-${menu.path}.png`);
      }
    }

    console.log('\n✨ 모든 테스트가 완료되었습니다!');
    console.log('브라우저는 계속 열려있습니다. 추가 테스트를 원하시면 직접 조작하실 수 있습니다.');
    
    // Keep browser open for manual testing
    await new Promise(() => {}); // This will keep the browser open

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ 
      path: 'screenshots/error-screenshot.png',
      fullPage: true 
    });
  }
}

// Run the test
testGolfSystem();