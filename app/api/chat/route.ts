import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';
import stocksConfig from '../../config/hk-stocks.json';
import stockConnectKnowledge from '../../config/stock-connect-knowledge.json';

// 记录用户问题 - 改为调用API进行持久化存储
function recordUserQuestion(data: {
  userId?: string;
  userEmail?: string;
  userName?: string;
  expertId: string;
  expertName: string;
  companyName?: string;
  projectContent?: string;
  question: string;
  answer: string;
  sessionId?: string;
  stockCodes?: string;
}) {
  try {
    // 调用持久化API保存问题
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/user-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expertId: data.expertId,
        expertName: data.expertName,
        companyName: data.companyName || '',
        projectContent: data.projectContent || '',
        question: data.question,
        answer: data.answer,
        sessionId: data.sessionId || '',
        stockCodes: data.stockCodes || ''
      })
    }).catch(err => console.error('记录问题失败:', err));
  } catch (error) {
    console.error('记录问题失败:', error);
  }
}

// 港股通知识库类型定义
type StockConnectInfo = {
  name?: string;
  nameEn?: string;
  industry?: string;
  stockConnectStatus?: string;
  connectType?: string;
  hsciType?: string;
  inclusionDate?: string;
  notes?: string;
};

// 港股通知识库 - 添加类型断言
const stockConnectData = stockConnectKnowledge as { stocks?: Record<string, StockConnectInfo> };
const STOCK_CONNECT_MAP: Record<string, StockConnectInfo> = stockConnectData.stocks || {};

// 获取港股通状态
function getStockConnectInfo(stockCode: string): any {
  const normalizedCode = normalizeStockCode(stockCode);
  for (const [key, info] of Object.entries(STOCK_CONNECT_MAP)) {
    if (key.toLowerCase() === normalizedCode.toLowerCase()) {
      return {
        stockConnectStatus: info.stockConnectStatus || '未知',
        connectType: info.connectType || '',
        hsciType: info.hsciType || '',
        inclusionDate: info.inclusionDate || '',
        notes: info.notes || ''
      };
    }
  }
  return null;
}

// Azure OpenAI 配置 - 使用环境变量
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

// 腾讯财经API基础URL
const TENCENT_FINANCE_API = 'https://qt.gtimg.cn/q=';

// Yahoo Finance API (主要数据源，免费，无需API密钥)
const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart/';

// 新浪财经API (免费备用方案)
const SINA_FINANCE_API = 'https://hq.sinajs.cn/list=hk';

// 从外部JSON加载港股股票映射表
// 股票信息类型定义
type StockInfo = {
  name: string;
  nameEn: string;
  industry: string;
  listedDate?: string;
  stockConnectStatus?: string;
  connectType?: string;
  hsciType?: string;
  inclusionDate?: string;
};

// 处理stocksConfig的类型问题，使用类型断言
const stocksData = stocksConfig as { stocks?: Record<string, StockInfo> };
const HK_STOCK_MAP: Record<string, StockInfo> = stocksData.stocks || {};

