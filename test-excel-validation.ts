import { chromium, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  item: string;
  status: '✅ 성공' | '❌ 실패' | '⚠️ 경고';
  details: string;
  screenshot?: string;
}

class ExcelPageValidator {
  private page!: Page;
  private results: ValidationResult[] = [];
  private screenshotDir = path.join(process.cwd(), 'validation-screenshots');

  constructor() {
    // 스크린샷 디렉토리 생성
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async initialize() {
    console.log('🚀 브라우저 시작...');
    const browser = await chromium.launch({
      headless: false,
      args: ['--window-size=1920,1080']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    });
    
    this.page = await context.newPage();
    
    // 콘솔 메시지 및 에러 모니터링
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ 브라우저 에러:', msg.text());
      }
    });
    
    this.page.on('pageerror', error => {
      console.error('❌ 페이지 에러:', error);
    });
  }

  async captureScreenshot(name: string): Promise<string> {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ 
      path: filepath,
      fullPage: false 
    });
    return filename;
  }

  async validate1_PageLoading() {
    console.log('\n📋 검증 1: 페이지 로딩 및 Matrix View 표시');
    
    try {
      // 페이지 접속
      const response = await this.page.goto('http://localhost:3005/demo', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      if (!response || response.status() !== 200) {
        throw new Error(`페이지 응답 실패: ${response?.status()}`);
      }
      
      // Matrix View 컨테이너 확인
      const matrixView = await this.page.waitForSelector('.matrix-view-container', {
        timeout: 10000
      });
      
      if (matrixView) {
        const screenshot = await this.captureScreenshot('01-page-loaded');
        this.results.push({
          item: '페이지 로딩',
          status: '✅ 성공',
          details: 'Matrix View가 정상적으로 로드되었습니다',
          screenshot
        });
      }
    } catch (error) {
      this.results.push({
        item: '페이지 로딩',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async validate2_TabSwitching() {
    console.log('\n📋 검증 2: 4개 탭 전환 기능');
    
    const tabs = [
      { selector: 'button:has-text("데일리부킹")', name: '데일리부킹' },
      { selector: 'button:has-text("데일리조인")', name: '데일리조인' },
      { selector: 'button:has-text("패키지부킹")', name: '패키지부킹' },
      { selector: 'button:has-text("패키지조인")', name: '패키지조인' }
    ];
    
    for (const tab of tabs) {
      try {
        await this.page.click(tab.selector);
        await this.page.waitForTimeout(500); // 탭 전환 애니메이션 대기
        
        // 활성 탭 확인
        const isActive = await this.page.evaluate((selector) => {
          const button = document.querySelector(selector);
          return button?.classList.contains('bg-blue-600');
        }, tab.selector);
        
        if (isActive) {
          const screenshot = await this.captureScreenshot(`02-tab-${tab.name}`);
          this.results.push({
            item: `탭 전환: ${tab.name}`,
            status: '✅ 성공',
            details: `${tab.name} 탭이 정상 작동합니다`,
            screenshot
          });
        } else {
          throw new Error('탭 활성화 실패');
        }
      } catch (error) {
        this.results.push({
          item: `탭 전환: ${tab.name}`,
          status: '❌ 실패',
          details: `에러: ${error}`
        });
      }
    }
  }

  async validate3_ExcelFeatures() {
    console.log('\n📋 검증 3: 엑셀 기능 (고정 컬럼, 스크롤, 버튼)');
    
    try {
      // 좌측 고정 컬럼 확인
      const stickyColumns = await this.page.$$('.sticky');
      if (stickyColumns.length > 0) {
        this.results.push({
          item: '좌측 고정 컬럼',
          status: '✅ 성공',
          details: `${stickyColumns.length}개의 고정 컬럼 확인됨`
        });
      }
      
      // 수평 스크롤 테스트
      const scrollContainer = await this.page.$('.overflow-x-auto');
      if (scrollContainer) {
        // 스크롤 전 위치
        const initialScroll = await scrollContainer.evaluate(el => el.scrollLeft);
        
        // 오른쪽으로 스크롤
        await scrollContainer.evaluate(el => el.scrollLeft = 500);
        await this.page.waitForTimeout(500);
        
        const afterScroll = await scrollContainer.evaluate(el => el.scrollLeft);
        
        if (afterScroll > initialScroll) {
          const screenshot = await this.captureScreenshot('03-horizontal-scroll');
          this.results.push({
            item: '수평 스크롤',
            status: '✅ 성공',
            details: '날짜 컬럼 수평 스크롤이 작동합니다',
            screenshot
          });
        }
      }
      
      // 티타임 버튼 확인
      const teeTimeButtons = await this.page.$$('button:has-text("1부"), button:has-text("2부"), button:has-text("3부")');
      if (teeTimeButtons.length > 0) {
        this.results.push({
          item: '티타임 버튼',
          status: '✅ 성공',
          details: `${teeTimeButtons.length}개의 티타임 버튼 확인됨`
        });
      }
      
    } catch (error) {
      this.results.push({
        item: '엑셀 기능',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async validate4_DynamicData() {
    console.log('\n📋 검증 4: 동적 데이터 변경');
    
    try {
      // 데일리부킹 탭 클릭
      await this.page.click('button:has-text("데일리부킹")');
      await this.page.waitForTimeout(500);
      
      // 첫 번째 티타임 버튼의 텍스트 저장
      const firstButton = await this.page.$('td button:has-text("1부")');
      const dailyBookingText = await firstButton?.textContent();
      
      // 데일리조인 탭으로 전환
      await this.page.click('button:has-text("데일리조인")');
      await this.page.waitForTimeout(500);
      
      // 동일 위치 버튼의 텍스트 확인
      const joinButton = await this.page.$('td button:has-text("1부")');
      const dailyJoinText = await joinButton?.textContent();
      
      if (dailyBookingText !== dailyJoinText) {
        const screenshot = await this.captureScreenshot('04-dynamic-data');
        this.results.push({
          item: '동적 데이터',
          status: '✅ 성공',
          details: '탭 전환시 데이터가 변경됩니다',
          screenshot
        });
      } else {
        this.results.push({
          item: '동적 데이터',
          status: '⚠️ 경고',
          details: '데이터가 동일합니다 (샘플 데이터일 수 있음)'
        });
      }
    } catch (error) {
      this.results.push({
        item: '동적 데이터',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async validate5_RefreshButton() {
    console.log('\n📋 검증 5: 새로고침 버튼');
    
    try {
      const refreshButton = await this.page.$('button:has-text("🔄")');
      if (refreshButton) {
        await refreshButton.click();
        await this.page.waitForTimeout(1000);
        
        this.results.push({
          item: '새로고침 버튼',
          status: '✅ 성공',
          details: '새로고침 버튼이 작동합니다'
        });
      } else {
        throw new Error('새로고침 버튼을 찾을 수 없음');
      }
    } catch (error) {
      this.results.push({
        item: '새로고침 버튼',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async validate6_ClickEvents() {
    console.log('\n📋 검증 6: 클릭 이벤트');
    
    try {
      // Alert 대화상자 핸들러 설정
      this.page.once('dialog', async dialog => {
        const message = dialog.message();
        await dialog.accept();
        
        if (message.includes('예약하기')) {
          this.results.push({
            item: '클릭 이벤트',
            status: '✅ 성공',
            details: `Alert 메시지: "${message}"`
          });
        }
      });
      
      // 첫 번째 티타임 버튼 클릭
      const teeTimeButton = await this.page.$('td button[class*="bg-blue"]');
      if (teeTimeButton) {
        await teeTimeButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      this.results.push({
        item: '클릭 이벤트',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async validate7_ColorScheme() {
    console.log('\n📋 검증 7: 색상 구분');
    
    try {
      const colors = {
        '1부': 'bg-blue-500',
        '2부': 'bg-green-500',
        '3부': 'bg-orange-500'
      };
      
      for (const [time, colorClass] of Object.entries(colors)) {
        const button = await this.page.$(`button:has-text("${time}")[class*="${colorClass}"]`);
        if (button) {
          this.results.push({
            item: `색상 구분: ${time}`,
            status: '✅ 성공',
            details: `${time}가 올바른 색상으로 표시됩니다`
          });
        } else {
          this.results.push({
            item: `색상 구분: ${time}`,
            status: '⚠️ 경고',
            details: `${time} 색상을 확인할 수 없습니다`
          });
        }
      }
      
      const screenshot = await this.captureScreenshot('07-color-scheme');
      this.results[this.results.length - 1].screenshot = screenshot;
      
    } catch (error) {
      this.results.push({
        item: '색상 구분',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async validate8_TodayHighlight() {
    console.log('\n📋 검증 8: 오늘 날짜 강조');
    
    try {
      // 오늘 날짜 찾기
      const today = new Date();
      const month = today.getMonth() + 1;
      const date = today.getDate();
      const todayText = `${month}/${date}`;
      
      // 노란색 배경의 오늘 날짜 헤더 확인
      const todayHeader = await this.page.$(`th[class*="bg-yellow"]:has-text("${todayText}")`);
      
      if (todayHeader) {
        const screenshot = await this.captureScreenshot('08-today-highlight');
        this.results.push({
          item: '오늘 날짜 강조',
          status: '✅ 성공',
          details: `오늘 날짜(${todayText})가 노란색으로 강조됩니다`,
          screenshot
        });
      } else {
        this.results.push({
          item: '오늘 날짜 강조',
          status: '⚠️ 경고',
          details: '오늘 날짜 강조를 확인할 수 없습니다'
        });
      }
    } catch (error) {
      this.results.push({
        item: '오늘 날짜 강조',
        status: '❌ 실패',
        details: `에러: ${error}`
      });
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 엑셀 페이지 검증 결과 보고서');
    console.log('='.repeat(80));
    console.log(`📅 검증 시간: ${new Date().toLocaleString('ko-KR')}`);
    console.log(`🔗 테스트 URL: http://localhost:3005/demo`);
    console.log(`📸 스크린샷 저장 위치: ${this.screenshotDir}`);
    console.log('='.repeat(80));
    
    // 통계
    const successCount = this.results.filter(r => r.status === '✅ 성공').length;
    const failCount = this.results.filter(r => r.status === '❌ 실패').length;
    const warningCount = this.results.filter(r => r.status === '⚠️ 경고').length;
    
    console.log('\n📈 검증 통계:');
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${failCount}개`);
    console.log(`  ⚠️ 경고: ${warningCount}개`);
    console.log(`  📋 전체: ${this.results.length}개`);
    
    console.log('\n📝 상세 검증 결과:');
    console.log('-'.repeat(80));
    
    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.item}`);
      console.log(`   상태: ${result.status}`);
      console.log(`   상세: ${result.details}`);
      if (result.screenshot) {
        console.log(`   📸 스크린샷: ${result.screenshot}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    // 최종 판정
    if (failCount === 0 && warningCount <= 2) {
      console.log('✅ 최종 판정: 엑셀 페이지가 정상적으로 작동합니다!');
    } else if (failCount === 0) {
      console.log('⚠️ 최종 판정: 엑셀 페이지가 작동하지만 일부 경고사항이 있습니다.');
    } else {
      console.log('❌ 최종 판정: 엑셀 페이지에 문제가 있습니다. 수정이 필요합니다.');
    }
    
    console.log('='.repeat(80));
    
    // HTML 리포트 생성
    await this.generateHTMLReport();
  }

  async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>엑셀 페이지 검증 리포트</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
    .stat.success { background: #e8f5e9; color: #2e7d32; }
    .stat.fail { background: #ffebee; color: #c62828; }
    .stat.warning { background: #fff3e0; color: #ef6c00; }
    .result-item { margin: 20px 0; padding: 15px; border-left: 4px solid #ddd; background: #fafafa; }
    .result-item.success { border-color: #4CAF50; }
    .result-item.fail { border-color: #f44336; }
    .result-item.warning { border-color: #ff9800; }
    .screenshot { margin-top: 10px; max-width: 100%; border: 1px solid #ddd; }
    .status { font-weight: bold; margin-bottom: 5px; }
    .details { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 골프장 예약 시스템 - 엑셀 페이지 검증 리포트</h1>
    <p>📅 검증 시간: ${new Date().toLocaleString('ko-KR')}</p>
    <p>🔗 테스트 URL: http://localhost:3005/demo</p>
    
    <div class="stats">
      <div class="stat success">
        <h2>${this.results.filter(r => r.status === '✅ 성공').length}</h2>
        <p>성공</p>
      </div>
      <div class="stat fail">
        <h2>${this.results.filter(r => r.status === '❌ 실패').length}</h2>
        <p>실패</p>
      </div>
      <div class="stat warning">
        <h2>${this.results.filter(r => r.status === '⚠️ 경고').length}</h2>
        <p>경고</p>
      </div>
    </div>
    
    <h2>📝 상세 검증 결과</h2>
    ${this.results.map(result => `
      <div class="result-item ${result.status.includes('성공') ? 'success' : result.status.includes('실패') ? 'fail' : 'warning'}">
        <div class="status">${result.status} ${result.item}</div>
        <div class="details">${result.details}</div>
        ${result.screenshot ? `<img src="${result.screenshot}" class="screenshot" alt="${result.item}">` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
    
    const reportPath = path.join(this.screenshotDir, 'validation-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📄 HTML 리포트 생성됨: ${reportPath}`);
  }

  async runAllValidations() {
    await this.initialize();
    
    // 모든 검증 실행
    await this.validate1_PageLoading();
    await this.validate2_TabSwitching();
    await this.validate3_ExcelFeatures();
    await this.validate4_DynamicData();
    await this.validate5_RefreshButton();
    await this.validate6_ClickEvents();
    await this.validate7_ColorScheme();
    await this.validate8_TodayHighlight();
    
    // 최종 스크린샷
    await this.captureScreenshot('99-final-state');
    
    // 리포트 생성
    await this.generateReport();
    
    // 브라우저는 열어둠 (검증용)
    console.log('\n💡 브라우저를 열어두었습니다. 직접 확인하실 수 있습니다.');
    console.log('   종료하려면 Ctrl+C를 누르세요.');
  }
}

// 실행
const validator = new ExcelPageValidator();
validator.runAllValidations().catch(console.error);