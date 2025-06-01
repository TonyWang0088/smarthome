import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// 确保认证文件存储在项目根目录下
const AUTH_FILE = path.resolve('/mnt/d/git/smarthome/server/crawler', '../../..', 'housesigma_auth.json');

// 确保目录存在
const ensureAuthDirExists = () => {
  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 网站账号登录并保存状态
export async function loginAndSaveAuth() {
    
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
        console.log('导航到网站登录页...');
        await page.goto('https://housesigma.com/', { 
            waitUntil: 'networkidle',
            timeout: 60000 
        });

        console.log('请在浏览器中完成以下步骤:');
        console.log('1. 输入您的账号密码');
        console.log('2. 完成任何验证步骤');
        console.log('3. 确保登录后右上角不再显示"Log in"按钮');
        console.log('4. 等待脚本自动检测登录状态');

        // 等待登录成功
        await page.waitForNavigation({
            url: url => !url.pathname.includes('login'),
            timeout: 300000 // 5分钟超时
        });

        // 验证登录状态 - 检查右上角没有"Log in"按钮
        const isLoggedIn = await page.evaluate(() => {
            const loginButtons = Array.from(document.querySelectorAll('*'))
                .filter(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    return text.includes('Log in') || text.includes('login');
                });
            return loginButtons.length === 0;
        });

        if (!isLoggedIn) {
            console.error('❌ 登录验证失败: 页面右上角仍显示登录按钮');
            throw new Error('登录状态验证失败');
        }

        console.log('✅ 登录状态验证通过 - 未检测到登录按钮');

        // 保存认证状态
        ensureAuthDirExists();
        const state = await context.storageState();
        fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2));
        console.log(`认证文件路径: ${AUTH_FILE}`);
        console.log('✅ 登录成功！认证状态已保存');

    } catch (error) {
        console.error('登录失败:', error);
        if (fs.existsSync(AUTH_FILE)) {
            fs.unlinkSync(AUTH_FILE);
        }
    } finally {
        await browser.close();
    }
}

// 检查是否有有效认证
export function hasValidAuth() {
    return fs.existsSync(AUTH_FILE);
}

// 运行登录流程
loginAndSaveAuth().catch(console.error);
