import { test, expect } from '@playwright/test'
import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'

chromium.use(stealth())

test('real-user smoke', async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()
  await page.goto(process.env.TARGET_URL || 'https://example.com', { waitUntil: 'networkidle' })
  await expect(page).not.toHaveURL(/error|500|403|401/i)
  await browser.close()
})