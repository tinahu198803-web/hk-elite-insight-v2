// 股票数据获取API - 支持多种数据源
// 优先级: 腾讯财经 > Yahoo Finance > Finnhub > 本地数据库

import { NextResponse } from 'next/server';

// 数据源配置
const DATA_SOURCES = {
  // 腾讯财经API - 支持港股实时数据
  tencent: {
    baseUrl: 'https://qt.gtimg.cn/q=',
    supports: ['price', 'change', 'volume', 'marketCap'],
    format: 'hk{code}' // 例如: hk00700
  },
  // Yahoo Finance API - 免费无需API Key
  yahoo: {
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart/',
    supports: ['price', 'change', 'volume'],
    format: '{code}.HK' // 例如: 00700.HK
  },
  // Finnhub - 需要API Key
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    supports: ['price', 'change', 'marketCap', 'pe', 'analyst'],
    format: '{code}.HK'
  }
};

// 本地数据库 - 作为最终备用
const LOCAL_DB: Record<string, any> = {
  '02659.hk': { name: '宝济药业-B', nameEn: 'Baoji Pharma', industry: '生物医药', basePrice: 18.5 },
  '02575.hk': { name: '轩竹生物', nameEn: 'Xuanzhu Biotech', industry: '生物医药', basePrice: 12.3 },
  '00700.hk': { name: '腾讯控股', nameEn: 'Tencent Holdings', industry: '互联网', basePrice: 380 },
  '09988.hk': { name: '阿里巴巴-SW', nameEn: 'Alibaba Group', industry: '互联网', basePrice: 85 },
  '03690.hk': { name: '美团-W', nameEn: 'Meituan', industry: '互联网', basePrice: 120 },
  '01810.hk': { name: '小米集团-W', nameEn: 'Xiaomi Group', industry: '互联网', basePrice: 28 },
  '02418.hk': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网', basePrice: 130 },
  '01877.hk': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药', basePrice: 145 },
  '02269.hk': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药', basePrice: 42 },
  '09868.hk': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源汽车', basePrice: 48 },
  '09881.hk': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源汽车', basePrice: 95 },
};

// 获取环境变量
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const FINNHUB_API = 'https://finnhub.io/api/v1';

// 标准化股票代码
function normalizeCode(code: string): string {
  return code.toLowerCase().replace('.hk', 'hk').replace(/^hk0+/, 'hk');
}