// 备用股票映射 - 确保基本股票能识别
const FALLBACK_STOCK_MAP: Record<string, StockInfo> = {
  '00100.hk': { name: 'MiniMax-WP', nameEn: 'MiniMax', industry: '人工智能' },
  '02575.hk': { name: '轩竹生物', nameEn: 'Xuanzhu Biotech', industry: '生物医药' },
  '02655.hk': { name: '果下科技', nameEn: 'Guoxia Technology', industry: '科技' },
  '00700.hk': { name: '腾讯控股', nameEn: 'Tencent Holdings', industry: '互联网' },
  '09988.hk': { name: '阿里巴巴-SW', nameEn: 'Alibaba Group', industry: '互联网' },
  '03690.hk': { name: '美团-W', nameEn: 'Meituan', industry: '互联网' },
  '01810.hk': { name: '小米集团-W', nameEn: 'Xiaomi Group', industry: '互联网' },
  '02418.hk': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网' },
  '02659.hk': { name: '宝济药业-B', nameEn: 'Baoji Pharma', industry: '生物医药' },
  '06030.hk': { name: '中信证券', nameEn: 'CITIC Securities', industry: '金融' },
  '02318.hk': { name: '中国平安', nameEn: 'Ping An', industry: '保险' },
  '00981.hk': { name: '中芯国际', nameEn: 'SMIC', industry: '半导体' },
  '02628.hk': { name: '中国人寿', nameEn: 'China Life', industry: '保险' },
  '01398.hk': { name: '工商银行', nameEn: 'ICBC', industry: '银行' },
  '00939.hk': { name: '建设银行', nameEn: 'CCB', industry: '银行' },
  '03988.hk': { name: '中国银行', nameEn: 'BOC', industry: '银行' },
  '00005.hk': { name: '汇丰控股', nameEn: 'HSBC', industry: '银行' },
  '02333.hk': { name: '长城汽车', nameEn: 'Great Wall Motor', industry: '汽车' },
  '09868.hk': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源汽车' },
  '09881.hk': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源汽车' },
  '02219.hk': { name: '复星医药', nameEn: 'Fosun Pharma', industry: '医药' },
  '06677.hk': { name: '药明康德', nameEn: 'WuXi AppTec', industry: '医药' },
  '02269.hk': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '01928.hk': { name: '金沙中国', nameEn: 'Las Vegas Sands', industry: '博彩旅游' },
  '00027.hk': { name: '银河娱乐', nameEn: 'Galaxy Entertainment', industry: '博彩旅游' },
  '00388.hk': { name: '香港交易所', nameEn: 'HKEX', industry: '金融' },
  '01109.hk': { name: '华润置地', nameEn: 'CR Land', industry: '房地产' },
  '02020.hk': { name: '安踏体育', nameEn: 'ANTA Sports', industry: '消费' },
  '09999.hk': { name: '网易-S', nameEn: 'NetEase', industry: '互联网' },
  '09699.hk': { name: '携程集团-S', nameEn: 'Trip.com', industry: '互联网' },
  '02559.hk': { name: '快手-W', nameEn: 'Kuaishou', industry: '互联网' },
  '01877.hk': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药' },
  '00099.hk': { name: '中国通信服务', nameEn: 'China Communications Services', industry: '通信' },
  '02382.hk': { name: '舜宇光学科技', nameEn: 'Sunny Optical', industry: '光学' },
  '00002.hk': { name: '中电控股', nameEn: 'CLP Holdings', industry: '公用事业' },
  '00003.hk': { name: '香港中华煤气', nameEn: 'HK & China Gas', industry: '公用事业' },
  '00011.hk': { name: '恒生银行', nameEn: 'Hang Seng Bank', industry: '银行' },
  '00175.hk': { name: '吉利汽车', nameEn: 'Geely Automobile', industry: '汽车' },
  '00728.hk': { name: '中国电信', nameEn: 'China Telecom', industry: '通信' },
  '00998.hk': { name: '中银香港', nameEn: 'BOCHK', industry: '银行' },
  '03968.hk': { name: '招商银行', nameEn: 'CMB', industry: '银行' },
  '01919.hk': { name: '中远海控', nameEn: 'COSCO Shipping', industry: '航运' },
  '06690.hk': { name: '海尔智家', nameEn: 'Haier Smart Home', industry: '消费' },
  '00291.hk': { name: '华润啤酒', nameEn: 'CR Beer', industry: '消费' },
  '03606.hk': { name: '蒙牛乳业', nameEn: 'Mengniu Dairy', industry: '消费' },
  '01093.hk': { name: '石药集团', nameEn: 'CSPC Pharmaceutical', industry: '医药' },
  '06618.hk': { name: '京东健康', nameEn: 'JD Health', industry: '互联网医疗' },
  '01548.hk': { name: '金斯瑞生物科技', nameEn: 'GenScript Biotech', industry: '生物医药' },
  '01801.hk': { name: '信达生物', nameEn: 'Innovent Biologics', industry: '生物医药' },
  '09618.hk': { name: '百度集团-SW', nameEn: 'Baidu', industry: '互联网' },
  '02569.hk': { name: '再鼎医药', nameEn: 'Zai Lab', industry: '生物医药' },
  '09939.hk': { name: '康方生物', nameEn: 'Akeso', industry: '生物医药' },
  '01531.hk': { name: '康希诺生物', nameEn: 'CanSino Biologics', industry: '生物医药' },
  // 2024-2025年新上市热门股票
  '02588.hk': { name: '老铺黄金', nameEn: 'Laopu Gold', industry: '消费' },
  '09668.hk': { name: '周杰伦概念股', nameEn: 'Star Legend', industry: '消费' },
  '03883.hk': { name: '中国游乐设施', nameEn: 'China Amusement Parks', industry: '消费' },
  '06808.hk': { name: '京东物流', nameEn: 'JD Logistics', industry: '物流' },
  '06699.hk': { name: '泡泡玛特', nameEn: 'Pop Mart', industry: '消费' },
  '09969.hk': { name: '诺诚健华', nameEn: 'Innovent Biologics', industry: '生物医药' },
  '09922.hk': { name: '嘉和生物', nameEn: 'Genor Biopharma', industry: '生物医药' },
  '09955.hk': { name: '康诺亚生物', nameEn: 'Keymed Biosciences', industry: '生物医药' },
  '06613.hk': { name: '医渡科技', nameEn: 'Yidu Tech', industry: '医疗科技' },
  '02586.hk': { name: '上海微创软件', nameEn: 'Shanghai Wicresoft', industry: '软件' },
  '03678.hk': { name: '丙晟科技', nameEn: 'Binglang Technology', industry: '科技' },
  '00756.hk': { name: '森美控股', nameEn: 'Sino-US United Holdings', industry: '消费' },
  '01440.hk': { name: '应星控股', nameEn: 'Star Shine Holding', industry: '综合' },
  '02587.hk': { name: '健康之路', nameEn: 'Jiankangzhilu', industry: '医疗健康' },
};

// 合并两个数据源
const COMBINED_STOCK_MAP: Record<string, StockInfo> = { ...FALLBACK_STOCK_MAP, ...HK_STOCK_MAP };

// 港股股票代码规范化
function normalizeStockCode(code: string): string {
  let normalized = code.trim().toLowerCase();  // 改为小写
  if (normalized.endsWith('.hk')) {
    return normalized;
  }
  if (/^\d+$/.test(normalized)) {
    return `${normalized}.hk`;
  }
  return normalized;
}

