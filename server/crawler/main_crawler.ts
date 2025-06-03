import { chromium } from 'playwright';
import { type InsertHouseProperty } from '@shared/schema';
import { 
  generateCreateTableSql,
  generateInsertSql,
  importToDatabase
} from './db_action.js';

// 爬取housesigma房产详情
export async function crawlHouseSigmaProperty(url: string) {
  // 认证文件路径
  const AUTH_FILE = '/mnt/d/git/housesigma_auth.json';
  
  // 检查认证状态
  async function hasValidAuth() {
    try {
      // 动态导入fs模块
      const { default: fs } = await import('fs');
      const { default: path } = await import('path');
      
      // 检查文件是否存在且非空
      if (!fs.existsSync(AUTH_FILE) || fs.statSync(AUTH_FILE).size === 0) {
        return false;
      }
      
      // 验证文件内容有效性
      const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      return authData && 
             authData.cookies && 
             authData.cookies.length > 0 &&
             authData.origins &&
             authData.origins.some(o => o.origin.includes('housesigma'));
    } catch (error) {
      console.error('认证文件验证失败:', error.message);
      return false;
    }
  }
  
  // 配置浏览器参数
  const browserArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ];
  
  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: false,
    args: browserArgs
  });
  
  // 创建上下文（加载认证状态如果存在）
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    ...((await hasValidAuth()) ? { storageState: AUTH_FILE } : {}),
    bypassCSP: true,
    javaScriptEnabled: true
  });
  const page = await context.newPage();

  try {
    console.log('正在访问房产页面:', url);
    
    // 详细记录所有网络请求
    page.on('request', request => {
      if (request.url().includes('detail_v2')) {
        console.log('\n=== 请求详情 ===');
        console.log('URL:', request.url());
        console.log('方法:', request.method());
        console.log('请求头:', JSON.stringify(request.headers(), null, 2));
        console.log('认证状态:', hasValidAuth() ? '已加载' : '未使用');
      }
    });

    // 详细记录API响应
    let propertyData = null;
    page.on('response', async response => {
      if (response.url().includes('detail_v2')) {
        try {
          console.log('\n=== 响应详情 ===');
          console.log('状态码:', response.status());
          console.log('响应头:', JSON.stringify(response.headers(), null, 2));
          
          const data = await response.json();
          //console.log('响应体:', JSON.stringify(data, null, 2));
          
          if (data && data.data) {
            propertyData = data.data;
            console.log('✅ 成功获取房产数据');
          }
        } catch (e) {
          console.error('❌ 解析API响应失败:', e);
        }
      }
    });

    // 强制认证检查 - 未认证则退出
    if (!hasValidAuth()) {
      console.error('\n❌ 错误: 无效的认证状态');
      console.error('认证文件路径:', AUTH_FILE);
      console.error('可能原因:');
      console.error('1. 认证文件不存在或为空');
      console.error('2. 认证文件内容格式不正确');
      console.error('3. 认证已过期');
      console.error('\n解决方案:');
      console.error('1. 运行登录脚本: npx tsx website_login.ts');
      console.error('2. 完成网站登录流程');
      console.error('3. 检查认证文件内容:');
      console.error(`   cat ${AUTH_FILE} | jq .`);
      console.error('4. 删除无效认证文件并重新登录:');
      console.error(`   rm ${AUTH_FILE} && npx tsx website_login.ts`);
      process.exit(1);
    }
    
    console.log('\n✅ 认证检查通过');
    console.log('认证文件:', AUTH_FILE);
    
    // 模拟真实用户行为 - 增加重试机制
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 90000 
        });
        
        // 随机延迟和交互
        await page.waitForTimeout(Math.random() * 3000 + 2000);
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(Math.random() * 2000 + 1000);
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(3000);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`重试中...剩余尝试次数: ${retries}`);
        await page.waitForTimeout(5000);
      }
    }
    
    // 检查数据获取结果
    if (!propertyData) {
      console.error('\n❌ 数据获取失败');
      console.error('详细诊断:');
      console.error('1. 检查网络请求日志确认API调用');
      console.error('2. 验证认证文件是否有效:', AUTH_FILE);
      console.error('3. 尝试手动访问目标URL测试');
      console.error('立即解决方案:');
      console.error('npx tsx website_login.ts # 更新认证');
      throw new Error('房产数据获取失败');
    }

    // 验证必要字段
    const listingId = propertyData?.house?.id_listing || propertyData?.id_listing;
    if (!listingId) {
      console.error('❌ 数据验证失败: 缺少id_listing字段');
      console.error('可能的数据位置:');
      console.error('1. propertyData.id_listing:', propertyData?.id_listing);
      console.error('2. propertyData.house.id_listing:', propertyData?.house?.id_listing);
      //console.error('完整响应数据:', JSON.stringify(propertyData, null, 2));
      throw new Error('房产数据缺少必要字段: id_listing');
    }

    // 打印结构化数据
    console.log('获取到的房产原始数据:');
    // console.log(JSON.stringify({
    //   basicInfo: {
    //     listingId: propertyData.id_listing,
    //     address: propertyData.address,
    //     price: propertyData.price,
    //     bedrooms: propertyData.bedrooms,
    //     bathrooms: propertyData.bathrooms
    //   },
    //   details: {
    //     propertyType: propertyData.property_type,
    //     squareFeet: propertyData.square_feet,
    //     yearBuilt: propertyData.year_built
    //   }
    // }, null, 2));

    // 转换数据格式
    let houseProperty;
    //try {
      // 验证id_listing字段
      //const listingId = propertyData?.house?.id_listing || propertyData?.id_listing;
      if (!listingId) {
        console.error('❌ 数据验证失败: 缺少id_listing字段');
        //console.error('完整响应数据:', JSON.stringify(propertyData, null, 2));
        throw new Error('房产数据缺少必要字段: id_listing');
      }

      houseProperty = transformHouseSigmaData({
        ...propertyData,
        assessment: propertyData.assessment,
        picture: propertyData.picture,
        key_facts_v2: propertyData.key_facts_v2,
        property_detail: propertyData.property_detail,
        listing_history: propertyData.listing_history,
        rooms: propertyData.rooms,
        community_stats: propertyData.community_stats,
        analytics: propertyData.analytics
      });
      console.log('✅ 数据转换成功');
      console.log('[DEBUG]:')
    //   console.log(houseProperty)
      console.log('转换后的数据库记录:');
      console.log(JSON.stringify({
        listingId: houseProperty.listingId,
        address: houseProperty.address,
        price: houseProperty.price,
        propertyType: houseProperty.propertyType
      }, null, 2));
    // } catch (error) {
    //   console.error('❌ 数据转换失败:', error);
    //   console.error('原始数据:', JSON.stringify(propertyData, null, 2));
    //   throw new Error('房产数据转换失败');
    // }
    
    // 生成建表SQL
    const createTableSql = generateCreateTableSql();
    
    // 生成插入SQL
    const insertSql = generateInsertSql(houseProperty);
    
    // 导入数据到数据库
    console.log('准备导入数据:', houseProperty);
    try {
      await importToDatabase(houseProperty);
      console.log('数据导入成功');
    } catch (e) {
      console.error('数据导入失败:', e);
      throw e;
    }
    
    return {
      createTableSql,
      insertSql,
      property: houseProperty
    };
  } catch (error) {
    console.error('爬取HouseSigma房产信息失败:');
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但无响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    // // 添加重试建议
    // console.log('\n建议:');
    // console.log('1. 检查网络连接');
    // console.log('2. 尝试更换IP地址');
    // console.log('3. 等待几分钟后重试');
    // console.log('4. 检查housesigma网站是否更新了API机制');
    
    throw error;
  }
}

