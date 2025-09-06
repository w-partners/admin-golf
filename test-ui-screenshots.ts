import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:3011';
const TEST_ACCOUNT = { phone: '01000000000', password: 'admin' };

async function captureScreenshots() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📸 Starting screenshot capture for Golf Reservation System');
    
    // 1. Navigate to homepage
    console.log('1. Navigating to homepage...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ 
      path: 'golf-ui-01-homepage.png',
      fullPage: true 
    });
    console.log('✅ Homepage screenshot saved');
    
    // 2. Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('2. Login page detected, performing login...');
      
      // Fill login form
      await page.fill('input[type="tel"], input[name="phone"]', TEST_ACCOUNT.phone);
      await page.fill('input[type="password"]', TEST_ACCOUNT.password);
      
      await page.screenshot({ 
        path: 'golf-ui-02-login-filled.png',
        fullPage: true 
      });
      
      // Click login
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'golf-ui-03-after-login.png',
        fullPage: true 
      });
      console.log('✅ Login completed and screenshot saved');
    }
    
    // 3. Navigate to tee-times
    console.log('3. Navigating to tee-times...');
    const teeTimesUrl = `${TEST_URL}/tee-times`;
    await page.goto(teeTimesUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any animations
    
    await page.screenshot({ 
      path: 'golf-ui-04-teetimes-matrix.png',
      fullPage: true 
    });
    console.log('✅ Tee-times matrix screenshot saved');
    
    // 4. Check for tabs and click if available
    const tabs = ['데일리부킹', '데일리조인', '패키지부킹', '패키지조인'];
    let tabIndex = 5;
    
    for (const tabName of tabs) {
      const tabSelector = `button:has-text("${tabName}"), div[role="tab"]:has-text("${tabName}")`;
      const tabElement = page.locator(tabSelector).first();
      
      if (await tabElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`4.${tabIndex - 4}. Clicking tab: ${tabName}`);
        await tabElement.click();
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
          path: `golf-ui-0${tabIndex}-tab-${tabName.replace(/[^a-zA-Z0-9]/g, '')}.png`,
          fullPage: true 
        });
        console.log(`✅ ${tabName} tab screenshot saved`);
        tabIndex++;
      }
    }
    
    // 5. Check if there's a table with golf course data
    console.log('5. Checking for golf course data...');
    const tableVisible = await page.locator('table, div[role="table"]').isVisible({ timeout: 1000 }).catch(() => false);
    
    if (tableVisible) {
      // Zoom in on the table area
      const tableElement = page.locator('table, div[role="table"]').first();
      const boundingBox = await tableElement.boundingBox();
      
      if (boundingBox) {
        await page.screenshot({ 
          path: 'golf-ui-table-closeup.png',
          clip: {
            x: Math.max(0, boundingBox.x - 20),
            y: Math.max(0, boundingBox.y - 20),
            width: Math.min(1920, boundingBox.width + 40),
            height: Math.min(1080, boundingBox.height + 40)
          }
        });
        console.log('✅ Table closeup screenshot saved');
      }
    }
    
    // 6. Final full page screenshot
    console.log('6. Capturing final full page screenshot...');
    await page.screenshot({ 
      path: 'golf-ui-final-fullpage.png',
      fullPage: true 
    });
    console.log('✅ Final screenshot saved');
    
    console.log('\n🎉 All screenshots captured successfully!');
    console.log('📁 Screenshots saved in the current directory');
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
captureScreenshots().catch(console.error);