// 提取消息中的股票代码 - 增强版
function extractStockCodes(message: string): string[] {
  const codes: string[] = [];
  
  // 模式1: 5位数字 (如 02659, 00700) - 带边界
  const pattern1 = /\b(0\d{4,5})\b/g;
  let match;
  while ((match = pattern1.exec(message)) !== null) {
    codes.push(match[1]);
  }
  
  // 模式2: 已有完整格式 (如 02659.hk, 00700.HK)
  const pattern2 = /\b(\d{5})\.hk\b/gi;
  while ((match = pattern2.exec(message)) !== null) {
    codes.push(match[1]);
  }
  
  // 模式3: 括号中的代码 (如 (02659))
  const pattern3 = /\((\d{5})\)/g;
  while ((match = pattern3.exec(message)) !== null) {
    codes.push(match[1]);
  }
  
  // 模式4: 中文/英文关键词后的代码 (如 "股票02659" "代码02659" "帮我查02659")
  const pattern4 = /[股票代码号查询帮看看查下].*?(\d{5})/g;
  while ((match = pattern4.exec(message)) !== null) {
    if (match[1].startsWith('0')) {
      codes.push(match[1]);
    }
  }
  
  // 模式5: 纯5位数字（不以0开头但可能是港股，如 3888.hk）
  const pattern5 = /(?<![0-9])([1-9]\d{4})(?![0-9])/g;
  while ((match = pattern5.exec(message)) !== null) {
    codes.push(match[1]);
  }
  
  // 去重并标准化
  const uniqueCodes = [...new Set(codes)];
  
  return uniqueCodes
    .map(code => {
      const cleaned = code.padStart(5, '0').slice(-5);
      return cleaned + '.hk';
    })
    .filter(code => code.length === 6);
}

// 获取股票数据 - 优先本地映射，确保名称准确
async function getStockData(stockCode: string): Promise<any> {
  const normalizedCode = normalizeStockCode(stockCode);
  console.log('getStockData called for:', stockCode, 'normalized:', normalizedCode);
  console.log('COMBINED_STOCK_MAP keys (sample):', Object.keys(COMBINED_STOCK_MAP).slice(0, 10));
  
  let localInfo = null;
  
  // 1. 首先从本地映射获取公司名称（这是最准确的）
  for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
    if (key.toLowerCase() === normalizedCode.toLowerCase()) {
      console.log('Found match:', key, info);
      localInfo = { code: key, ...info };
      break;
    }
  }
  
  // 如果本地有记录，即使API失败也返回本地数据
  if (localInfo) {
    // 尝试获取API数据
    const apiResult = await getStockDataFromAPI(stockCode).catch(() => null);
    // 获取港股通状态
    const connectInfo = getStockConnectInfo(stockCode);
    
    if (apiResult && apiResult.price > 0) {
      // API成功，合并数据
      return {
        code: apiResult.code || localInfo.code.toUpperCase(),
        name: localInfo.name,
        nameEn: localInfo.nameEn,
        industry: localInfo.industry,
        price: apiResult.price,
        change: apiResult.change,
        changePct: apiResult.changePct,
        marketCap: apiResult.marketCap,
        turnover: apiResult.turnover,
        source: 'realtime',
        stockConnectStatus: connectInfo?.stockConnectStatus || null,
        connectType: connectInfo?.connectType || null,
        hsciType: connectInfo?.hsciType || null,
        inclusionDate: connectInfo?.inclusionDate || null
      };
    }
    
    // API失败，返回本地数据
    return {
      code: localInfo.code.toUpperCase(),
      name: localInfo.name,
      nameEn: localInfo.nameEn,
      industry: localInfo.industry,
      price: 0,
      change: 0,
      changePct: 0,
      marketCap: 0,
      turnover: 0,
      source: 'local',
      stockConnectStatus: connectInfo?.stockConnectStatus || null,
      connectType: connectInfo?.connectType || null,
      hsciType: connectInfo?.hsciType || null,
      inclusionDate: connectInfo?.inclusionDate || null
    };
  }
  
  // 2. 尝试从API获取实时数据
  const apiResult = await getStockDataFromAPI(stockCode);
  
  if (apiResult) {
    return apiResult;
  }
  
  // 3. 完全查不到
  return null;
}

// 直接从本地映射获取股票数据（同步函数，不需要API）
function getStockDataDirect(stockCode: string): any {
  const normalizedCode = normalizeStockCode(stockCode);
  console.log('getStockDataDirect called for:', stockCode, 'normalized:', normalizedCode);
  
  for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
    if (key.toLowerCase() === normalizedCode.toLowerCase()) {
      console.log('Direct match found:', key, info);
      return {
        code: key.toUpperCase(),
        name: info.name,
        nameEn: info.nameEn,
        industry: info.industry,
        price: 0,
        change: 0,
        changePct: 0,
        marketCap: 0,
        turnover: 0,
        source: 'local'
      };
    }
  }
  return null;
}

