import { test, expect, chromium } from '@playwright/test';
import { chromium as vanillaChromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth 설정
vanillaChromium.use(StealthPlugin());

test.describe('Golf Reservation System Validation', () => {
  test('시스템 전체 검증 - localhost:3004', async () => {
    console.log('🚀 시스템 검증 시작 - http://localhost:3004');
    
    // Stealth 브라우저 시작
    const browser = await vanillaChromium.launch({
      headless: false, // 화면을 보기 위해 headless 모드 비활성화
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
      // Step 1: 페이지 로딩 확인
      console.log('📍 Step 1: 페이지 로딩 확인');
      await page.goto('http://localhost:3004', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'artifacts/1-page-load.png',
        fullPage: true 
      });
      console.log('✅ 페이지 로딩 성공');

      // 페이지 타이틀 확인
      const title = await page.title();
      console.log(`   페이지 타이틀: ${title}`);

      // Step 2: 로그인 폼 확인
      console.log('📍 Step 2: 로그인 폼 확인');
      
      // 로그인 페이지인지 확인
      const currentUrl = page.url();
      console.log(`   현재 URL: ${currentUrl}`);
      
      // 로그인 폼 요소 확인
      const phoneInput = await page.locator('input[name="phone"], input[type="tel"], input[placeholder*="연락처"], input[placeholder*="전화"]').first();
      const passwordInput = await page.locator('input[type="password"]').first();
      const loginButton = await page.locator('button:has-text("로그인"), button[type="submit"]').first();
      
      if (await phoneInput.isVisible() && await passwordInput.isVisible()) {
        console.log('✅ 로그인 폼 발견');
        await page.screenshot({ 
          path: 'artifacts/2-login-form.png',
          fullPage: true 
        });

        // Step 3: Super Admin 로그인 시도
        console.log('📍 Step 3: Super Admin 로그인 시도 (01034424668 / admin1234)');
        
        await phoneInput.fill('01034424668');
        await passwordInput.fill('admin1234');
        
        await page.screenshot({ 
          path: 'artifacts/3-login-filled.png',
          fullPage: true 
        });
        
        await loginButton.click();
        
        // 로그인 후 페이지 전환 대기
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const afterLoginUrl = page.url();
        console.log(`   로그인 후 URL: ${afterLoginUrl}`);
        
        await page.screenshot({ 
          path: 'artifacts/4-after-login.png',
          fullPage: true 
        });

        // Step 4: 대시보드 접근 확인
        console.log('📍 Step 4: 대시보드 접근 확인');
        
        // 대시보드 요소 확인
        const dashboardElements = await page.locator('[class*="dashboard"], [id*="dashboard"], h1, h2').all();
        if (dashboardElements.length > 0) {
          console.log('✅ 대시보드 요소 발견');
          for (const element of dashboardElements.slice(0, 3)) {
            const text = await element.textContent();
            console.log(`   - ${text}`);
          }
        }

        // Step 5: 티타임 기능 접근 확인
        console.log('📍 Step 5: 티타임 기능 접근 확인');
        
        // 네비게이션 메뉴 확인
        const navLinks = await page.locator('nav a, a[href*="tee"], button:has-text("티타임")').all();
        if (navLinks.length > 0) {
          console.log(`✅ 네비게이션 링크 ${navLinks.length}개 발견`);
          
          for (const link of navLinks.slice(0, 5)) {
            const text = await link.textContent();
            const href = await link.getAttribute('href');
            console.log(`   - ${text} (${href})`);
          }
          
          // 티타임 페이지로 이동 시도
          const teeTimeLink = await page.locator('a[href*="tee-time"], a:has-text("티타임")').first();
          if (await teeTimeLink.isVisible()) {
            await teeTimeLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            console.log(`   티타임 페이지 URL: ${page.url()}`);
            await page.screenshot({ 
              path: 'artifacts/5-tee-times.png',
              fullPage: true 
            });
            console.log('✅ 티타임 페이지 접근 성공');
          }
        }

      } else {
        // 이미 로그인된 상태인지 확인
        console.log('⚠️ 로그인 폼을 찾을 수 없음 - 이미 로그인된 상태일 수 있음');
        
        // 현재 페이지 내용 확인
        const pageContent = await page.locator('body').textContent();
        console.log('   페이지 내용 일부:', pageContent?.substring(0, 200));
        
        await page.screenshot({ 
          path: 'artifacts/current-state.png',
          fullPage: true 
        });
      }

      // 페이지 상태 종합 분석
      console.log('\n📊 페이지 상태 종합 분석:');
      
      // 모든 링크 수집
      const allLinks = await page.locator('a').all();
      console.log(`   - 전체 링크 수: ${allLinks.length}`);
      
      // 폼 요소 확인
      const forms = await page.locator('form').all();
      console.log(`   - 폼 개수: ${forms.length}`);
      
      // 버튼 확인
      const buttons = await page.locator('button').all();
      console.log(`   - 버튼 개수: ${buttons.length}`);
      
      // 테이블 확인
      const tables = await page.locator('table').all();
      console.log(`   - 테이블 개수: ${tables.length}`);

      console.log('\n✅ 시스템 검증 완료');
      
    } catch (error) {
      console.error('❌ 검증 중 오류 발생:', error);
      await page.screenshot({ 
        path: 'artifacts/error-state.png',
        fullPage: true 
      });
      throw error;
    } finally {
      await browser.close();
    }
  });
});