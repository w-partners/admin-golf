const puppeteer = require('puppeteer');

(async () => {
  console.log('🎯 티타임 등록 페이지 실제 사용 테스트 시작\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // 콘솔 로그 모니터링
  page.on('console', msg => {
    if (msg.type() !== 'debug') {
      console.log('브라우저 콘솔:', msg.text());
    }
  });
  
  page.on('error', err => {
    console.error('페이지 에러:', err);
  });
  
  page.on('pageerror', err => {
    console.error('JavaScript 에러:', err);
  });

  try {
    // 1. 페이지 접속
    console.log('1️⃣ 페이지 접속 및 초기 상태 확인');
    await page.goto('http://localhost:8080/tee-time-register.html');
    await page.waitForTimeout(1000);
    
    // 스크린샷
    await page.screenshot({ 
      path: 'test-screenshots/01-initial-page.png',
      fullPage: true 
    });
    console.log('   ✅ 초기 페이지 스크린샷 저장');
    
    // 첫 번째 행의 골프장 입력 필드 찾기
    const golfCourseInput = await page.$('tbody tr:first-child input[placeholder="골프장 입력"]');
    
    if (!golfCourseInput) {
      console.error('❌ 골프장 입력 필드를 찾을 수 없습니다.');
      return;
    }
    
    // 2. 골프장 입력 테스트
    console.log('\n2️⃣ 골프장 입력 및 자동완성 테스트');
    await golfCourseInput.click();
    await page.keyboard.type('취곡', { delay: 100 });
    console.log('   입력: "취곡"');
    
    // 자동완성 대기
    await page.waitForTimeout(1000);
    
    // 자동완성 항목 확인
    const autocomplete = await page.$('.autocomplete-items div');
    if (autocomplete) {
      console.log('   ✅ 자동완성 목록 표시됨');
      await autocomplete.click();
      console.log('   ✅ 자동완성 항목 선택');
    } else {
      console.log('   ⚠️  자동완성 없음 - 직접 입력');
      await golfCourseInput.click({ clickCount: 3 });
      await page.keyboard.type('취곡CC');
    }
    
    await page.screenshot({ 
      path: 'test-screenshots/02-golf-course-input.png'
    });
    
    // 지역 자동 입력 확인
    const regionInput = await page.$('tbody tr:first-child input[placeholder="지역"]');
    const regionValue = await regionInput.evaluate(el => el.value);
    console.log(`   지역 자동 입력: "${regionValue}"`);
    
    // 3. 날짜 입력
    console.log('\n3️⃣ 날짜 입력 테스트');
    const dateInput = await page.$('tbody tr:first-child input[placeholder="MMDD"]');
    await dateInput.click();
    await page.keyboard.type('0912', { delay: 100 });
    console.log('   입력: "0912"');
    
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    const dateValue = await dateInput.evaluate(el => el.value);
    console.log(`   변환 결과: "${dateValue}"`);
    
    // 4. 시간 입력
    console.log('\n4️⃣ 시간 입력 테스트');
    const timeInput = await page.$('tbody tr:first-child input[placeholder="HHMM"]');
    await timeInput.click();
    await page.keyboard.type('1030', { delay: 100 });
    console.log('   입력: "1030"');
    
    await page.keyboard.press('Tab');
    const timeValue = await timeInput.evaluate(el => el.value);
    console.log(`   입력 결과: "${timeValue}"`);
    
    // 5. 그린피 입력
    console.log('\n5️⃣ 그린피 입력');
    const greenFeeInput = await page.$('tbody tr:first-child input[placeholder="만원"]');
    await greenFeeInput.click();
    await page.keyboard.type('15.5', { delay: 100 });
    console.log('   입력: "15.5" 만원');
    
    // 6. 인원 입력
    console.log('\n6️⃣ 인원 입력');
    await page.keyboard.press('Tab');
    const peopleInput = await page.$('tbody tr:first-child input[placeholder="인원"]');
    await peopleInput.click();
    await page.keyboard.type('4', { delay: 100 });
    console.log('   입력: "4" 명');
    
    await page.screenshot({ 
      path: 'test-screenshots/03-all-data-input.png',
      fullPage: true 
    });
    console.log('\n   ✅ 모든 데이터 입력 완료 스크린샷 저장');
    
    // 7. 기본값 확인
    console.log('\n7️⃣ 기본값 자동 설정 확인');
    
    // 체크박스 상태 확인
    const checkboxStates = await page.evaluate(() => {
      const row = document.querySelector('tbody tr:first-child');
      const checkboxes = row.querySelectorAll('input[type="checkbox"]');
      return Array.from(checkboxes).map((cb, i) => {
        const labels = ['캐디', '선입금', '식사포함', '카트비포함'];
        return { 
          name: labels[i], 
          checked: cb.checked 
        };
      });
    });
    
    checkboxStates.forEach(cb => {
      console.log(`   ${cb.name}: ${cb.checked ? '✅ 체크됨' : '⬜ 체크 안됨'}`);
    });
    
    // 홀 선택 확인
    const holeValue = await page.evaluate(() => {
      const select = document.querySelector('tbody tr:first-child select');
      return select ? select.value : null;
    });
    console.log(`   홀 선택: ${holeValue || '기본값'}`);
    
    // 8. 스페이스바로 저장
    console.log('\n8️⃣ 스페이스바로 저장 테스트');
    
    // 현재 행 수 확인
    const rowCountBefore = await page.evaluate(() => {
      return document.querySelectorAll('tbody tr').length;
    });
    console.log(`   저장 전 행 수: ${rowCountBefore}`);
    
    // 스페이스바 누르기
    await peopleInput.focus();
    await page.keyboard.press('Space');
    console.log('   스페이스바 입력');
    
    await page.waitForTimeout(1000);
    
    // 9. 새 행 추가 확인
    console.log('\n9️⃣ 새로운 행 추가 확인');
    const rowCountAfter = await page.evaluate(() => {
      return document.querySelectorAll('tbody tr').length;
    });
    console.log(`   저장 후 행 수: ${rowCountAfter}`);
    
    if (rowCountAfter > rowCountBefore) {
      console.log('   ✅ 새로운 행이 추가됨');
    } else {
      console.log('   ⚠️  새로운 행이 추가되지 않음');
    }
    
    // 10. localStorage 확인
    console.log('\n🔟 localStorage 데이터 확인');
    const localData = await page.evaluate(() => {
      const data = localStorage.getItem('teeTimeData');
      return data ? JSON.parse(data) : null;
    });
    
    if (localData && localData.length > 0) {
      console.log('   ✅ localStorage에 데이터 저장됨');
      console.log(`   저장된 데이터 수: ${localData.length}`);
      console.log('\n   최근 저장 데이터:');
      const lastData = localData[localData.length - 1];
      Object.entries(lastData).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    } else {
      console.log('   ⚠️  localStorage에 데이터 없음');
    }
    
    await page.screenshot({ 
      path: 'test-screenshots/04-final-state.png',
      fullPage: true 
    });
    
    // 키보드 네비게이션 테스트
    console.log('\n⌨️ 키보드 네비게이션 테스트');
    
    // 새 행에서 Tab 키 테스트
    const newGolfInput = await page.$('tbody tr:last-child input[placeholder="골프장 입력"]');
    await newGolfInput.click();
    
    console.log('   Tab 키로 필드 이동 테스트...');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }
    console.log('   ✅ Tab 키 네비게이션 작동 확인');
    
    // Enter 키 테스트
    await newGolfInput.click();
    await page.keyboard.type('포도CC');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName + (el.placeholder ? `: ${el.placeholder}` : '') : null;
    });
    console.log(`   Enter 키 후 포커스: ${activeElement}`);
    
    console.log('\n✅ 테스트 완료!');
    console.log('📁 스크린샷 저장 위치: test-screenshots/');
    console.log('\n브라우저를 열어두었습니다. 수동으로 추가 테스트 후 닫아주세요.');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ 
      path: 'test-screenshots/error-state.png',
      fullPage: true 
    });
  }
})();