// 使用搜索API获取新股信息
async function searchStockData(stockCode: string) {
  try {
    // 提取纯数字代码
    const codeNum = stockCode.replace(/\D/g, '').replace(/^0+/, '') || stockCode;
    const searchUrl = `https://www.google.com/search?q=${codeNum}.hk+股票+港股`;
    
    // 这里我们返回null，让AI知道查不到并提示用户
    // 注意：在生产环境中，可以使用付费的股票API如Bloomberg、Wind等
    console.log(`股票代码 ${stockCode} 未找到，尝试搜索...`);
    return null;
  } catch (error) {
    console.error('搜索股票数据失败:', error);
    return null;
  }
}

// 从Yahoo Finance获取股票数据 (免费，无需API密钥)
async function getStockDataFromYahoo(stockCode: string) {
  const normalizedCode = normalizeStockCode(stockCode);
  // 港股代码转换为Yahoo Finance格式: 02659.HK -> 02659.HK
  const symbol = normalizedCode.replace('.hk', '.HK');
  
  try {
    const url = `${YAHOO_FINANCE_API}${symbol}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.error('Yahoo Finance API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      if (meta && quote) {
        const currentPrice = meta.regularMarketPrice || 0;
        const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
        const change = currentPrice - previousClose;
        const changePct = previousClose > 0 ? (change / previousClose) * 100 : 0;
        
        return {
          code: normalizedCode.toUpperCase(),
          name: meta.shortName || meta.symbol || normalizedCode,
          price: currentPrice,
          change: change,
          changePct: parseFloat(changePct.toFixed(2)),
          volume: meta.regularMarketVolume || 0,
          amount: 0,
          marketCap: meta.marketCap || 0,
          turnover: meta.regularMarketVolume || 0,
          source: 'yahoo'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return null;
  }
}

// 从新浪财经API获取股票数据 (免费备用方案)
async function getStockDataFromSina(stockCode: string) {
  const normalizedCode = normalizeStockCode(stockCode);
  // 港股代码: 5位数字，如 00700 ->hk00700
  const codeNum = normalizedCode.replace('.hk', '');
  const sinaCode = `hk${codeNum}`;
  
  try {
    const url = `${SINA_FINANCE_API}${sinaCode}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.sina.com.cn',
      },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      console.error('Sina Finance API error:', response.status);
      return null;
    }

    const text = await response.text();
    
    // 解析返回数据: var hq00700="腾讯控股,407.800,408.200,406.000,408.200,405.600,405.800,405.600,5678237,2310983680.00,0,0,407.000,408.200,5200.00,407.000,0,0,0,0,0,0,0,0,0,0,0,0,0,0";
    const match = text.match(/="([^"]+)"/);
    
    if (!match || !match[1]) {
      return null;
    }

    const parts = match[1].split(',');
    
    if (parts.length >= 33) {
      const currentPrice = parseFloat(parts[1]) || 0;      // 当前价格
      const yesterdayClose = parseFloat(parts[2]) || 0;    // 昨日收盘价
      const open = parseFloat(parts[3]) || 0;              // 开盘价
      const high = parseFloat(parts[4]) || 0;              // 最高价
      const low = parseFloat(parts[5]) || 0;                // 最低价
      
      const change = currentPrice - yesterdayClose;
      const changePct = yesterdayClose > 0 ? (change / yesterdayClose) * 100 : 0;
      const volume = parseFloat(parts[8]) || 0;             // 成交量
      const amount = parseFloat(parts[9]) || 0;             // 成交额
      const apiCompanyName = parts[0] || '';                // API返回的公司名称
      
      return {
        code: normalizedCode.toUpperCase(),
        name: apiCompanyName || normalizedCode,             // 优先使用API返回的名称
        nameEn: '',
        industry: '未知',
        price: currentPrice,
        change: parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        volume: volume,
        amount: amount,
        marketCap: 0,  // 新浪API不提供市值
        turnover: volume,
        source: 'sina'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Sina Finance API error:', error);
    return null;
  }
}

