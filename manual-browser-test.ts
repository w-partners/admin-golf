import { chromium } from 'playwright';

async function validateGolfReservationSystem() {
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('🚀 Golf Reservation System 검증 시작...\n');
  
  try {
    // 1. 메인 페이지 접속
    console.log('1️⃣ 메인 페이지 접속 테스트');
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`   현재 URL: ${currentUrl}`);
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'screenshots/01-main-page.png' });
    console.log('   ✅ 스크린샷 저장: screenshots/01-main-page.png');
    
    // 2. 로그인 페이지 확인
    if (currentUrl.includes('/login')) {
      console.log('\n2️⃣ 로그인 페이지 감지됨');
      
      // 로그인 폼 요소 확인
      const phoneInput = await page.locator('input[name="phone"]').count();
      const passwordInput = await page.locator('input[name="password"]').count();
      
      if (phoneInput > 0 && passwordInput > 0) {
        console.log('   ✅ 로그인 폼 발견');
        
        // 로그인 시도
        console.log('   🔐 Super Admin으로 로그인 시도...');
        await page.fill('input[name="phone"]', '01034424668');
        await page.fill('input[name="password"]', 'admin1234');
        
        await page.screenshot({ path: 'screenshots/02-login-filled.png' });
        
        const submitButton = await page.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          console.log('   ✅ 로그인 제출');
          
          // 로그인 후 대기
          await page.waitForTimeout(3000);
          
          const afterLoginUrl = page.url();
          if (!afterLoginUrl.includes('/login')) {
            console.log(`   ✅ 로그인 성공! 리디렉션: ${afterLoginUrl}`);
            await page.screenshot({ path: 'screenshots/03-after-login.png' });
          } else {
            console.log('   ❌ 로그인 실패 - 여전히 로그인 페이지');
            
            // 에러 메시지 확인
            const errorMsg = await page.locator('[class*="error"], [class*="alert"]').textContent().catch(() => null);
            if (errorMsg) {
              console.log(`   에러 메시지: ${errorMsg}`);
            }
          }
        }
      } else {
        console.log('   ❌ 로그인 폼을 찾을 수 없습니다');
      }
    }
    
    // 3. Matrix View 접근 시도
    console.log('\n3️⃣ Matrix View (티타임 목록) 접근 시도');
    await page.goto('http://localhost:3003/tee-times');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'screenshots/04-tee-times.png' });
    
    // 테이블 확인
    const tables = await page.locator('table').count();
    if (tables > 0) {
      console.log(`   ✅ ${tables}개의 테이블 발견`);
    } else {
      console.log('   ⚠️ 테이블을 찾을 수 없음');
    }
    
    // 탭 확인
    const tabs = ['데일리부킹', '데일리조인', '패키지부킹', '패키지조인'];
    console.log('   📑 탭 확인:');
    for (const tab of tabs) {
      const tabExists = await page.locator(`text="${tab}"`).count() > 0;
      console.log(`      ${tabExists ? '✅' : '❌'} ${tab}`);
    }
    
    // 4. 골프장 목록 확인
    console.log('\n4️⃣ 골프장 목록 페이지 접근');
    await page.goto('http://localhost:3003/golf-courses');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'screenshots/05-golf-courses.png' });
    
    const golfCourseItems = await page.locator('[data-golf-course], tr:has(td)').count();
    console.log(`   ${golfCourseItems > 0 ? '✅' : '❌'} 골프장 목록: ${golfCourseItems}개 항목`);
    
    // 5. 회원 관리 페이지
    console.log('\n5️⃣ 회원 관리 페이지 접근');
    await page.goto('http://localhost:3003/members');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'screenshots/06-members.png' });
    
    const memberItems = await page.locator('[data-member], tr:has(td)').count();
    console.log(`   ${memberItems > 0 ? '✅' : '❌'} 회원 목록: ${memberItems}개 항목`);
    
    // 6. 실적 관리 페이지
    console.log('\n6️⃣ 실적 관리 페이지 접근');
    await page.goto('http://localhost:3003/performance');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'screenshots/07-performance.png' });
    
    // 7. 반응형 디자인 테스트
    console.log('\n7️⃣ 반응형 디자인 테스트');
    
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/tee-times');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-mobile-view.png' });
    console.log('   ✅ 모바일 뷰 스크린샷 저장');
    
    // 태블릿 뷰포트
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/09-tablet-view.png' });
    console.log('   ✅ 태블릿 뷰 스크린샷 저장');
    
    // 데스크톱으로 복원
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 8. CRUD 기능 검증 요약
    console.log('\n📊 검증 결과 요약:');
    console.log('='.repeat(50));
    
    const results = {
      '페이지 접근성': '테스트 완료',
      '로그인 기능': '테스트 완료',
      'Matrix View': '테스트 완료',
      '골프장 관리': '테스트 완료',
      '회원 관리': '테스트 완료',
      '실적 관리': '테스트 완료',
      '반응형 디자인': '테스트 완료'
    };
    
    for (const [feature, status] of Object.entries(results)) {
      console.log(`   ${feature}: ${status}`);
    }
    
    console.log('\n💡 권장사항:');
    console.log('   1. 실제 데이터가 없어 CRUD 동작 확인이 제한적');
    console.log('   2. 데이터베이스 시드 데이터 추가 필요');
    console.log('   3. API 엔드포인트 구현 완료 필요');
    console.log('   4. 실시간 업데이트 메커니즘 구현 필요');
    console.log('   5. 에러 처리 및 로딩 상태 개선 필요');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  }
  
  console.log('\n테스트 완료! 브라우저를 10초 후 종료합니다...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

// 실행
validateGolfReservationSystem().catch(console.error);