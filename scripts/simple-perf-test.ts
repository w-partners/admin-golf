// 간단한 성능 테스트 - Matrix API 응답 시간 측정
const API_BASE_URL = 'http://localhost:3000';

async function measureAPIPerformance() {
  console.log('📊 Matrix API 성능 테스트\n');
  
  const tests = [
    { days: 30, name: '30일 데이터' },
    { days: 90, name: '90일 데이터' }
  ];
  
  for (const test of tests) {
    const url = `${API_BASE_URL}/api/tee-times/matrix?type=DAILY&booking=BOOKING&days=${test.days}`;
    console.log(`\n테스트: ${test.name}`);
    
    // 5회 측정
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        const response = await fetch(url);
        const data = await response.json();
        const elapsed = Date.now() - start;
        times.push(elapsed);
        console.log(`  시도 ${i + 1}: ${elapsed}ms`);
      } catch (error) {
        console.error(`  시도 ${i + 1}: 실패`, error);
      }
    }
    
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      console.log(`\n  결과:`);
      console.log(`    평균: ${avg.toFixed(2)}ms`);
      console.log(`    최소: ${min}ms`);
      console.log(`    최대: ${max}ms`);
      console.log(`    목표: ${test.days === 30 ? '< 200ms' : '< 500ms'}`);
      console.log(`    상태: ${avg < (test.days === 30 ? 200 : 500) ? '✅ 달성' : '❌ 미달'}`);
    }
  }
}

// 페이지 로딩 시간 측정
async function measurePageLoad() {
  console.log('\n\n📊 Matrix 페이지 로딩 성능\n');
  
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const start = Date.now();
    await page.goto(`${API_BASE_URL}/matrix`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    // 렌더링된 요소 수 확인
    const elementCount = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button').length;
      const cells = document.querySelectorAll('td').length;
      return { buttons, cells };
    });
    
    console.log(`  페이지 로드 시간: ${loadTime}ms`);
    console.log(`  렌더링된 버튼: ${elementCount.buttons}개`);
    console.log(`  렌더링된 셀: ${elementCount.cells}개`);
    console.log(`  목표: < 3000ms`);
    console.log(`  상태: ${loadTime < 3000 ? '✅ 달성' : '❌ 미달'}`);
    
  } finally {
    await browser.close();
  }
}

// 실행
async function main() {
  console.log('🚀 골프장 예약 시스템 성능 측정\n');
  console.log('=' .repeat(50));
  
  await measureAPIPerformance();
  await measurePageLoad();
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n✨ 테스트 완료!\n');
}

main().catch(console.error);