// 从API获取股票数据（优先iTick，备用Yahoo/腾讯，始终返回本地数据）
async function getStockDataFromAPI(stockCode: string) {
  // 首先获取本地映射的公司信息
  const normalizedCode = normalizeStockCode(stockCode);
  let localInfo = null;
  for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
    if (key.toLowerCase() === normalizedCode.toLowerCase()) {
      localInfo = { code: key, ...info };
      break;
    }
  }
  
  // 直接使用Yahoo Finance作为主要数据源（免费，无需API密钥）
  console.log('=== 股票数据查询 ===');
  console.log('股票代码:', stockCode);
  console.log('尝试使用Yahoo Finance API...');
  
  const yahooResult = await getStockDataFromYahoo(stockCode);
  console.log('Yahoo结果:', yahooResult);
  
  if (yahooResult && yahooResult.price > 0) {
    console.log('Yahoo Finance API成功获取数据');
    return {
      code: yahooResult.code,
      name: localInfo ? localInfo.name : yahooResult.name,
      nameEn: localInfo ? localInfo.nameEn : '',
      industry: localInfo ? localInfo.industry : '未知',
      price: yahooResult.price,
      change: yahooResult.change,
      changePct: yahooResult.changePct,
      volume: yahooResult.volume,
      amount: yahooResult.amount,
      marketCap: yahooResult.marketCap,
      turnover: yahooResult.turnover,
      source: 'yahoo'
    };
  }
  
  console.log('Yahoo失败，尝试腾讯API...');
  
  // Yahoo失败时使用腾讯API备用方案
  try {
    // 规范化代码（移除.hk后缀用于API查询）
    const codeNum = stockCode.replace(/\.hk$/i, '').replace(/^0+/, '').padStart(5, '0');
    // 腾讯API港股需要添加hk前缀
    const url = `${TENCENT_FINANCE_API}hk${codeNum}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 } // 缓存60秒
    });

    if (!response.ok) {
      // API失败但本地有数据
      if (localInfo) {
        return {
          code: localInfo.code.toUpperCase(),
          name: localInfo.name,
          nameEn: localInfo.nameEn,
          industry: localInfo.industry,
          price: 0,
          change: 0,
          changePct: 0,
          volume: 0,
          amount: 0,
          marketCap: 0,
          turnover: 0,
          source: 'local'
        };
      }
      return null;
    }

    const text = await response.text();
    const match = text.match(/="([^"]+)"/);
    
    if (!match || !match[1]) {
      // 解析失败但本地有数据
      if (localInfo) {
        return {
          code: localInfo.code.toUpperCase(),
          name: localInfo.name,
          nameEn: localInfo.nameEn,
          industry: localInfo.industry,
          price: 0,
          change: 0,
          changePct: 0,
          volume: 0,
          amount: 0,
          marketCap: 0,
          turnover: 0,
          source: 'local'
        };
      }
      return null;
    }

    const dataParts = match[1].split(',');
    
    if (dataParts.length < 50) {
      // 数据不完整但本地有数据
      if (localInfo) {
        return {
          code: localInfo.code.toUpperCase(),
          name: localInfo.name,
          nameEn: localInfo.nameEn,
          industry: localInfo.industry,
          price: 0,
          change: 0,
          changePct: 0,
          volume: 0,
          amount: 0,
          marketCap: 0,
          turnover: 0,
          source: 'local'
        };
      }
      return null;
    }

    // 腾讯API返回的数据
    const price = parseFloat(dataParts[1]) || 0;
    const change = parseFloat(dataParts[2]) || 0;
    const changePct = parseFloat(dataParts[3]) || 0;
    const volume = parseInt(dataParts[6]) || 0; // 成交量
    const amount = parseFloat(dataParts[37]) || 0; // 成交额
    const marketCap = parseFloat(dataParts[45]) || 0; // 港股市值（单位：港币）
    const turnover = parseFloat(dataParts[38]) || 0; // 成交量
    // 腾讯API返回的公司名称在第一个元素
    const apiCompanyName = dataParts[0] || '';
    const apiCompanyNameEn = dataParts[56] || ''; // 英文名

    return {
      code: codeNum + '.HK',
      // 优先使用API返回的公司名称（更准确），本地配置作为备用
      name: apiCompanyName || (localInfo ? localInfo.name : '未知'),
      nameEn: apiCompanyNameEn || (localInfo ? localInfo.nameEn : ''),
      industry: localInfo ? localInfo.industry : (dataParts[57] || '未知'),
      price: price,
      change: change,
      changePct: changePct,
      volume: volume,
      amount: amount,
      marketCap: marketCap,
      turnover: turnover,
      source: 'tencent'
    };
  } catch (error) {
    console.error('获取股票数据失败:', error);
    // 异常时尝试新浪API
  }
  
  // 腾讯API失败时，尝试新浪财经API
  try {
    console.log('尝试使用新浪财经API...');
    const sinaResult = await getStockDataFromSina(stockCode);
    if (sinaResult && sinaResult.price > 0) {
      console.log('新浪财经API成功获取数据');
      return {
        code: sinaResult.code,
        name: localInfo ? localInfo.name : sinaResult.name,
        nameEn: localInfo ? localInfo.nameEn : '',
        industry: localInfo ? localInfo.industry : '未知',
        price: sinaResult.price,
        change: sinaResult.change,
        changePct: sinaResult.changePct,
        volume: sinaResult.volume,
        amount: sinaResult.amount,
        marketCap: sinaResult.marketCap,
        turnover: sinaResult.turnover,
        source: 'sina'
      };
    }
  } catch (sinaError) {
    console.error('新浪API也失败:', sinaError);
  }
  
  // 所有API都失败，返回本地数据
  if (localInfo) {
    return {
      code: localInfo.code.toUpperCase(),
      name: localInfo.name,
      nameEn: localInfo.nameEn,
      industry: localInfo.industry,
      price: 0,
      change: 0,
      changePct: 0,
      volume: 0,
      amount: 0,
      marketCap: 0,
      turnover: 0,
      source: 'local'
    };
  }
  return null;
}

// 调用Azure OpenAI API
async function callAzureOpenAI(messages: any[], temperature: number = 0.7, maxTokens: number = 2000) {
  try {
    // 确保至少4000 tokens，防止输出截断
    const finalMaxTokens = Math.max(maxTokens, 4000);
    console.log('callAzureOpenAI - maxTokens:', finalMaxTokens);
    
    const response = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: messages,
        temperature: temperature,
        max_tokens: finalMaxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Azure OpenAI API error:', error);
    throw error;
  }
}

// 定义可用的函数 - 股票查询工具
const FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "get_stock_info",
      description: "获取港股股票的基本信息和实时行情数据。当用户询问任何关于港股股票的问题时，必须先调用此函数获取准确的股票信息。",
      parameters: {
        type: "object",
        properties: {
          stock_code: {
            type: "string",
            description: "港股股票代码，格式如 00700、09988、02659（不需要.hk后缀）"
          }
        },
        required: ["stock_code"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "check_stock_connect_eligibility",
      description: "检查港股股票是否符合港股通（南向）纳入条件。根据恒生综合指数成分股、市值门槛等规则进行判定。",
      parameters: {
        type: "object",
        properties: {
          stock_code: {
            type: "string",
            description: "港股股票代码"
          }
        },
        required: ["stock_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_hsi_eligibility", 
      description: "检查港股股票是否符合恒生指数（HSI）纳入条件。包括市值排名、行业代表性等要求。",
      parameters: {
        type: "object",
        properties: {
          stock_code: {
            type: "string",
            description: "港股股票代码"
          }
        },
        required: ["stock_code"]
      }
    }
  }
];

// 聊天API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, message, history, companyName, projectContent } = body;

    // 获取专家配置
    const expert = expertsConfig.experts.find(e => e.id === expertId);

    if (!expert) {
      return NextResponse.json({
        success: false,
        error: '专家不存在'
      }, { status: 404 });
    }

    // 预提取股票代码并查询数据（核心修复：先查数据，再问AI）
    let stockCodes = extractStockCodes(message);
    
    // 备用方案：如果正则没匹配到，尝试更简单的检测
    if (stockCodes.length === 0) {
      // 直接搜索消息中的5位数字（港股代码格式）
      const simpleMatch = message.match(/\b(\d{5})\b/);
      if (simpleMatch) {
        stockCodes = [simpleMatch[1] + '.hk'];
        console.log('备用提取到股票代码:', stockCodes);
      }
    }
    
    console.log('提取到的股票代码:', stockCodes, '原始消息:', message);
    let stockDataResults: any[] = []; // 始终初始化为空数组
    let stockInfoContext = '';
    
    if (stockCodes.length > 0) {
      console.log('开始查询股票数据, codes:', stockCodes);
      const uniqueCodes = [...new Set(stockCodes)].slice(0, 3);
      
      // 并行查询所有股票数据
      const stockDataPromises = uniqueCodes.map(code => getStockData(code));
      const stockResults = await Promise.all(stockDataPromises);
      
      console.log('股票查询结果:', stockResults);
      stockDataResults = stockResults.filter(s => s !== null);
      
      // 如果过滤后为空，尝试直接返回本地映射（绕过API）
      if (stockDataResults.length === 0 && uniqueCodes.length > 0) {
        console.log('API查询失败，尝试直接读取本地映射');
        for (const code of uniqueCodes) {
          const directResult = getStockDataDirect(code);
          if (directResult) {
            stockDataResults.push(directResult);
          }
        }
      }
      
      // 构建股票信息上下文（强制AI使用）
      if (stockDataResults.length > 0) {
        stockInfoContext = `\n\n【股票数据查询结果 - 必须严格使用以下信息，禁止编造】\n`;
        stockDataResults.forEach(stock => {
          const priceInfo = stock.price > 0 
            ? `当前价: ${stock.price}港元, 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%), 流动市值: ${(stock.marketCap / 100000000).toFixed(2)}亿港元`
            : '价格数据暂未获取';
          
          // 港股通状态信息
          const connectStatus = stock.stockConnectStatus 
            ? `\n港股通状态: ${stock.stockConnectStatus} ${stock.connectType ? '(' + stock.connectType + ')' : ''}\n恒生综合指数类型: ${stock.hsciType || '未知'}\n纳入时间: ${stock.inclusionDate || '未知'}`
            : '';
            
          stockInfoContext += `股票代码: ${stock.code}
