import { chromium } from 'playwright'

async function testMatrixView() {
  console.log('🚀 Matrix View 테스트 시작...')
  
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  })
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  
  const page = await context.newPage()
  
  try {
    // 1. 메인 페이지 접속
    console.log('📱 메인 페이지 접속 중...')
    await page.goto('http://localhost:3004')
    await page.waitForTimeout(2000)
    
    // 현재 페이지 스크린샷
    console.log('📸 메인 페이지 스크린샷')
    await page.screenshot({ 
      path: 'screenshots/01-main-page.png', 
      fullPage: true 
    })
    
    // 2. 티타임 페이지로 이동 (인증 없이 가능한지 확인)
    console.log('🏌️ 티타임 페이지 접속 시도...')
    await page.goto('http://localhost:3004/tee-times')
    await page.waitForTimeout(3000)
    
    // 페이지 제목 확인
    const title = await page.title()
    console.log(`📄 페이지 제목: ${title}`)
    
    // 현재 URL 확인
    console.log(`🔗 현재 URL: ${page.url()}`)
    
    // Matrix Table 요소 확인
    const matrixTable = await page.locator('div[class*="space-y-4"]').first()
    const isVisible = await matrixTable.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isVisible) {
      console.log('✅ Matrix View 컴포넌트가 로드되었습니다!')
      
      // 탭 요소들 확인
      const tabs = await page.locator('div[role="tablist"]').first()
      const tabsVisible = await tabs.isVisible().catch(() => false)
      
      if (tabsVisible) {
        console.log('✅ 탭 시스템이 정상적으로 로드되었습니다!')
        
        // 각 탭 클릭 테스트
        const tabButtons = await page.locator('button[role="tab"]').all()
        console.log(`📊 발견된 탭 개수: ${tabButtons.length}`)
        
        for (let i = 0; i < Math.min(tabButtons.length, 4); i++) {
          const tabText = await tabButtons[i].textContent()
          console.log(`🔄 탭 "${tabText}" 클릭 테스트...`)
          
          await tabButtons[i].click()
          await page.waitForTimeout(1000)
          
          // API 호출 대기
          const apiResponse = await page.waitForResponse(
            response => response.url().includes('/api/tee-times/matrix'),
            { timeout: 10000 }
          ).catch(() => null)
          
          if (apiResponse) {
            console.log(`✅ API 호출 성공: ${apiResponse.status()}`)
            const responseData = await apiResponse.json().catch(() => null)
            if (responseData) {
              console.log(`📊 골프장 수: ${responseData.summary?.totalGolfCourses || '불명'}`)
              console.log(`🏌️ 티타임 수: ${responseData.summary?.totalTeeTimes || '불명'}`)
            }
          } else {
            console.log('⚠️  API 응답 없음 또는 타임아웃')
          }
          
          // 스크린샷
          await page.screenshot({ 
            path: `screenshots/02-tab-${i+1}-${tabText?.replace(/\s+/g, '-')}.png`, 
            fullPage: true 
          })
        }
        
        // 스크롤 테스트
        console.log('📜 수평 스크롤 테스트...')
        const scrollContainer = page.locator('div[class*="overflow-x-auto"]').first()
        
        if (await scrollContainer.isVisible()) {
          // 오른쪽으로 스크롤
          await scrollContainer.evaluate(el => {
            el.scrollLeft = 500
          })
          await page.waitForTimeout(1000)
          await page.screenshot({ 
            path: 'screenshots/03-scroll-right.png', 
            fullPage: true 
          })
          
          console.log('✅ 수평 스크롤 동작 확인됨')
        }
        
      } else {
        console.log('❌ 탭 시스템을 찾을 수 없습니다')
      }
      
    } else {
      console.log('❌ Matrix View 컴포넌트를 찾을 수 없습니다')
      console.log('현재 페이지 내용:')
      const bodyText = await page.textContent('body')
      console.log(bodyText?.substring(0, 500))
    }
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'screenshots/04-final-state.png', 
      fullPage: true 
    })
    
    console.log('✅ 테스트 완료!')
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
    await page.screenshot({ 
      path: 'screenshots/error.png', 
      fullPage: true 
    })
  } finally {
    // 5초 후 브라우저 종료
    console.log('⏳ 5초 후 브라우저를 종료합니다...')
    await page.waitForTimeout(5000)
    await browser.close()
  }
}

// 스크린샷 디렉토리 생성
import { mkdirSync } from 'fs'
try {
  mkdirSync('screenshots', { recursive: true })
} catch {}

testMatrixView().catch(console.error)