// 从URL中提取listing ID
function extractListingId(url: string): string | null {
  const match = url.match(/id_listing=([^&]+)/);
  return match ? match[1] : null;
}

// 生成签名 (示例实现，实际签名算法可能需要根据API文档调整)
async function generateSignature(listingId: string, timestamp: number): Promise<string> {
  // 使用Web Crypto API替代Node.js的crypto模块
//   const secret = 'your_api_secret'; // 需要替换为实际值
//   const strToSign = `${listingId}|${timestamp}|${secret}`;
  
//   const encoder = new TextEncoder();
//   const data = encoder.encode(strToSign);
//   const hashBuffer = await crypto.subtle.digest('MD5', data);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "463ca1068c6c37dfcde0205f68b21926"
  //return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 导入数据库操作方法
import { 
  transformHouseSigmaData,
  importToDatabase,
  generateCreateTableSql,
  generateInsertSql
} from './db_action.js';


// 示例使用
crawlHouseSigmaProperty('https://housesigma.com/bc/langley-real-estate/81-20071-24-avenue/home/N0A9X3jmGPD7vgxV?id_listing=xLkv3V6ogAz3DBNr')
.then(result => {
    console.log('建表SQL:', result.createTableSql);
    console.log('插入SQL:', result.insertSql);
    console.log('导入成功:', result.property);
});