公司名称: ${stock.name}
英文名称: ${stock.nameEn}
所属行业: ${stock.industry}
${priceInfo}${connectStatus}
---\n`;
        });
        
        stockInfoContext += `【强制规则 - 违反将被严厉处罚】\n`;
        stockInfoContext += `1. 上述公司名称是唯一正确答案！禁止使用任何其他名称！\n`;
        stockInfoContext += `2. 如果你之前说的名称与上述不同，必须立即更正并道歉！\n`;
        stockInfoContext += `3. 回答中必须包含上述股票代码和名称作为证据！\n`;
        stockInfoContext += `4. 如果用户问的是关于这些股票的问题，必须引用上述数据！\n`;
      }
    }

    // 构建系统提示
    let systemPrompt = expert.systemPrompt;
    if (stockInfoContext) {
      systemPrompt += stockInfoContext;
    }
    
    // 添加专家特定的系统提示 + 防幻觉规则
    systemPrompt += `\n\n【关键警告 - 必须遵守】\n当用户询问股票代码对应的公司名称时：\n1. 禁止根据记忆猜测！必须使用【股票数据查询结果】中的名称！\n2. 如果没有该股票数据，明确告诉用户"数据库中没有此股票信息"\n3. 严禁编造公司名称！\n\n【专家身份】\n你是 ${expert.name}。${expert.description || ''}\n请用专业的口吻回答用户的问题。`;

    // 构建消息列表
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史对话（只保留最近5轮）
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg: any) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // 添加当前消息
    messages.push({ role: 'user', content: message });

    // 调用Azure OpenAI（禁用Function Calling，因为我们已手动查询股票数据）
    let aiResponse = '';
    try {
      aiResponse = await callAzureOpenAIWithFunctions(
        messages,
        [],
        expert.temperature,
        expert.maxTokens
      );
    } catch (aiError: any) {
      console.error('AI调用失败:', aiError.message);
    }

    // 如果AI返回为空，使用默认回复
    if (!aiResponse || aiResponse.trim() === '') {
      if (stockDataResults.length > 0) {
        aiResponse = `您好！让我为您整理一下股票信息。`;
      } else {
        aiResponse = `您好！我是${expert.name}。请问有什么可以帮您？`;
      }
    }

    // 构建返回数据 - 确保detectedStocks始终是数组
    const responseData: any = {
      expert: expert.name,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      detectedStocks: [] // 初始化为空数组
    };

    // 记录用户问题（在responseData构建完成后）
    // 提取股票代码列表
    const stockCodesList = stockDataResults.map((s: any) => s.code).join(', ');
    recordUserQuestion({
      expertId: expertId,
      expertName: expert.name,
      companyName: companyName || '',
      projectContent: projectContent || '',
      question: message,
      answer: responseData.response || '',
      sessionId: body.sessionId || '',
      stockCodes: stockCodesList
    });

    // 始终返回股票信息（即使AI没有正确使用）
    if (stockDataResults.length > 0) {
      // 检查AI是否给出了错误的回答
      const aiText = aiResponse || '';
      const aiSaysNoData = aiText.includes('没有此股票') || 
        aiText.includes('数据库中没有') ||
        aiText.includes('无法查询') ||
        aiText.includes('不存在') ||
        aiText.includes('无法识别') ||
        aiText.length < 10;
      
      let finalResponse: string;
      
      if (aiSaysNoData && stockDataResults.length > 0) {
          // AI回答错误，直接基于股票数据生成正确回复
          finalResponse = stockDataResults.map((stock: any) => {
            const priceText = stock.price > 0 
              ? `\n当前价格: ${stock.price}港元\n涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%)\n流动市值: ${(stock.marketCap / 100000000).toFixed(2)}亿港元`
              : '\n当前价格: 暂无实时数据';
            
            return `【股票信息查询结果】\n\n股票代码: ${stock.code}\n公司名称: ${stock.name}\n英文名称: ${stock.nameEn}\n所属行业: ${stock.industry}${priceText}\n\n如需更详细的分析，请告诉我具体想了解哪方面的信息。`;
          }).join('\n\n');
        } else {
          // AI回答正确，在末尾添加股票信息
          finalResponse = aiResponse + '\n\n' + stockDataResults.map((stock: any) => 
            `【股票信息】\n代码: ${stock.code}\n公司: ${stock.name} (${stock.nameEn})\n行业: ${stock.industry}`
          ).join('\n');
        }
        
        responseData.response = finalResponse;
        
        responseData.detectedStocks = stockDataResults.map((stock: any) => ({
          code: stock.code,
          name: stock.name,
          nameEn: stock.nameEn,
          industry: stock.industry,
          price: stock.price || 0,
          change: stock.change || 0,
          changePct: stock.changePct || 0,
          marketCap: stock.marketCap || 0
        }));
      }

      return NextResponse.json({
        success: true,
        data: responseData
      });
  } catch (error: any) {
    console.error('Chat error:', error);

    return NextResponse.json({
      success: false,
      error: error.message || '聊天服务出现错误'
    }, { status: 500 });
  }
}

// 调用Azure OpenAI API（支持Function Calling）
async function callAzureOpenAIWithFunctions(
  messages: any[], 
  functions: any[] = [],
  temperature: number = 0.7, 
  maxTokens: number = 2000
) {
  try {
    // 确保至少4000 tokens，防止输出截断
    const finalMaxTokens = Math.max(maxTokens, 4000);
    console.log('callAzureOpenAIWithFunctions - maxTokens:', finalMaxTokens);
    
    const requestBody: any = {
      messages: messages,
      temperature: temperature,
      max_tokens: finalMaxTokens,
    };

    // 如果有函数定义，添加到请求中
    if (functions.length > 0) {
      requestBody.tools = functions;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    
    // 如果AI调用了函数，处理函数调用结果
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // 添加助手的消息（包含函数调用）
      messages.push(assistantMessage);
      
      // 处理每个函数调用
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        let functionResult = '';
        
        if (functionName === 'get_stock_info') {
          const stockData = await getStockData(args.stock_code);
          functionResult = JSON.stringify(stockData);
        } else if (functionName === 'check_stock_connect_eligibility') {
          // 简化版入通资格检查
          const stockData = await getStockData(args.stock_code);
          functionResult = JSON.stringify({
            stock_code: args.stock_code,
            stock_name: stockData?.name || '未知',
            eligible: stockData?.marketCap >= 5000000000, // 50亿门槛
            market_cap: stockData?.marketCap || 0,
            threshold: 5000000000,
            note: '港股通纳入标准：恒生综合指数成分股且市值≥50亿港元'
          });
        } else if (functionName === 'check_hsi_eligibility') {
          const stockData = await getStockData(args.stock_code);
          functionResult = JSON.stringify({
            stock_code: args.stock_code,
            stock_name: stockData?.name || '未知',
            eligible: stockData?.marketCap >= 100000000000, // 1000亿大致门槛
            market_cap: stockData?.marketCap || 0,
            threshold: 100000000000,
            note: '恒生指数纳入标准：市值排名靠前，流动性充足'
          });
        }
        
        // 添加函数结果
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: functionResult
        });
      }
      
      // 再次调用AI，让它基于函数结果生成回答
      const secondResponse = await fetch(AZURE_OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: messages,
          temperature: temperature,
          max_tokens: Math.max(maxTokens, 4000),  // 确保至少4000token
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        throw new Error(`Azure OpenAI API error: ${secondResponse.status} - ${errorText}`);
      }

      const secondData = await secondResponse.json();
      return secondData.choices[0].message.content;
    }

    // 如果没有函数调用，直接返回内容
    return assistantMessage.content;
  } catch (error: any) {
    console.error('Azure OpenAI API error:', error);
    throw error;
  }
}

// 备用响应（当AI不可用时）
function getFallbackResponse(expertId: string, message: string): string {
  const responses: Record<string, string> = {
    'health-check': `感谢您的咨询！我是港股通体检专家。