// 从腾讯财经API获取数据
async function getFromTencent(code: string): Promise<any> {
  try {
    const codeNum = code.replace(/^hk0*/i, '').replace('.hk', '');
    const url = `https://qt.gtimg.cn/q=hk${codeNum}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://gu.qq.com'
      },
      next: { revalidate: 60 } // 缓存60秒
    });

    if (!response.ok) {
      throw new Error(`腾讯API失败: ${response.status}`);
    }

    const text = await response.text();
    // 解析返回格式: v_hk00700="100~腾讯控股~00700~380.0~375.0~378.5~...~市值字段~..."
    const match = text.match(/="([^"]+)"/);
    if (!match) throw new Error('腾讯API数据格式错误');

    const parts = match[1].split('~');
    if (parts.length < 50) throw new Error('腾讯API数据不完整');

    const price = parseFloat(parts[3]) || 0;
    const yesterdayClose = parseFloat(parts[4]) || 0;
    const change = price - yesterdayClose;
    const changePct = yesterdayClose > 0 ? (change / yesterdayClose * 100) : 0;
    
    // 市值数据在parts[45]位置 (腾讯API港股数据格式)
    // parts[45] 单位已经是港元，需要判断是否有效
    const marketCapField = parts[45] ? parseFloat(parts[45]) : 0;
    // 如果数值较小(<10000亿)，说明单位是亿港元，直接使用
    // 如果数值较大(>10000亿)，说明需要除以100
    let marketCapHKD = marketCapField;
    if (marketCapHKD > 100000000) {
      // 原始数据可能以分为单位
      marketCapHKD = marketCapHKD / 100;
    }
    const marketCap = marketCapHKD > 0 ? marketCapHKD * 100000000 : 0;

    return {
      success: true,
      source: 'tencent',
      code: code.includes('.hk') ? code : `${code}.hk`,
      name: parts[1] || '',
      price,
      change,
      changePct: changePct.toFixed(2),
      volume: parseInt(parts[6]) || 0,
      marketCap,
      marketCapHKD,
      marketCapText: marketCapHKD > 0 ? `${parseFloat(marketCapHKD.toString()).toFixed(2)}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.log('腾讯API失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 从Yahoo Finance获取数据
async function getFromYahoo(code: string): Promise<any> {
  try {
    const symbol = code.includes('.HK') ? code : `${code.toUpperCase().replace('.HK', '')}.HK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Yahoo API失败: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) throw new Error('Yahoo API无数据');

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.previousClose || meta.chartPreviousClose || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose * 100) : 0;

    return {
      success: true,
      source: 'yahoo',
      code: code.includes('.hk') ? code : `${code}.hk`,
      name: meta.shortName || meta.symbol,
      price,
      change,
      changePct: changePct.toFixed(2),
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap || 0,
      marketCapText: meta.marketCap ? `${(meta.marketCap / 100000000).toFixed(2)}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.log('Yahoo API失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 从Finnhub获取数据 - 使用metric端点获取市值
async function getFromFinnhub(code: string): Promise<any> {
  if (!FINNHUB_API_KEY) {
    return { success: false, error: '未配置Finnhub API Key' };
  }

  try {
    // Finnhub港股格式: 02659 -> 02659.HK
    const symbol = code.replace('.HK', '').replace('.hk', '').replace(/^0+/, '') + '.HK';
    
    // 并行获取quote, profile, metrics数据
    const [quoteRes, profileRes, metricsRes] = await Promise.all([
      fetch(`${FINNHUB_API}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch(`${FINNHUB_API}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch(`${FINNHUB_API}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
    ]);

    if (!quoteRes.ok) {
      throw new Error(`Finnhub失败: ${quoteRes.status}`);
    }

    const quote = await quoteRes.json();
    const profile = profileRes.ok ? await profileRes.json() : {};
    const metrics = metricsRes.ok ? await metricsRes.json() : {};

    const price = quote.c || 0;
    const change = quote.d || 0;
    const changePct = quote.dp || 0;

    // 从metrics获取市值（metric端点更可靠）
    const marketCap = metrics?.metric?.marketCapitalization || profile.marketCapitalization || 0;

    return {
      success: true,
      source: 'finnhub',
      code: code.includes('.hk') ? code : `${code}.hk`,
      name: profile.name || code,
      price,
      change,
      changePct,
      volume: quote.v || 0,
      marketCap: marketCap,
      marketCapText: marketCap ? `${(marketCap / 100000000).toFixed(2)}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.log('Finnhub API失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主处理函数
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.toLowerCase() || '';
  
  if (!code) {
    return NextResponse.json({ 
      success: false, 
      error: '缺少股票代码参数' 
    }, { status: 400 });
  }

  console.log('========== 股票数据查询 ==========');
  console.log('股票代码:', code);

  // 按优先级尝试各数据源 - Finnhub优先（支持市值数据）
  const sources = [
    { name: 'Finnhub', fn: () => getFromFinnhub(code) },
    { name: '腾讯财经', fn: () => getFromTencent(code) },
    { name: 'Yahoo Finance', fn: () => getFromYahoo(code) }
  ];

  let lastError = '';
  
  for (const source of sources) {
    console.log(`尝试 ${source.name}...`);
    const result = await source.fn();
    
    if (result.success) {
      console.log(`${source.name} 成功!`);
      return NextResponse.json(result);
    }
    
    lastError = result.error || '未知错误';
    console.log(`${source.name} 失败:`, lastError);
  }

  // 所有API失败，使用本地数据
  console.log('所有API失败，使用本地数据');
  const normalizedCode = normalizeCode(code);
  const localData = LOCAL_DB[normalizedCode] || LOCAL_DB[code] || LOCAL_DB[`hk${code.replace(/\D/g, '')}`];
  
  if (localData) {
    return NextResponse.json({
      success: true,
      source: 'local',
      code: code.includes('.hk') ? code : `${code}.hk`,
      name: localData.name,
      nameEn: localData.nameEn,
      industry: localData.industry,
      price: localData.basePrice || 0,
      change: 0,
      changePct: 0,
      volume: 0,
      marketCap: 0,
      marketCapText: null,
      warning: 'API均不可用，数据为参考值',
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({
    success: false,
    error: `所有数据源均不可用: ${lastError}`,
    code: code
  }, { status: 500 });
}
