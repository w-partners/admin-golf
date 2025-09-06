const puppeteer = require('puppeteer');

async function checkDuplications() {
  console.log('=== TEXT DUPLICATION CHECK REPORT ===\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Set Korean locale
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'ko-KR' });
      Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
    });
    
    console.log('1. Navigating to http://localhost:3004...');
    await page.goto('http://localhost:3004', { 
      waitUntil: 'networkidle2',
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
    const phoneInput = await page.$('input[type="tel"]');
    
    if (phoneInput) {
      console.log('2. Login page detected, logging in...');
      
      // Login
      await page.type('input[type="tel"]', '01034424668');
      await page.type('input[type="password"]', 'admin1234');
      
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
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
    console.log('='.repeat(50));
    
    // Function to count text occurrences
    async function countTextOccurrences(searchText) {
      console.log(`\nSearching for: "${searchText}"`);
      console.log('-'.repeat(40));
      
      const result = await page.evaluate((text) => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const matches = [];
        let node;
        while (node = walker.nextNode()) {
          const content = node.textContent?.trim();
          if (content && content.includes(text)) {
            const element = node.parentElement;
            if (element) {
              matches.push({
                text: content,
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                // Get a simple path
                path: getPath(element)
              });
            }
          }
        }
        
        function getPath(element) {
          const parts = [];
          let current = element;
          while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
              selector += '#' + current.id;
            } else if (current.className) {
              selector += '.' + current.className.split(' ')[0];
            }
            parts.unshift(selector);
            current = current.parentElement;
          }
          return parts.join(' > ');
        }
        
        return matches;
      }, searchText);
      
      console.log(`Found: ${result.length} occurrence(s)`);
      
      if (result.length > 0) {
        console.log('\nLocations:');
        result.forEach((match, index) => {
          console.log(`  ${index + 1}. Tag: <${match.tagName.toLowerCase()}>`);
          if (match.className) {
            console.log(`     Class: ${match.className}`);
          }
          if (match.id) {
            console.log(`     ID: ${match.id}`);
          }
          console.log(`     Full text: "${match.text.substring(0, 100)}${match.text.length > 100 ? '...' : ''}"`);
          console.log(`     Path: ${match.path}`);
          console.log('');
        });
      }
      
      // Check if this is a duplication issue
      if (result.length > 1) {
        console.log(`⚠️  DUPLICATION DETECTED: "${searchText}" appears ${result.length} times!`);
      } else if (result.length === 1) {
        console.log(`✓ OK: "${searchText}" appears exactly once`);
      } else {
        console.log(`ℹ️  NOT FOUND: "${searchText}" does not appear on the page`);
      }
      
      return result.length;
    }
    
    // Check for specific texts
    const results = {};
    results['골프장 예약 관리'] = await countTextOccurrences('골프장 예약 관리');
    results['Golf Reservation System'] = await countTextOccurrences('Golf Reservation System');
    results['최고관리자'] = await countTextOccurrences('최고관리자');
    
    // Additional checks for common duplications
    console.log('\n' + '='.repeat(50));
    console.log('\n4. Checking for other potential duplications...\n');
    
    // Check for duplicate headers/titles
    const headerAnalysis = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, header'));
      const headerTexts = headers.map(h => ({
        tag: h.tagName.toLowerCase(),
        text: h.textContent?.trim() || '',
        className: h.className
      })).filter(h => h.text.length > 0);
      
      const counts = {};
      headerTexts.forEach(header => {
        if (!counts[header.text]) {
          counts[header.text] = [];
        }
        counts[header.text].push(header);
      });
      
      return { headers: headerTexts, counts };
    });
    
    console.log('Header elements found:');
    headerAnalysis.headers.forEach(header => {
      console.log(`  - <${header.tag}> "${header.text}" (class: ${header.className || 'none'})`);
    });
    
    console.log('\nHeader duplication analysis:');
    let hasDuplicateHeaders = false;
    Object.entries(headerAnalysis.counts).forEach(([text, headers]) => {
      if (headers.length > 1) {
        console.log(`  ⚠️  DUPLICATE: "${text}" appears ${headers.length} times in headers`);
        hasDuplicateHeaders = true;
      }
    });
    if (!hasDuplicateHeaders) {
      console.log('  ✓ No duplicate headers found');
    }
    
    // Check navigation items
    console.log('\n5. Checking navigation items...\n');
    const navAnalysis = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('nav a, nav button, [role="navigation"] a'));
      const navItems = navs.map(n => n.textContent?.trim() || '').filter(t => t.length > 0);
      
      const counts = {};
      navItems.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });
      
      return counts;
    });
    
    console.log('Navigation items:');
    Object.entries(navAnalysis).forEach(([text, count]) => {
      if (count > 1) {
        console.log(`  ⚠️  "${text}" appears ${count} times`);
      } else {
        console.log(`  - "${text}"`);
      }
    });
    
    // Visual highlight of duplicates
    console.log('\n6. Highlighting duplicates visually...\n');
    
    await page.evaluate(() => {
      // Remove any existing highlights
      document.querySelectorAll('.duplication-highlight').forEach(el => el.remove());
      
      // Highlight duplicates
      const textsToHighlight = ['골프장 예약 관리', 'Golf Reservation System', '최고관리자'];
      
      textsToHighlight.forEach(searchText => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
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
              element.style.position = 'relative';
              
              // Add label
              const label = document.createElement('div');
              label.className = 'duplication-highlight';
              label.style.position = 'absolute';
              label.style.backgroundColor = 'red';
              label.style.color = 'white';
              label.style.padding = '2px 5px';
              label.style.fontSize = '12px';
              label.style.zIndex = '10000';
              label.style.top = '0';
              label.style.left = '0';
              label.textContent = `Duplicate #${count}: ${searchText}`;
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
    console.log('='.repeat(50));
    console.log('\n=== SUMMARY ===\n');
    
    Object.entries(results).forEach(([text, count]) => {
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
    const pages = await browser.pages();
    if (pages.length > 0) {
      await pages[0].screenshot({ 
        path: 'duplication-check-error.png',
        fullPage: true 
      });
      console.log('Error screenshot saved as duplication-check-error.png');
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the check
checkDuplications().catch(console.error);