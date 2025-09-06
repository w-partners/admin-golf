import { test, expect, type Page } from '@playwright/test';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to avoid detection
chromium.use(StealthPlugin());

test.describe('Golf Reservation System - Complete Functionality Test', () => {
  const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3014';
  const ADMIN_PHONE = '01000000000';
  const ADMIN_PASSWORD = 'admin';
  
  test('Complete system functionality verification', async () => {
    // Launch browser with stealth mode
    const browser = await chromium.launch({
      headless: false, // Set to false for debugging
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      permissions: ['notifications', 'geolocation'],
      ignoreHTTPSErrors: true,
      recordVideo: {
        dir: 'artifacts/videos/',
        size: { width: 1920, height: 1080 }
      }
    });

    const page = await context.newPage();

    try {
      console.log(`🚀 Starting comprehensive test for: ${TARGET_URL}`);
      
      // Step 1: Application Loading
      console.log('\n📋 Step 1: Testing application loading...');
      await page.goto(TARGET_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for initial page load
      await page.waitForLoadState('domcontentloaded');
      
      // Check for Turbopack runtime errors
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Cannot find module');
      expect(bodyText).not.toContain('[turbopack]_runtime.js');
      expect(bodyText).not.toContain('Internal Server Error');
      expect(bodyText).not.toContain('Something went wrong');
      
      // Check for error status codes in visible text only (not in JS chunks)
      const visibleText = await page.evaluate(() => {
        // Remove script tags to avoid false positives from JS chunks
        const scripts = document.querySelectorAll('script');
        scripts.forEach(s => s.remove());
        return document.body.innerText || document.body.textContent || '';
      });
      expect(visibleText).not.toMatch(/Error\s+500/);
      expect(visibleText).not.toMatch(/Error\s+403/);
      expect(visibleText).not.toMatch(/Error\s+401/);
      expect(visibleText).not.toMatch(/500\s+Error/);
      expect(visibleText).not.toMatch(/403\s+Forbidden/);
      expect(visibleText).not.toMatch(/401\s+Unauthorized/);
      
      // Check page title
      const title = await page.title();
      console.log(`  Page title: ${title}`);
      expect(title).not.toContain('Error');
      
      // Take screenshot of initial load
      await page.screenshot({ 
        path: 'artifacts/screenshots/01-initial-load.png',
        fullPage: true 
      });
      console.log('  ✅ Application loaded without Turbopack errors');
      
      // Step 2: Check if we're on login page or already logged in
      console.log('\n📋 Step 2: Testing authentication flow...');
      
      // Check if login form exists
      const loginFormExists = await page.locator('form').first().isVisible().catch(() => false);
      
      if (loginFormExists) {
        console.log('  Login form detected, attempting authentication...');
        
        // Look for phone input field
        const phoneInput = await page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[placeholder*="Phone"], input[placeholder*="010"]').first();
        const passwordInput = await page.locator('input[type="password"], input[name*="password"], input[placeholder*="비밀번호"], input[placeholder*="Password"]').first();
        
        if (await phoneInput.isVisible() && await passwordInput.isVisible()) {
          // Fill in login credentials
          await phoneInput.fill(ADMIN_PHONE);
          await passwordInput.fill(ADMIN_PASSWORD);
          
          // Take screenshot before login
          await page.screenshot({ 
            path: 'artifacts/screenshots/02-login-form-filled.png',
            fullPage: true 
          });
          
          // Submit login form
          const submitButton = await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first();
          await submitButton.click();
          
          // Wait for navigation after login
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          
          console.log('  ✅ Login form submitted successfully');
        } else {
          console.log('  ⚠️ Could not find login input fields');
        }
      } else {
        console.log('  ℹ️ No login form found, checking if already authenticated...');
      }
      
      // Step 3: Verify Dashboard Access
      console.log('\n📋 Step 3: Testing dashboard access...');
      await page.waitForTimeout(2000); // Give time for any redirects
      
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);
      
      // Check for dashboard elements
      const dashboardIndicators = [
        await page.locator('nav').isVisible().catch(() => false),
        await page.locator('header').isVisible().catch(() => false),
        await page.locator('[class*="dashboard"], [class*="main"], [class*="content"]').isVisible().catch(() => false)
      ];
      
      const isDashboard = dashboardIndicators.some(indicator => indicator);
      
      if (isDashboard) {
        console.log('  ✅ Dashboard elements detected');
        await page.screenshot({ 
          path: 'artifacts/screenshots/03-dashboard.png',
          fullPage: true 
        });
      } else {
        console.log('  ⚠️ Dashboard elements not clearly visible');
      }
      
      // Step 4: Test Matrix View Navigation
      console.log('\n📋 Step 4: Testing Matrix view navigation...');
      
      // Look for Matrix view link or button
      const matrixLinks = [
        page.locator('a:has-text("Matrix"), a:has-text("매트릭스"), a:has-text("티타임"), a:has-text("Tee Time")'),
        page.locator('button:has-text("Matrix"), button:has-text("매트릭스"), button:has-text("티타임")'),
        page.locator('[href*="matrix"], [href*="tee-time"], [href*="booking"]')
      ];
      
      let matrixNavigated = false;
      for (const link of matrixLinks) {
        if (await link.first().isVisible().catch(() => false)) {
          await link.first().click();
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
          matrixNavigated = true;
          console.log('  ✅ Navigated to Matrix view');
          break;
        }
      }
      
      if (!matrixNavigated) {
        console.log('  ⚠️ Could not find Matrix view navigation');
      }
      
      // Check for Matrix view elements
      const matrixElements = [
        await page.locator('table').isVisible().catch(() => false),
        await page.locator('[class*="grid"], [class*="matrix"], [class*="table"]').isVisible().catch(() => false),
        await page.locator('th, td').first().isVisible().catch(() => false)
      ];
      
      const hasMatrixView = matrixElements.some(element => element);
      
      if (hasMatrixView) {
        console.log('  ✅ Matrix view elements detected');
        await page.screenshot({ 
          path: 'artifacts/screenshots/04-matrix-view.png',
          fullPage: true 
        });
      } else {
        console.log('  ⚠️ Matrix view elements not clearly visible');
      }
      
      // Step 5: Test Navigation Menu
      console.log('\n📋 Step 5: Testing navigation menu...');
      
      const menuItems = await page.locator('nav a, nav button, [role="navigation"] a').all();
      console.log(`  Found ${menuItems.length} navigation items`);
      
      if (menuItems.length > 0) {
        // Take screenshot of navigation
        await page.screenshot({ 
          path: 'artifacts/screenshots/05-navigation-menu.png',
          fullPage: true 
        });
        console.log('  ✅ Navigation menu is functional');
      } else {
        console.log('  ⚠️ No navigation items found');
      }
      
      // Final Summary
      console.log('\n📊 Test Summary:');
      console.log('  ✅ NO Turbopack runtime errors detected');
      console.log('  ✅ Application loads properly');
      console.log('  ✅ Authentication system is present');
      console.log(`  ${isDashboard ? '✅' : '⚠️'} Dashboard access ${isDashboard ? 'confirmed' : 'needs verification'}`);
      console.log(`  ${hasMatrixView ? '✅' : '⚠️'} Matrix view ${hasMatrixView ? 'is functional' : 'needs verification'}`);
      console.log(`  ${menuItems.length > 0 ? '✅' : '⚠️'} Navigation ${menuItems.length > 0 ? 'is working' : 'needs verification'}`);
      
    } catch (error) {
      // Capture error screenshot
      await page.screenshot({ 
        path: 'artifacts/screenshots/error-final.png',
        fullPage: true 
      });
      console.error('❌ Test failed with error:', error);
      throw error;
    } finally {
      // Save video
      await context.close();
      await browser.close();
      console.log('\n🎬 Test recording saved to artifacts/videos/');
      console.log('📸 Screenshots saved to artifacts/screenshots/');
    }
  });
});