根据您的问题"${message}"

我需要了解更多公司信息才能进行准确的体检分析。请您提供以下信息：

1. 公司名称和行业
2. 最近三年盈利情况（万港元）
3. 预计市值（亿港元）
4. 是否采用VIE架构
5. 控股股东持股比例

您可以通过首页的"港股通体检"功能，填写详细的表单信息，我将为您生成完整的体检报告。

或者您也可以继续描述您的问题，我会尽力为您解答港股通相关的专业知识。`,
    
    'ipo-analysis': `感谢您的咨询！我是招股书分析专家。

根据您的问题"${message}"

为了给您提供更准确的分析，请您提供以下信息：

1. 您想了解哪家公司或哪个IPO项目？
2. 是否已经有招股书文本？
3. 您关注的是投资价值还是风险评估？

您可以通过首页的"招股书分析"功能，上传招股书或输入公司名称，我将为您进行全面的分析。

请告诉我更多细节，我会为您提供专业的分析建议。`,
    
    'listing-path': `感谢您的咨询！我是上市路径规划专家。

根据您的问题"${message}"

为了给您制定合适的上市方案，请您提供：

1. 公司基本信息（名称、行业、成立时间）
2. 股权结构（是否已有外资股东）
3. 公司性质（国企/民企/外资）
4. 财务状况（盈利情况、市值预估）
5. 上市目标时间

