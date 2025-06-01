import { chromium } from 'playwright';
import fs from 'fs';

// Google登录流程
async function authenticateWithGoogle() {
  // 启动可视化浏览器
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    viewport: null
  });

  const page = await context.newPage();
  
  try {
    console.log('请手动完成Google登录...');
    
    // 导航到目标网站登录页
    await page.goto('https://housesigma.com/bc/mission-real-estate/38-41168-lougheed-highway/home/N0A9X3jKoZ4YvgxV/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 等待并点击Google登录按钮
    const googleBtn = await page.waitForSelector('button:has-text("Google")', { timeout: 30000 });
    await googleBtn.click();
    
    // 等待用户手动完成登录
    await page.waitForNavigation({ 
      url: /housesigma\.com/, 
      timeout: 300000 // 5分钟超时
    });

    // 保存认证状态
    const storage = await context.storageState();
    fs.writeFileSync('auth_state.json', JSON.stringify(storage, null, 2));
    
    console.log('✅ 登录成功！认证状态已保存到 auth_state.json');
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    await browser.close();
  }
}

// 使用示例
authenticateWithGoogle().catch(console.error);
