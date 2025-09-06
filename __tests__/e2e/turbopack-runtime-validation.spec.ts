import { test, expect, type Page, chromium } from '@playwright/test';

// Test configuration
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3013';
const TEST_TIMEOUT = 60000; // 60 seconds

// Test accounts
const TEST_ACCOUNTS = {
  admin: {
    phone: '01000000000',
    password: 'admin'
  },
  superAdmin: {
    phone: '01034424668',
    password: 'admin1234'
  }
};

test.describe('Golf Reservation System - Turbopack Runtime Validation', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('Full system validation without Turbopack runtime errors', async ({ browser }) => {
    // Create a stealth browser context
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      deviceScaleFactor: 1,
      hasTouch: false,
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
      permissions: ['geolocation', 'notifications']
    });

    const page = await context.newPage();
    
    // Setup console and error monitoring
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    const turbopackErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        
        // Check specifically for Turbopack runtime errors
        if (text.includes('turbopack') || text.includes('[turbopack]_runtime.js') || text.includes('Cannot find module')) {
          turbopackErrors.push(`[TURBOPACK ERROR] ${text}`);
        }
      }
    });

    page.on('pageerror', error => {
      const errorMsg = error.toString();
      consoleErrors.push(errorMsg);
      
      if (errorMsg.includes('turbopack') || errorMsg.includes('[turbopack]_runtime.js')) {
        turbopackErrors.push(`[PAGE ERROR] ${errorMsg}`);
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        const url = response.url();
        networkErrors.push(`${response.status()} - ${url}`);
        
        // Check for turbopack-related failed requests
        if (url.includes('turbopack') || url.includes('_runtime.js')) {
          turbopackErrors.push(`[NETWORK ERROR] ${response.status()} - ${url}`);
        }
      }
    });

    try {
      console.log('🚀 Starting Golf Reservation System validation...');
      console.log(`📍 Target URL: ${TARGET_URL}`);
      
      // Step 1: Navigate to home page
      console.log('\n📋 Step 1: Loading application...');
      const homeResponse = await page.goto(TARGET_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Validate home page loaded successfully
      expect(homeResponse?.status()).toBeLessThan(400);
      console.log(`✅ Home page loaded with status: ${homeResponse?.status()}`);
      
      // Take screenshot of initial load
      await page.screenshot({ 
        path: 'artifacts/test-results/01-home-page.png',
        fullPage: true 
      });
      
      // Check for any Turbopack errors on initial load
      expect(turbopackErrors.length, `Turbopack errors found on initial load: ${turbopackErrors.join(', ')}`).toBe(0);
      
      // Wait for any redirects or client-side navigation
      await page.waitForTimeout(2000);
      
      // Step 2: Check if we're on login page or dashboard
      const currentUrl = page.url();
      console.log(`\n📋 Step 2: Current URL: ${currentUrl}`);
      
      // Check page title and content
      const pageTitle = await page.title();
      console.log(`📄 Page title: ${pageTitle}`);
      
      // Step 3: If on login page, attempt login
      if (currentUrl.includes('/login') || await page.locator('input[type="tel"]').isVisible()) {
        console.log('\n📋 Step 3: Login page detected, attempting authentication...');
        
        // Fill login form
        const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="연락처"], input[placeholder*="전화"]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="비밀번호"]').first();
        
        if (await phoneInput.isVisible() && await passwordInput.isVisible()) {
          await phoneInput.fill(TEST_ACCOUNTS.admin.phone);
          await passwordInput.fill(TEST_ACCOUNTS.admin.password);
          
          // Take screenshot before login
          await page.screenshot({ 
            path: 'artifacts/test-results/02-login-form-filled.png',
            fullPage: true 
          });
          
          // Submit login form
          const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
          await submitButton.click();
          
          // Wait for navigation after login
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          console.log('✅ Login attempted successfully');
          
          // Check for Turbopack errors after login
          expect(turbopackErrors.length, `Turbopack errors found after login: ${turbopackErrors.join(', ')}`).toBe(0);
        }
      }
      
      // Step 4: Validate dashboard/main page
      console.log('\n📋 Step 4: Validating main application page...');
      const dashboardUrl = page.url();
      console.log(`📍 Current page: ${dashboardUrl}`);
      
      // Take screenshot of dashboard
      await page.screenshot({ 
        path: 'artifacts/test-results/03-dashboard.png',
        fullPage: true 
      });
      
      // Check for common error indicators
      const errorTexts = ['500', '403', '401', '404', 'Error', 'Cannot find module', 'turbopack'];
      for (const errorText of errorTexts) {
        const errorElement = page.locator(`text=${errorText}`).first();
        if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.warn(`⚠️ Potential error indicator found: "${errorText}"`);
        }
      }
      
      // Step 5: Test navigation to Matrix View
      console.log('\n📋 Step 5: Testing Matrix View navigation...');
      
      // Look for tee-time or matrix view link
      const matrixLinks = [
        'a:has-text("티타임")',
        'a[href*="tee-time"]',
        'button:has-text("티타임")',
        'a:has-text("Matrix")',
        'a[href="/tee-times"]'
      ];
      
      let matrixLinkFound = false;
      for (const selector of matrixLinks) {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
          await link.click();
          matrixLinkFound = true;
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          console.log('✅ Navigated to Matrix View');
          break;
        }
      }
      
      if (matrixLinkFound) {
        // Take screenshot of matrix view
        await page.screenshot({ 
          path: 'artifacts/test-results/04-matrix-view.png',
          fullPage: true 
        });
        
        // Check for Turbopack errors in matrix view
        expect(turbopackErrors.length, `Turbopack errors found in Matrix View: ${turbopackErrors.join(', ')}`).toBe(0);
      }
      
      // Step 6: Check for data loading
      console.log('\n📋 Step 6: Checking data loading...');
      
      // Wait for potential data tables or lists
      const dataSelectors = [
        'table',
        '[role="table"]',
        '.matrix-table',
        '.tee-time-list',
        '[data-testid*="table"]'
      ];
      
      for (const selector of dataSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✅ Data element found: ${selector}`);
          break;
        }
      }
      
      // Final validation
      console.log('\n📊 Final Validation Results:');
      console.log(`  - Console errors: ${consoleErrors.length}`);
      console.log(`  - Network errors: ${networkErrors.length}`);
      console.log(`  - Turbopack errors: ${turbopackErrors.length}`);
      
      // Print any errors for debugging
      if (consoleErrors.length > 0) {
        console.log('\n⚠️ Console errors detected:');
        consoleErrors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (networkErrors.length > 0) {
        console.log('\n⚠️ Network errors detected:');
        networkErrors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (turbopackErrors.length > 0) {
        console.log('\n❌ TURBOPACK ERRORS DETECTED:');
        turbopackErrors.forEach(err => console.log(`  - ${err}`));
      }
      
      // Final screenshot
      await page.screenshot({ 
        path: 'artifacts/test-results/05-final-state.png',
        fullPage: true 
      });
      
      // Assert no Turbopack errors
      expect(turbopackErrors.length).toBe(0);
      
      // Assert no critical errors
      const criticalErrors = consoleErrors.filter(err => 
        err.includes('Cannot find module') || 
        err.includes('turbopack') ||
        err.includes('runtime.js')
      );
      expect(criticalErrors.length).toBe(0);
      
      console.log('\n✅ All validations passed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test failed with error:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'artifacts/test-results/error-state.png',
        fullPage: true 
      });
      
      // Save page HTML for debugging
      const html = await page.content();
      const fs = require('fs');
      fs.writeFileSync('artifacts/test-results/error-page.html', html);
      
      throw error;
    } finally {
      await context.close();
    }
  });

  test('Quick smoke test for Turbopack runtime', async ({ page }) => {
    console.log('\n🔥 Running quick smoke test...');
    
    // Monitor for specific Turbopack errors
    let turbopackError = null;
    
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('turbopack')) {
        turbopackError = msg.text();
      }
    });
    
    page.on('pageerror', error => {
      if (error.toString().includes('turbopack')) {
        turbopackError = error.toString();
      }
    });
    
    // Navigate to the app
    const response = await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Quick validation
    expect(response?.status()).toBeLessThan(500);
    expect(turbopackError).toBeNull();
    
    // Check page loads without critical errors
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log('✅ Quick smoke test passed');
  });
});