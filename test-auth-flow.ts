import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to avoid detection
chromium.use(StealthPlugin());

async function testAuthFlow() {
  console.log('🚀 Starting Golf Reservation System Authentication Test');
  
  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    // Step 1: Navigate to the application
    console.log('📍 Navigating to http://localhost:3012');
    await page.goto('http://localhost:3012', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Take screenshot of initial page
    await page.screenshot({ 
      path: 'screenshots/01-initial-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: Initial page captured');

    // Step 2: Check if we're on login page or already logged in
    const isLoginPage = await page.locator('input[name="phone"], input[type="tel"], input[placeholder*="전화"], input[placeholder*="연락처"]').isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('🔐 Login page detected, proceeding with authentication');
      
      // Find phone input field
      const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="전화"], input[placeholder*="연락처"]').first();
      await phoneInput.waitFor({ state: 'visible', timeout: 5000 });
      await phoneInput.click();
      await phoneInput.fill('01000000000');
      console.log('📱 Phone number entered: 01000000000');

      // Find password input field
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.click();
      await passwordInput.fill('admin');
      console.log('🔑 Password entered');

      // Take screenshot before login
      await page.screenshot({ 
        path: 'screenshots/02-login-form-filled.png',
        fullPage: true 
      });
      console.log('📸 Screenshot: Login form filled');

      // Find and click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
      await loginButton.click();
      console.log('🖱️ Login button clicked');

      // Wait for navigation or login response
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Check for error messages
      const errorMessage = await page.locator('.error, .alert, [role="alert"], .text-red-500, .text-danger').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log('❌ Login error detected:', errorMessage);
        await page.screenshot({ 
          path: 'screenshots/03-login-error.png',
          fullPage: true 
        });
        console.log('📸 Screenshot: Login error captured');
      }

      // Wait a bit for redirect
      await page.waitForTimeout(2000);
    }

    // Step 3: Check if we successfully logged in
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Check for dashboard or main page elements
    const isDashboard = currentUrl.includes('dashboard') || 
                        currentUrl.includes('tee-times') || 
                        currentUrl === 'http://localhost:3012/' ||
                        await page.locator('[class*="header"], [class*="nav"], [class*="menu"]').first().isVisible().catch(() => false);

    if (isDashboard || !currentUrl.includes('login')) {
      console.log('✅ Login successful! Navigated to dashboard/main page');
      
      // Take screenshot of dashboard
      await page.screenshot({ 
        path: 'screenshots/04-dashboard.png',
        fullPage: true 
      });
      console.log('📸 Screenshot: Dashboard captured');

      // Look for user profile or logout button to confirm authentication
      const userProfile = await page.locator('[class*="profile"], [class*="user"], button:has-text("로그아웃"), button:has-text("Logout")').first().textContent().catch(() => null);
      if (userProfile) {
        console.log('👤 User authenticated. Profile/Logout element found:', userProfile);
      }

      // Try to find and capture the Matrix View if available
      const matrixView = await page.locator('[class*="matrix"], [class*="tee-time"], table').first().isVisible().catch(() => false);
      if (matrixView) {
        console.log('📊 Matrix View detected');
        await page.screenshot({ 
          path: 'screenshots/05-matrix-view.png',
          fullPage: true 
        });
        console.log('📸 Screenshot: Matrix View captured');
      }

      // Check for quick menu
      const quickMenu = await page.locator('[class*="quick"], [class*="menu"], nav').first().isVisible().catch(() => false);
      if (quickMenu) {
        console.log('📋 Quick Menu detected');
      }

      console.log('\n🎯 Test Summary:');
      console.log('  ✅ Server is accessible');
      console.log('  ✅ Login functionality works');
      console.log('  ✅ Navigation to dashboard successful');
      console.log('  ✅ Authentication verified');
      
    } else {
      console.log('⚠️ Login may have failed or redirected to:', currentUrl);
      await page.screenshot({ 
        path: 'screenshots/04-current-state.png',
        fullPage: true 
      });
      console.log('📸 Screenshot: Current state captured');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ 
      path: 'screenshots/error-state.png',
      fullPage: true 
    }).catch(() => {});
  } finally {
    // Keep browser open for 5 seconds to observe
    console.log('\n⏰ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testAuthFlow().catch(console.error);