import puppeteer from 'puppeteer';

async function testMatrixView() {
  console.log('🚀 Matrix View 브라우저 테스트 시작...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  try {
    // Matrix View 페이지로 직접 이동
    console.log('📍 http://localhost:3005/matrix 로 이동 중...');
    await page.goto('http://localhost:3005/matrix', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    
    // 페이지 타이틀 확인
    const title = await page.title();
    console.log('📄 페이지 타이틀:', title);
    
    // Matrix View가 로드되었는지 확인
    await page.waitForSelector('.w-full.bg-white.rounded-lg.shadow-sm', {
      timeout: 10000,
    });
    console.log('✅ Matrix View 컴포넌트 로드 성공!');
    
    // 탭 버튼들이 있는지 확인
    const tabs = await page.$$eval('[role="tablist"] button', tabs => 
      tabs.map(tab => tab.textContent)
    );
    console.log('📑 탭 목록:', tabs);
    
    // 테이블 헤더가 있는지 확인
    const hasTable = await page.$('table') !== null;
    console.log('📊 테이블 존재:', hasTable ? '✅' : '❌');
    
    // 골프장 데이터가 표시되는지 확인
    const golfCourses = await page.$$eval('tbody tr', rows => rows.length);
    console.log(`⛳ 표시된 골프장 수: ${golfCourses}개`);
    
    // 티타임 등록 버튼 클릭
    console.log('🔘 티타임 등록 버튼 클릭 시도...');
    await page.click('button:has-text("티타임 등록")');
    
    // 다이얼로그가 열리는지 확인
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✅ 티타임 등록 다이얼로그 열림!');
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: 'matrix-view-screenshot.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: matrix-view-screenshot.png');
    
    console.log('\n🎉 Matrix View 테스트 완료!');
    console.log('브라우저를 열어두었습니다. 직접 확인해보세요.');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    
    // 에러 시 스크린샷
    await page.screenshot({ 
      path: 'error-screenshot.png',
      fullPage: true 
    });
    console.log('📸 에러 스크린샷 저장: error-screenshot.png');
  }
  
  // 브라우저를 열어둠
  console.log('\n브라우저를 닫으려면 Ctrl+C를 누르세요...');
  await new Promise(() => {}); // 무한 대기
}

testMatrixView().catch(console.error);