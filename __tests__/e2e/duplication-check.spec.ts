import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Text Duplication Verification', () => {
  test('Check for duplicate text elements in UI', async () => {
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    });

    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    
    console.log('=== TEXT DUPLICATION CHECK REPORT ===\n');
    
    try {
      // Navigate to the application
      console.log('1. Navigating to http://localhost:3004...');
      await page.goto('http://localhost:3004', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Take initial screenshot
      await page.screenshot({ 
        path: 'duplication-check-initial.png',
        fullPage: true 
      });
      console.log('✓ Initial screenshot saved as duplication-check-initial.png\n');

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);

      // Check if we're on login page
      const isLoginPage = await page.locator('input[type="tel"]').isVisible().catch(() => false);
      
      if (isLoginPage) {
        console.log('2. Login page detected, logging in...');
        
        // Login
        await page.fill('input[type="tel"]', '01034424668');
        await page.fill('input[type="password"]', 'admin1234');
        
        await page.click('button[type="submit"]');
        
        // Wait for navigation after login
        await page.waitForURL('**/tee-times', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(3000);
        
        console.log('✓ Logged in successfully\n');
        
        // Take post-login screenshot
        await page.screenshot({ 
          path: 'duplication-check-logged-in.png',
          fullPage: true 
        });
        console.log('✓ Post-login screenshot saved\n');
      }

      console.log('3. Analyzing text duplications...\n');
      console.log('=' * 50);
      
      // Function to count text occurrences with detailed reporting
      async function countTextOccurrences(searchText: string): Promise<void> {
        console.log(`\nSearching for: "${searchText}"`);
        console.log('-' * 40);
        
        // Get all text content from the page
        const allTextContent = await page.evaluate(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent?.trim();
            if (text && text.length > 0) {
              const element = node.parentElement;
              if (element) {
                textNodes.push({
                  text: text,
                  tagName: element.tagName,
                  className: element.className,
                  id: element.id,
                  xpath: getXPath(element)
                });
              }
            }
          }
          
          function getXPath(element: Element): string {
            if (element.id !== '') {
              return `//*[@id="${element.id}"]`;
            }
            if (element === document.body) {
              return '/html/body';
            }
            
            let ix = 0;
            const siblings = element.parentNode?.childNodes || [];
            for (let i = 0; i < siblings.length; i++) {
              const sibling = siblings[i];
              if (sibling === element) {
                return getXPath(element.parentElement as Element) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
              }
              if (sibling.nodeType === 1 && (sibling as Element).tagName === element.tagName) {
                ix++;
              }
            }
            return '';
          }
          
          return textNodes;
        });
        
        // Count exact matches
        const matches = allTextContent.filter(node => 
          node.text.includes(searchText)
        );
        
        console.log(`Found: ${matches.length} occurrence(s)`);
        
        if (matches.length > 0) {
          console.log('\nLocations:');
          matches.forEach((match, index) => {
            console.log(`  ${index + 1}. Tag: <${match.tagName.toLowerCase()}>`);
            if (match.className) {
              console.log(`     Class: ${match.className}`);
            }
            if (match.id) {
              console.log(`     ID: ${match.id}`);
            }
            console.log(`     Full text: "${match.text.substring(0, 100)}${match.text.length > 100 ? '...' : ''}"`);
            console.log(`     XPath: ${match.xpath}`);
            console.log('');
          });
        }
        
        // Check if this is a duplication issue
        if (matches.length > 1) {
          console.log(`⚠️  DUPLICATION DETECTED: "${searchText}" appears ${matches.length} times!`);
        } else if (matches.length === 1) {
          console.log(`✓ OK: "${searchText}" appears exactly once`);
        } else {
          console.log(`ℹ️  NOT FOUND: "${searchText}" does not appear on the page`);
        }
      }
      
      // Check for specific texts
      await countTextOccurrences('골프장 예약 관리');
      await countTextOccurrences('Golf Reservation System');
      await countTextOccurrences('최고관리자');
      
      // Additional checks for common duplications
      console.log('\n' + '=' * 50);
      console.log('\n4. Checking for other potential duplications...\n');
      
      // Check for duplicate headers/titles
      const headerTexts = await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('h1, h2, h3, header'));
        return headers.map(h => ({
          tag: h.tagName.toLowerCase(),
          text: h.textContent?.trim() || '',
          className: h.className
        })).filter(h => h.text.length > 0);
      });
      
      console.log('Header elements found:');
      const headerCounts = new Map<string, number>();
      headerTexts.forEach(header => {
        const key = header.text;
        headerCounts.set(key, (headerCounts.get(key) || 0) + 1);
        console.log(`  - <${header.tag}> "${header.text}" (class: ${header.className || 'none'})`);
      });
      
      console.log('\nHeader duplication analysis:');
      let hasDuplicateHeaders = false;
      headerCounts.forEach((count, text) => {
        if (count > 1) {
          console.log(`  ⚠️  DUPLICATE: "${text}" appears ${count} times in headers`);
          hasDuplicateHeaders = true;
        }
      });
      if (!hasDuplicateHeaders) {
        console.log('  ✓ No duplicate headers found');
      }
      
      // Check navigation items
      console.log('\n5. Checking navigation items...\n');
      const navItems = await page.evaluate(() => {
        const navs = Array.from(document.querySelectorAll('nav a, nav button, [role="navigation"] a'));
        return navs.map(n => n.textContent?.trim() || '').filter(t => t.length > 0);
      });
      
      const navCounts = new Map<string, number>();
      navItems.forEach(item => {
        navCounts.set(item, (navCounts.get(item) || 0) + 1);
      });
      
      console.log('Navigation items:');
      navCounts.forEach((count, text) => {
        if (count > 1) {
          console.log(`  ⚠️  "${text}" appears ${count} times`);
        } else {
          console.log(`  - "${text}"`);
        }
      });
      
      // Visual highlight of duplicates
      console.log('\n6. Highlighting duplicates visually...\n');
      
      await page.evaluate(() => {
        // Highlight duplicates
        const textsToHighlight = ['골프장 예약 관리', 'Golf Reservation System', '최고관리자'];
        
        textsToHighlight.forEach(searchText => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          let count = 0;
          while (node = walker.nextNode()) {
            if (node.textContent?.includes(searchText)) {
              count++;
              const element = node.parentElement;
              if (element) {
                element.style.border = '3px solid red';
                element.style.backgroundColor = 'yellow';
                
                // Add label
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.backgroundColor = 'red';
                label.style.color = 'white';
                label.style.padding = '2px 5px';
                label.style.fontSize = '12px';
                label.style.zIndex = '10000';
                label.textContent = `Duplicate #${count}: ${searchText}`;
                element.style.position = 'relative';
                element.appendChild(label);
              }
            }
          }
        });
      });
      
      // Take final screenshot with highlights
      await page.screenshot({ 
        path: 'duplication-check-highlighted.png',
        fullPage: true 
      });
      console.log('✓ Screenshot with highlighted duplicates saved as duplication-check-highlighted.png\n');
      
      // Final summary
      console.log('=' * 50);
      console.log('\n=== SUMMARY ===\n');
      
      const summary = await page.evaluate(() => {
        const counts: Record<string, number> = {};
        const searchTexts = ['골프장 예약 관리', 'Golf Reservation System', '최고관리자'];
        
        searchTexts.forEach(searchText => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let count = 0;
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent?.includes(searchText)) {
              count++;
            }
          }
          counts[searchText] = count;
        });
        
        return counts;
      });
      
      Object.entries(summary).forEach(([text, count]) => {
        const status = count === 1 ? '✓ OK' : count === 0 ? 'ℹ️  NOT FOUND' : '⚠️  DUPLICATION';
        console.log(`${status}: "${text}" - ${count} occurrence(s)`);
      });
      
      console.log('\n✓ Duplication check completed!');
      console.log('Screenshots saved:');
      console.log('  - duplication-check-initial.png');
      console.log('  - duplication-check-logged-in.png');
      console.log('  - duplication-check-highlighted.png');
      
    } catch (error) {
      console.error('Error during test:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'duplication-check-error.png',
        fullPage: true 
      });
      console.log('Error screenshot saved as duplication-check-error.png');
      
      throw error;
    } finally {
      await browser.close();
    }
  });
});