我会根据您的情况，为您推荐最适合的上市路径，包括H股直接上市、VIE架构上市等方案。

请提供更多信息，我将为您详细规划。`,
    
    'compliance': `感谢您的咨询！我是合规审查专家。

根据您的问题"${message}"

为了帮您排查合规风险，请您提供：

1. 公司所在行业
2. 是否涉及外资准入限制
3. 过往是否存在监管处罚
4. 关联交易情况
5. 税务合规状况

我会根据您提供的信息，识别潜在的合规问题，并给出整改建议。

请告诉我更多详情。`,
    
    'valuation': `感谢您的咨询！我是估值定价专家。

根据您的问题"${message}"

为了给您提供准确的估值分析，请您提供：

1. 公司名称和行业
2. 盈利状况（最近三年净利润）
3. 预计募集资金规模
4. 可比上市公司（如有）
5. 业务模式和增长率

我会运用可比公司法、DCF现金流折现法等方法，为您提供估值参考区间。

请提供更多财务数据。`,
    
    'index-inclusion': `感谢您的咨询！我是指数纳入规划专家。

根据您的问题"${message}"

为了帮您规划MSCI和富时罗素指数的纳入路径，请您提供：

1. 公司当前市值（亿港元）
2. 日均成交金额
3. 是否已在香港上市
4. 外资持股比例
5. 您希望纳入的具体指数

我会根据您提供的信息，评估纳入可行性，并制定详细的时间线和准备方案。

请提供更多公司信息。`,

    'stock-connect-planning': `感谢您的咨询！我是入港股通规划专家。

根据您的问题"${message}"

为了帮您制定港股通纳入规划方案，请您提供：

1. 公司当前市值（亿港元）
2. 日均成交金额
3. 是否已在香港主板/创业板上市
4. 上市时间
5. 是否被纳入恒生综合指数

我会根据您的情况，评估入通可行性，并提供流动性提升策略和时间线规划。

请提供更多详细信息。`
  };

  return responses[expertId] || `感谢您的咨询！我是港股智通专家团队的一员。

根据您的问题："${message}"

请提供更多详细信息，我将为您提供专业的分析和建议。

您可以通过以下方式获得更详细的服务：
- 港股通体检：评估上市可行性
- 招股书分析：解读投资价值
- 上市规划：定制专属方案

期待为您提供更多帮助！`;
}
