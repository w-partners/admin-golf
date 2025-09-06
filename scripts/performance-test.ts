import autocannon from 'autocannon';
import { chromium } from 'playwright';
import chalk from 'chalk';

const API_BASE_URL = 'http://localhost:3007';

// API 성능 테스트
async function testAPIPerformance() {
  console.log(chalk.blue('\n=== API 성능 테스트 시작 ===\n'));
  
  const endpoints = [
    {
      name: 'Matrix API - 30일 데이터',
      url: '/api/tee-times/matrix?type=DAILY&booking=BOOKING&days=30',
      target: 200 // 목표: 200ms 이하
    },
    {
      name: 'Matrix API - 90일 데이터',
      url: '/api/tee-times/matrix?type=DAILY&booking=BOOKING&days=90', 
      target: 500 // 목표: 500ms 이하
    }
  ];

  for (const endpoint of endpoints) {
    console.log(chalk.yellow(`\n테스트: ${endpoint.name}`));
    console.log(chalk.gray(`URL: ${endpoint.url}`));
    
    const result = await autocannon({
      url: `${API_BASE_URL}${endpoint.url}`,
      connections: 10,
      duration: 10,
      pipelining: 1,
      bailout: 1000,
      headers: {
        'Accept': 'application/json'
      }
    });

    const avgLatency = result.latency.mean;
    const p95Latency = result.latency.p95;
    const p99Latency = result.latency.p99;
    const reqPerSec = result.requests.mean;
    
    console.log('\n📊 결과:');
    console.log(`  • 평균 응답시간: ${chalk.cyan(avgLatency.toFixed(2) + 'ms')}`);
    console.log(`  • P95 응답시간: ${chalk.cyan(p95Latency.toFixed(2) + 'ms')}`);
    console.log(`  • P99 응답시간: ${chalk.cyan(p99Latency.toFixed(2) + 'ms')}`);
    console.log(`  • 초당 처리량: ${chalk.cyan(reqPerSec.toFixed(2) + ' req/s')}`);
    
    // 성능 목표 달성 여부
    if (p95Latency <= endpoint.target) {
      console.log(chalk.green(`  ✅ 목표 달성 (P95 < ${endpoint.target}ms)`));
    } else {
      console.log(chalk.red(`  ❌ 목표 미달 (P95 > ${endpoint.target}ms)`));
    }
  }
}

// 브라우저 렌더링 성능 테스트
async function testBrowserPerformance() {
  console.log(chalk.blue('\n\n=== 브라우저 렌더링 성능 테스트 ===\n'));
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 성능 메트릭 수집
    await page.goto(`${API_BASE_URL}/matrix`);
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
    
    // Performance API 메트릭 수집
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    console.log('📊 페이지 로드 메트릭:');
    console.log(`  • DOM Interactive: ${chalk.cyan(metrics.domInteractive.toFixed(2) + 'ms')}`);
    console.log(`  • DOM Content Loaded: ${chalk.cyan(metrics.domContentLoaded.toFixed(2) + 'ms')}`);
    console.log(`  • First Paint: ${chalk.cyan(metrics.firstPaint.toFixed(2) + 'ms')}`);
    console.log(`  • First Contentful Paint: ${chalk.cyan(metrics.firstContentfulPaint.toFixed(2) + 'ms')}`);
    console.log(`  • Load Complete: ${chalk.cyan(metrics.loadComplete.toFixed(2) + 'ms')}`);
    
    // 메모리 사용량 측정
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2),
        totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2),
      } : null;
    });
    
    if (memoryInfo) {
      console.log('\n💾 메모리 사용량:');
      console.log(`  • JS Heap 사용: ${chalk.cyan(memoryInfo.usedJSHeapSize + ' MB')}`);
      console.log(`  • JS Heap 전체: ${chalk.cyan(memoryInfo.totalJSHeapSize + ' MB')}`);
    }
    
    // 렌더링된 요소 수 계산
    const elementCount = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button').length;
      const tableCells = document.querySelectorAll('td').length;
      const totalElements = document.querySelectorAll('*').length;
      return { buttons, tableCells, totalElements };
    });
    
    console.log('\n🎨 렌더링된 요소:');
    console.log(`  • 버튼 수: ${chalk.cyan(elementCount.buttons.toString())}`);
    console.log(`  • 테이블 셀: ${chalk.cyan(elementCount.tableCells.toString())}`);
    console.log(`  • 전체 요소: ${chalk.cyan(elementCount.totalElements.toString())}`);
    
    // 탭 전환 성능 테스트
    console.log(chalk.yellow('\n\n탭 전환 성능 테스트:'));
    
    const tabs = ['daily-join', 'package-booking', 'package-join', 'daily-booking'];
    for (const tab of tabs) {
      const startTime = Date.now();
      
      await page.click(`[role="tab"][data-value="${tab}"]`);
      await page.waitForTimeout(100); // 렌더링 완료 대기
      
      const switchTime = Date.now() - startTime;
      console.log(`  • ${tab} 탭 전환: ${chalk.cyan(switchTime + 'ms')}`);
    }
    
    // 스크롤 성능 테스트
    console.log(chalk.yellow('\n스크롤 성능 테스트:'));
    
    const scrollPerf = await page.evaluate(async () => {
      const table = document.querySelector('table');
      if (!table) return null;
      
      const startTime = performance.now();
      table.scrollLeft = 1000;
      await new Promise(resolve => setTimeout(resolve, 100));
      table.scrollLeft = 0;
      const endTime = performance.now();
      
      return endTime - startTime;
    });
    
    if (scrollPerf) {
      console.log(`  • 가로 스크롤 시간: ${chalk.cyan(scrollPerf.toFixed(2) + 'ms')}`);
    }
    
    // 성능 목표 평가
    console.log(chalk.yellow('\n\n📌 성능 목표 평가:'));
    
    const goals = [
      { name: 'FCP < 1.5초', achieved: metrics.firstContentfulPaint < 1500 },
      { name: 'DOM Interactive < 2초', achieved: metrics.domInteractive < 2000 },
      { name: '메모리 < 100MB', achieved: memoryInfo ? parseFloat(memoryInfo.usedJSHeapSize) < 100 : false },
      { name: '버튼 렌더링 (570개 예상)', achieved: elementCount.buttons >= 500 }
    ];
    
    goals.forEach(goal => {
      if (goal.achieved) {
        console.log(chalk.green(`  ✅ ${goal.name}`));
      } else {
        console.log(chalk.red(`  ❌ ${goal.name}`));
      }
    });
    
  } finally {
    await browser.close();
  }
}

// 메인 실행 함수
async function main() {
  console.log(chalk.bold.magenta('\n🚀 골프장 예약 시스템 성능 테스트\n'));
  console.log(chalk.gray('테스트 대상:'));
  console.log(chalk.gray('  • Matrix API 응답 속도'));
  console.log(chalk.gray('  • 570개 버튼 렌더링 성능'));
  console.log(chalk.gray('  • 탭 전환 및 스크롤 성능'));
  console.log(chalk.gray('  • 메모리 사용량\n'));
  
  try {
    await testAPIPerformance();
    await testBrowserPerformance();
    
    console.log(chalk.bold.green('\n\n✨ 성능 테스트 완료!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ 테스트 중 오류 발생:'), error);
    process.exit(1);
  }
}

// 실행
main().catch(console.error);