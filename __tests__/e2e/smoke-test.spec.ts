import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';

test.describe('Golf Reservation System - Smoke Test', () => {
  test('Application is accessible and login page works', async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    
    // Check if we're redirected to login or see the main page
    await page.waitForLoadState('networkidle');
    
    // Check for common elements that should exist
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check if login page elements exist
    const loginElements = await page.locator('input[name="phone"], input[name="password"]').count();
    
    if (loginElements > 0) {
      console.log('✅ Login page detected');
      
      // Try to login with test account
      await page.fill('input[name="phone"]', '01034424668');
      await page.fill('input[name="password"]', 'admin1234');
      
      const submitButton = await page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        console.log('✅ Login form submitted');
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        // Check if we logged in successfully
        const currentUrl = page.url();
        if (!currentUrl.includes('/login')) {
          console.log('✅ Login successful, redirected from login page');
        }
      }
    } else {
      console.log('⚠️ Login page not found, checking main application');
      
      // Check for main app elements
      const mainContent = await page.locator('main, [role="main"], .container').first();
      await expect(mainContent).toBeVisible({ timeout: 5000 });
      console.log('✅ Main application content found');
    }
    
    // Check that we don't have error pages
    const errorIndicators = await page.locator('text=/500|404|403|error|Error|에러/i').count();
    expect(errorIndicators).toBe(0);
    console.log('✅ No error pages detected');
  });
  
  test('Matrix view is accessible after login', async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[name="phone"]', '01034424668');
    await page.fill('input[name="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(3000);
    
    // Navigate to tee-times
    await page.goto(`${BASE_URL}/tee-times`);
    await page.waitForLoadState('networkidle');
    
    // Check for matrix view elements
    const tables = await page.locator('table').count();
    if (tables > 0) {
      console.log(`✅ Found ${tables} table(s) in matrix view`);
    }
    
    // Check for tabs
    const tabs = await page.locator('[role="tab"], button:has-text("부킹"), button:has-text("조인")').count();
    if (tabs > 0) {
      console.log(`✅ Found ${tabs} tab(s) in matrix view`);
    }
    
    // Check page doesn't show errors
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('404');
    console.log('✅ Matrix view loaded without errors');
  });
});