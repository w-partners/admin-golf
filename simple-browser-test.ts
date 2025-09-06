import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin
chromium.use(StealthPlugin());

async function openBrowser() {
  console.log('🚀 브라우저를 시작합니다...');
  
  // Launch browser in non-headless mode (visible)
  const browser = await chromium.launch({
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

  // Open multiple tabs
  console.log('\n📍 탭 1: localhost:3001 (메인 애플리케이션) 열기...');
  const page1 = await context.newPage();
  await page1.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  console.log('✅ 메인 애플리케이션 페이지가 열렸습니다.');

  console.log('\n📍 탭 2: localhost:5555 (Prisma Studio) 열기...');
  const page2 = await context.newPage();
  await page2.goto('http://localhost:5555', { waitUntil: 'domcontentloaded' });
  console.log('✅ Prisma Studio 페이지가 열렸습니다.');

  console.log('\n✨ 브라우저가 열렸습니다!');
  console.log('');
  console.log('📋 다음 작업을 수동으로 진행해주세요:');
  console.log('');
  console.log('1️⃣ Prisma Studio 탭에서:');
  console.log('   - User 테이블 클릭');
  console.log('   - "Add record" 버튼 클릭');
  console.log('   - 다음 정보 입력:');
  console.log('     • name: 최고관리자');
  console.log('     • phone: 01034424668');
  console.log('     • password: $2b$10$89HhrwwhAQ8pyvpqYTAVtunX6l2m//xFZj4YWsL82bLtwbns2FuA6');
  console.log('     • accountType: SUPER_ADMIN');
  console.log('     • status: ACTIVE');
  console.log('   - "Save" 버튼 클릭');
  console.log('');
  console.log('2️⃣ 메인 애플리케이션 탭에서:');
  console.log('   - 연락처: 01034424668');
  console.log('   - 비밀번호: admin1234');
  console.log('   - 로그인 버튼 클릭');
  console.log('');
  console.log('3️⃣ 로그인 후 각 메뉴를 테스트해보세요.');
  console.log('');
  console.log('🔴 브라우저를 닫으려면 Ctrl+C를 누르세요.');

  // Keep browser open
  await new Promise(() => {});
}

openBrowser().catch(console.error);