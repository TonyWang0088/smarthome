import { chromium } from 'playwright';

export async function getHouseSigmaHeaders(url: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 监听请求
  let targetHeaders = {};
  page.on('request', request => {
    if (request.url().includes('detail_v2')) {
      targetHeaders = request.headers();
    }
  });

  try {
    console.log('正在访问页面获取headers...');
    // 增加超时到60秒
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // 模拟用户行为
    await page.waitForTimeout(2000);
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(3000);

    // 检查是否被重定向到验证页面
    if (page.url().includes('verify') || page.url().includes('challenge')) {
      throw new Error('触发验证机制，请手动解决验证后再试');
    }
    
    if (Object.keys(targetHeaders).length === 0) {
      // 尝试直接触发API请求
      await page.evaluate(() => {
        fetch('https://housesigma.com/bkv2/api/listing/info/detail_v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: 'en_US',
            province: 'BC',
            id_listing: window.location.href.match(/id_listing=([^&]+)/)[1]
          })
        });
      });
      await page.waitForTimeout(5000);
    }

    if (Object.keys(targetHeaders).length === 0) {
      throw new Error('未能捕获到API请求headers，可能需要手动解决验证');
    }

    console.log('成功获取headers:', Object.keys(targetHeaders));
  } catch (error) {
    console.error('获取headers失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 示例使用
/*
getHouseSigmaHeaders('https://housesigma.com/bc/mission-real-estate/38-41168-lougheed-highway/home/N0A9X3jKoZ4YvgxV/')
  .then(headers => console.log('可用headers:', headers))
  .catch(console.error);
*/
