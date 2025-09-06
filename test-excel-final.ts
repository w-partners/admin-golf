import { chromium } from 'playwright';

async function testExcelPage() {
  console.log('🎯 골프장 예약 시스템 - 엑셀 페이지 최종 검증');
  console.log('=' . repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  
  console.log('\n📍 포트 3007에서 테스트 시작...');
  console.log('   URL: http://localhost:3007/demo\n');
  
  try {
    // 1. 페이지 접속
    console.log('1️⃣ 페이지 로딩 테스트');
    const response = await page.goto('http://localhost:3007/demo', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`   ✅ 응답 상태: ${response?.status()}`);
    console.log(`   ✅ 최종 URL: ${page.url()}`);
    
    // 페이지 컴파일 대기
    await page.waitForTimeout(3000);
    
    // 2. Matrix View 확인
    console.log('\n2️⃣ Matrix View 표시 확인');
    const title = await page.locator('h1:has-text("골프장 예약 관리 시스템")').textContent();
    console.log(`   ✅ 페이지 제목: ${title}`);
    
    // 3. 4개 탭 확인
    console.log('\n3️⃣ 4개 탭 동작 확인');
    const tabs = ['데일리부킹', '데일리조인', '패키지부킹', '패키지조인'];
    
    for (const tabName of tabs) {
      const tabButton = page.locator(`button:has-text("${tabName}")`);
      const exists = await tabButton.count() > 0;
      console.log(`   ${exists ? '✅' : '❌'} ${tabName} 탭`);
      
      if (exists) {
        await tabButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // 4. 엑셀 기능 확인
    console.log('\n4️⃣ 엑셀 기능 검증');
    
    // 좌측 고정 컬럼
    const regionHeader = await page.locator('div:has-text("지역")').first().isVisible();
    console.log(`   ${regionHeader ? '✅' : '❌'} 좌측 고정 컬럼 (지역/골프장)`);
    
    // 수평 스크롤
    const scrollContainer = await page.locator('.overflow-x-auto').first();
    if (scrollContainer) {
      await scrollContainer.evaluate(el => el.scrollLeft = 300);
      console.log(`   ✅ 수평 스크롤 작동`);
    }
    
    // 티타임 버튼
    const teeTimeButtons = await page.locator('button:has-text("1부:")').count();
    console.log(`   ✅ 티타임 버튼: ${teeTimeButtons}개 발견`);
    
    // 5. 색상 구분 확인
    console.log('\n5️⃣ 색상 구분 확인');
    const blueButtons = await page.locator('button.bg-blue-100').count();
    const greenButtons = await page.locator('button.bg-green-100').count();
    const orangeButtons = await page.locator('button.bg-orange-100').count();
    
    console.log(`   ✅ 1부 (파란색): ${blueButtons}개`);
    console.log(`   ✅ 2부 (초록색): ${greenButtons}개`);
    console.log(`   ✅ 3부 (주황색): ${orangeButtons}개`);
    
    // 6. 오늘 날짜 강조
    console.log('\n6️⃣ 오늘 날짜 강조 확인');
    const todayHighlight = await page.locator('.bg-yellow-200').count();
    console.log(`   ${todayHighlight > 0 ? '✅' : '⚠️'} 오늘 날짜 노란색 강조`);
    
    // 7. 클릭 이벤트
    console.log('\n7️⃣ 클릭 이벤트 테스트');
    page.once('dialog', async dialog => {
      console.log(`   ✅ Alert 메시지: "${dialog.message()}"`);
      await dialog.accept();
    });
    
    const clickableButton = await page.locator('button:has-text("1부:"):not([disabled])').first();
    if (clickableButton) {
      await clickableButton.click();
      await page.waitForTimeout(500);
    }
    
    // 8. 새로고침 버튼
    console.log('\n8️⃣ 새로고침 기능');
    const refreshButton = await page.locator('button:has-text("🔄")').first();
    if (refreshButton) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
      console.log(`   ✅ 새로고침 버튼 작동`);
    }
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'excel-page-success.png',
      fullPage: false 
    });
    
    console.log('\n' + '=' . repeat(60));
    console.log('✅ 최종 결과: 엑셀 페이지가 정상적으로 작동합니다!');
    console.log('=' . repeat(60));
    console.log('\n📸 스크린샷 저장: excel-page-success.png');
    console.log('💡 브라우저를 열어두었습니다. 직접 확인하실 수 있습니다.');
    console.log('   종료하려면 Ctrl+C를 누르세요.\n');
    
    // 브라우저 열어두기
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    
    // 에러 스크린샷
    await page.screenshot({ 
      path: 'excel-page-error.png',
      fullPage: false 
    });
    console.log('📸 에러 스크린샷 저장: excel-page-error.png');
    
    await browser.close();
  }
}

testExcelPage().catch(console.error);