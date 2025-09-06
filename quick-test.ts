import { chromium } from 'playwright';

async function quickTest() {
  console.log('🚀 빠른 엑셀 페이지 테스트 시작...\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  
  console.log('📍 http://localhost:3005/demo 접속 시도...');
  
  try {
    // 페이지 접속
    const response = await page.goto('http://localhost:3005/demo', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log(`   응답 상태: ${response?.status()}`);
    console.log(`   최종 URL: ${page.url()}`);
    
    // 잠시 대기
    await page.waitForTimeout(2000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`   페이지 제목: ${title}`);
    
    // Matrix View 확인
    const hasMatrixView = await page.locator('.matrix-view-container').count();
    console.log(`   Matrix View 존재: ${hasMatrixView > 0 ? '✅ 있음' : '❌ 없음'}`);
    
    // 탭 버튼 확인
    const tabs = await page.locator('button:has-text("데일리부킹")').count();
    console.log(`   탭 버튼 존재: ${tabs > 0 ? '✅ 있음' : '❌ 없음'}`);
    
    // 티타임 버튼 확인
    const teeTimeButtons = await page.locator('button:has-text("1부")').count();
    console.log(`   티타임 버튼 개수: ${teeTimeButtons}개`);
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'quick-test-screenshot.png', fullPage: false });
    console.log('\n📸 스크린샷 저장: quick-test-screenshot.png');
    
    // 에러 메시지 확인
    const errorMessages = await page.locator('text=/error|Error|오류/i').count();
    if (errorMessages > 0) {
      console.log(`\n⚠️ 에러 메시지 감지: ${errorMessages}개`);
      
      // 에러 내용 출력
      const errors = await page.locator('text=/error|Error|오류/i').allTextContents();
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('\n💡 브라우저를 열어두었습니다. 직접 확인하실 수 있습니다.');
    console.log('   종료하려면 Ctrl+C를 누르세요.');
    
    // 브라우저 열어두기
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    
    // 에러 상황에서도 스크린샷 시도
    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: false });
      console.log('📸 에러 스크린샷 저장: error-screenshot.png');
    } catch {}
    
    await browser.close();
  }
}

quickTest().catch(console.error);