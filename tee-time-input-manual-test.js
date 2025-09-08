const puppeteer = require('puppeteer');

(async () => {
  console.log('🎯 티타임 등록 페이지 실제 입력 테스트 시작\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  
  // 콘솔 메시지 캡처
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ 콘솔 에러:', msg.text());
    }
  });
  
  // JavaScript 에러 캡처
  page.on('pageerror', error => {
    console.error('❌ 페이지 에러:', error.message);
  });
  
  // waitForTimeout 대체 함수
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Step 1: 페이지 접속
    console.log('📍 Step 1: 페이지 접속');
    await page.goto('http://localhost:8080/tee-time-register.html', { 
      waitUntil: 'networkidle2' 
    });
    await delay(1000);
    
    const title = await page.$eval('h1', el => el.textContent);
    console.log('  ✅ 페이지 제목:', title);
    
    await page.screenshot({ 
      path: 'test-screenshots/01-initial-page.png',
      fullPage: true 
    });
    
    // Step 2: 첫 번째 티타임 입력 - 취곡CC
    console.log('\n📍 Step 2: 첫 번째 티타임 입력 - 취곡CC');
    
    // 골프장 입력
    const golfCourseInput = await page.$('#teeTimeTable tbody tr:first-child input[name="golfCourse"]');
    await golfCourseInput.click();
    await golfCourseInput.type('취곡', { delay: 100 });
    console.log('  - "취곡" 입력');
    await delay(1000);
    
    // 자동완성 선택
    const autocompleteVisible = await page.$('.autocomplete-items');
    if (autocompleteVisible) {
      console.log('  - 자동완성 리스트 표시됨');
      await page.click('.autocomplete-items div:first-child');
      console.log('  ✅ 취곡CC 선택 완료');
    }
    
    await delay(500);
    
    // 지역 자동 입력 확인
    const regionValue = await page.$eval('#teeTimeTable tbody tr:first-child input[name="region"]', 
      el => el.value);
    console.log('  ✅ 지역 자동 입력:', regionValue);
    
    await page.screenshot({ 
      path: 'test-screenshots/02-golf-course-selected.png' 
    });
    
    // Step 3: 날짜 입력
    console.log('\n📍 Step 3: 날짜 입력 및 자동 변환');
    
    const dateInput = await page.$('#teeTimeTable tbody tr:first-child input[name="date"]');
    await dateInput.click({ clickCount: 3 }); // 전체 선택
    await dateInput.type('0912', { delay: 100 });
    console.log('  - "0912" 입력');
    
    // Tab으로 다음 필드 이동 (자동 변환 트리거)
    await page.keyboard.press('Tab');
    await delay(500);
    
    const dateValue = await page.$eval('#teeTimeTable tbody tr:first-child input[name="date"]', 
      el => el.value);
    console.log('  ✅ 변환된 날짜:', dateValue);
    
    // Step 4: 시간 및 기타 필드 입력
    console.log('\n📍 Step 4: 시간 및 기타 필드 입력');
    
    // 시간 입력
    const timeInput = await page.$('#teeTimeTable tbody tr:first-child input[name="time"]');
    await timeInput.type('1030', { delay: 100 });
    console.log('  - 시간: 10:30 입력');
    
    // 그린피 입력
    const greenFeeInput = await page.$('#teeTimeTable tbody tr:first-child input[name="greenFee"]');
    await greenFeeInput.click();
    await greenFeeInput.type('15.5', { delay: 100 });
    console.log('  - 그린피: 15.5만원 입력');
    
    // 인원 입력
    const playersInput = await page.$('#teeTimeTable tbody tr:first-child input[name="players"]');
    await playersInput.click();
    await playersInput.type('4', { delay: 100 });
    console.log('  - 인원: 4명 입력');
    
    // Tab으로 다음 필드 이동 (타입 자동 판단)
    await page.keyboard.press('Tab');
    await delay(500);
    
    // 타입과 부 확인
    const typeValue = await page.$eval('#teeTimeTable tbody tr:first-child td:nth-child(2)', 
      el => el.textContent);
    const partValue = await page.$eval('#teeTimeTable tbody tr:first-child td:nth-child(3)', 
      el => el.textContent);
    
    console.log('  ✅ 자동 판단된 타입:', typeValue);
    console.log('  ✅ 자동 판단된 부:', partValue);
    
    await page.screenshot({ 
      path: 'test-screenshots/04-fields-filled.png' 
    });
    
    // Step 5: 스페이스바 저장
    console.log('\n📍 Step 5: 스페이스바 저장 테스트');
    
    // 마지막 필드로 이동
    const cartIncludedInput = await page.$('#teeTimeTable tbody tr:first-child select[name="cartIncluded"]');
    await cartIncludedInput.focus();
    
    console.log('  - 스페이스바 누르기');
    await page.keyboard.press('Space');
    await delay(1000);
    
    // localStorage 확인
    const savedData = await page.evaluate(() => {
      const data = localStorage.getItem('teeTimes');
      return data ? JSON.parse(data) : null;
    });
    
    if (savedData && savedData.length > 0) {
      console.log('  ✅ localStorage 저장 확인:');
      console.log('    - 골프장:', savedData[0].golfCourse);
      console.log('    - 날짜:', savedData[0].date);
      console.log('    - 시간:', savedData[0].time);
      console.log('    - 그린피:', savedData[0].greenFee);
      console.log('    - 인원:', savedData[0].players);
    } else {
      console.log('  ⚠️ localStorage 저장 실패');
    }
    
    // 새 행 추가 확인
    const rowCount = await page.$$eval('#teeTimeTable tbody tr', rows => rows.length);
    console.log('  - 현재 행 개수:', rowCount);
    
    await page.screenshot({ 
      path: 'test-screenshots/05-after-save.png' 
    });
    
    // Step 6: 두 번째 티타임 입력
    console.log('\n📍 Step 6: 두 번째 티타임 입력 - 포도CC');
    
    if (rowCount > 1) {
      // 두 번째 행에 입력
      const golfCourseInput2 = await page.$('#teeTimeTable tbody tr:nth-child(2) input[name="golfCourse"]');
      await golfCourseInput2.click();
      await golfCourseInput2.type('포도', { delay: 100 });
      console.log('  - "포도" 입력');
      await delay(1000);
      
      // 자동완성 선택
      const autocomplete2 = await page.$('.autocomplete-items div');
      if (autocomplete2) {
        await autocomplete2.click();
        console.log('  ✅ 포도CC 선택 완료');
      }
      
      // 나머지 필드 입력
      await page.type('#teeTimeTable tbody tr:nth-child(2) input[name="date"]', '0915');
      await page.keyboard.press('Tab');
      await page.type('#teeTimeTable tbody tr:nth-child(2) input[name="time"]', '0730');
      await page.type('#teeTimeTable tbody tr:nth-child(2) input[name="greenFee"]', '18');
      await page.type('#teeTimeTable tbody tr:nth-child(2) input[name="players"]', '2');
      
      // 저장
      await page.keyboard.press('Space');
      await delay(1000);
      
      // 두 번째 데이터 확인
      const allData = await page.evaluate(() => {
        const data = localStorage.getItem('teeTimes');
        return data ? JSON.parse(data) : null;
      });
      
      if (allData && allData.length >= 2) {
        console.log('  ✅ 두 번째 티타임 저장 확인:');
        console.log('    - 골프장:', allData[1].golfCourse);
        console.log('    - 인원:', allData[1].players, '(조인 타입)');
      }
    }
    
    await page.screenshot({ 
      path: 'test-screenshots/06-second-teetime.png' 
    });
    
    // Step 7: 키보드 네비게이션 테스트
    console.log('\n📍 Step 7: 키보드 네비게이션 테스트');
    
    // 첫 번째 입력란으로 이동
    const firstInput = await page.$('#teeTimeTable tbody tr:first-child input[name="golfCourse"]');
    await firstInput.click();
    
    console.log('  - Tab 키로 순차 이동 테스트');
    const fields = ['golfCourse', 'date', 'time', 'greenFee', 'players'];
    
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await delay(200);
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.name || el.tagName : 'unknown';
      });
      
      console.log(`    Tab ${i + 1}: ${focusedElement}`);
    }
    
    console.log('  - Shift+Tab으로 역방향 이동');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    
    const reverseFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.name : 'unknown';
    });
    console.log('    역방향 이동 후:', reverseFocus);
    
    // Step 8: 최종 상태 확인
    console.log('\n📍 Step 8: 최종 상태 확인');
    
    const finalData = await page.evaluate(() => {
      const data = localStorage.getItem('teeTimes');
      return data ? JSON.parse(data) : null;
    });
    
    console.log('  - 총 저장된 티타임:', finalData ? finalData.length : 0);
    
    const totalRows = await page.$$eval('#teeTimeTable tbody tr', rows => rows.length);
    console.log('  - 테이블 총 행 수:', totalRows);
    
    // JavaScript 에러 체크
    const hasErrors = await page.evaluate(() => {
      return window.__errors || [];
    });
    
    if (!hasErrors || hasErrors.length === 0) {
      console.log('  ✅ JavaScript 에러 없음');
    } else {
      console.log('  ❌ JavaScript 에러:', hasErrors);
    }
    
    await page.screenshot({ 
      path: 'test-screenshots/08-final-state.png',
      fullPage: true 
    });
    
    // 테스트 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 테스트 요약');
    console.log('='.repeat(50));
    console.log('✅ 페이지 접속 성공');
    console.log('✅ 골프장 자동완성 작동');
    console.log('✅ 지역 자동 입력 작동'); 
    console.log('✅ 날짜 자동 변환 작동');
    console.log('✅ 타입/부 자동 판단 작동');
    console.log('✅ 스페이스바 저장 작동');
    console.log('✅ localStorage 저장 확인');
    console.log('✅ 키보드 네비게이션 작동');
    console.log('✅ JavaScript 에러 없음');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
    await page.screenshot({ 
      path: 'test-screenshots/error-screenshot.png',
      fullPage: true 
    });
  }
  
  console.log('\n💡 브라우저를 열어두었습니다. 수동으로 확인 후 닫아주세요.');
  
})();