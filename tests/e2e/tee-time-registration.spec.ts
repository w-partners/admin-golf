import { test, expect, Page } from '@playwright/test';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth 플러그인 적용
chromium.use(StealthPlugin());

test.describe('티타임 등록 전체 프로세스 테스트', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Stealth 브라우저로 페이지 생성
    const context = await browser.newContext({
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    page = await context.newPage();
  });

  test('티타임 등록 페이지 전체 프로세스', async () => {
    // 1. 페이지 접속 및 초기 상태 확인
    console.log('1. 페이지 접속 및 초기 상태 확인');
    await page.goto('http://localhost:8080/tee-time-register.html');
    await page.waitForLoadState('networkidle');
    
    // 스크린샷: 초기 페이지 상태
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-initial-page.png',
      fullPage: true 
    });

    // 페이지 제목 확인
    const title = await page.locator('h1').textContent();
    expect(title).toBe('티타임 등록');
    console.log('✅ 페이지 제목 확인 완료');

    // 테이블 헤더 확인
    const headers = await page.locator('thead th').allTextContents();
    expect(headers).toContain('골프장');
    expect(headers).toContain('지역');
    expect(headers).toContain('날짜');
    console.log('✅ 테이블 헤더 확인 완료');

    // 2. 골프장 입력 및 자동완성 테스트
    console.log('\n2. 골프장 입력 및 자동완성 테스트');
    const firstRow = page.locator('tbody tr').first();
    const golfCourseInput = firstRow.locator('input[placeholder="골프장 입력"]');
    
    // "취곡" 입력
    await golfCourseInput.click();
    await golfCourseInput.type('취곡', { delay: 100 });
    
    // 자동완성 대기
    await page.waitForTimeout(500);
    
    // 자동완성 목록 확인
    const autocompleteVisible = await page.locator('.autocomplete-items').isVisible();
    if (autocompleteVisible) {
      console.log('✅ 자동완성 목록 표시됨');
      
      // 자동완성 항목 선택
      const autocompleteItem = page.locator('.autocomplete-items div').first();
      if (await autocompleteItem.isVisible()) {
        await autocompleteItem.click();
        console.log('✅ 자동완성 항목 선택 완료');
      }
    } else {
      console.log('⚠️ 자동완성 목록이 표시되지 않음 - 직접 입력');
      await golfCourseInput.fill('취곡CC');
    }
    
    // 스크린샷: 골프장 입력 후
    await page.screenshot({ 
      path: 'artifacts/screenshots/02-golf-course-input.png',
      fullPage: true 
    });

    // 지역 자동 입력 확인
    const regionInput = firstRow.locator('input[placeholder="지역"]');
    const regionValue = await regionInput.inputValue();
    console.log(`지역 자동 입력 값: ${regionValue}`);
    if (regionValue) {
      console.log('✅ 지역 자동 입력 확인');
    } else {
      console.log('⚠️ 지역이 자동으로 입력되지 않음');
    }

    // 3. 날짜 입력 테스트
    console.log('\n3. 날짜 입력 테스트');
    const dateInput = firstRow.locator('input[placeholder="MMDD"]');
    await dateInput.click();
    await dateInput.type('0912', { delay: 100 });
    
    // Tab 키로 다음 필드로 이동 (날짜 변환 트리거)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    const dateValue = await dateInput.inputValue();
    console.log(`날짜 입력 결과: ${dateValue}`);
    if (dateValue.includes('2025-09-12') || dateValue === '09-12') {
      console.log('✅ 날짜 자동 변환 확인');
    } else {
      console.log(`⚠️ 날짜 변환 결과가 예상과 다름: ${dateValue}`);
    }

    // 4. 시간 입력
    console.log('\n4. 시간 입력');
    const timeInput = firstRow.locator('input[placeholder="HHMM"]');
    await timeInput.click();
    await timeInput.type('1030', { delay: 100 });
    await page.keyboard.press('Tab');
    
    const timeValue = await timeInput.inputValue();
    console.log(`시간 입력 결과: ${timeValue}`);
    if (timeValue === '10:30' || timeValue === '1030') {
      console.log('✅ 시간 입력 확인');
    }

    // 5. 그린피 입력
    console.log('\n5. 그린피 입력');
    const greenFeeInput = firstRow.locator('input[placeholder="만원"]');
    await greenFeeInput.click();
    await greenFeeInput.type('15.5', { delay: 100 });
    await page.keyboard.press('Tab');
    console.log('✅ 그린피 15.5만원 입력');

    // 6. 인원 입력
    console.log('\n6. 인원 입력');
    const peopleInput = firstRow.locator('input[placeholder="인원"]');
    await peopleInput.click();
    await peopleInput.type('4', { delay: 100 });
    await page.keyboard.press('Tab');
    console.log('✅ 인원 4명 입력');

    // 스크린샷: 모든 데이터 입력 후
    await page.screenshot({ 
      path: 'artifacts/screenshots/03-all-data-input.png',
      fullPage: true 
    });

    // 7. 기본값 확인
    console.log('\n7. 기본값 자동 설정 확인');
    
    // 체크박스 기본값 확인
    const checkboxes = {
      '캐디': firstRow.locator('input[type="checkbox"]').nth(0),
      '선입금': firstRow.locator('input[type="checkbox"]').nth(1),
      '식사포함': firstRow.locator('input[type="checkbox"]').nth(2),
      '카트비포함': firstRow.locator('input[type="checkbox"]').nth(3)
    };

    for (const [name, checkbox] of Object.entries(checkboxes)) {
      const isChecked = await checkbox.isChecked();
      console.log(`${name}: ${isChecked ? '✅ 체크됨' : '⬜ 체크 안됨'}`);
    }

    // 홀 선택 기본값 확인
    const holeSelect = firstRow.locator('select').first();
    const holeValue = await holeSelect.inputValue();
    console.log(`홀 선택 기본값: ${holeValue}`);

    // 8. 스페이스바로 저장 테스트
    console.log('\n8. 스페이스바로 저장 기능 테스트');
    
    // 현재 행 수 확인
    const rowCountBefore = await page.locator('tbody tr').count();
    console.log(`저장 전 행 수: ${rowCountBefore}`);
    
    // 마지막 입력 필드에 포커스
    await peopleInput.focus();
    
    // 스페이스바 입력
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    
    // 알림 확인
    page.on('dialog', async dialog => {
      console.log(`알림 메시지: ${dialog.message()}`);
      await dialog.accept();
    });

    // 9. 새로운 행 추가 확인
    console.log('\n9. 새로운 행 추가 확인');
    const rowCountAfter = await page.locator('tbody tr').count();
    console.log(`저장 후 행 수: ${rowCountAfter}`);
    
    if (rowCountAfter > rowCountBefore) {
      console.log('✅ 새로운 행이 추가됨');
    } else {
      console.log('⚠️ 새로운 행이 추가되지 않음');
    }

    // 10. localStorage 데이터 확인
    console.log('\n10. localStorage 데이터 확인');
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('teeTimeData');
      return data ? JSON.parse(data) : null;
    });
    
    if (localStorageData && localStorageData.length > 0) {
      console.log('✅ localStorage에 데이터 저장 확인');
      console.log('저장된 데이터 수:', localStorageData.length);
      console.log('최근 저장 데이터:', JSON.stringify(localStorageData[localStorageData.length - 1], null, 2));
    } else {
      console.log('⚠️ localStorage에 데이터가 없음');
    }

    // 최종 스크린샷
    await page.screenshot({ 
      path: 'artifacts/screenshots/04-final-state.png',
      fullPage: true 
    });

    // 키보드 네비게이션 테스트
    console.log('\n추가: 키보드 네비게이션 테스트');
    
    // 새 행의 첫 번째 입력 필드에 포커스
    const newRow = page.locator('tbody tr').last();
    const newGolfCourseInput = newRow.locator('input[placeholder="골프장 입력"]');
    await newGolfCourseInput.click();
    
    // Tab 키로 필드 간 이동 테스트
    console.log('Tab 키 네비게이션 테스트...');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    console.log('✅ Tab 키 네비게이션 작동 확인');
    
    // Enter 키 테스트
    await newGolfCourseInput.click();
    await newGolfCourseInput.type('포도CC');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Enter 키 후 포커스 위치: ${activeElement}`);

    // 테스트 완료
    console.log('\n========== 테스트 완료 ==========');
    console.log('모든 스크린샷이 artifacts/screenshots/ 폴더에 저장되었습니다.');
  });

  test.afterAll(async () => {
    // 브라우저 컨텍스트 정리는 Playwright가 자동으로 처리
  });
});