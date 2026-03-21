// 港股实时股票数据API - 多源备用方案
import { NextResponse } from 'next/server';

// 港股代码格式转换
function normalizeHKCode(code: string): string {
  // 移除所有非数字字符
  const nums = code.replace(/\D/g, '');
  // 补齐到5位
  return nums.padStart(5, '0');
}

// 腾讯财经API - 主数据源
async function getFromTencent(code: string) {
  try {
    const codeNum = normalizeHKCode(code);
    const url = `https://qt.gtimg.cn/q=hk${codeNum}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://gu.qq.com'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const text = await res.text();
    // 格式: v_hk00700="100~名称~代码~当前价~昨收~今开~成交量~..."
    const match = text.match(/="([^"]+)"/);
    if (!match) throw new Error('数据格式错误');

    const p = match[1].split('~');
    if (p.length < 50) throw new Error('数据不完整');

    const price = parseFloat(p[3]) || 0;
    const prevClose = parseFloat(p[4]) || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';
    
    // 成交量(股)
    const volume = parseInt(p[6]) || 0;
    // 市值(亿港元) - parts[45]
    const marketCapField = parseFloat(p[45]) || 0;

    return {
      success: true,
      source: 'tencent',
      code: `${codeNum}.HK`,
      name: p[1] || '',
      price,
      change: change.toFixed(2),
      changePct,
      volume,
      // 转换为完整数值(港元)
      marketCap: marketCapField > 0 ? marketCapField * 100000000 : 0,
      marketCapText: marketCapField > 0 ? `${marketCapField.toFixed(2)}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: `腾讯: ${e.message}` };
  }
}

// Yahoo Finance API - 备用数据源
async function getFromYahoo(code: string) {
  try {
    const codeNum = normalizeHKCode(code);
    const symbol = `${codeNum}.HK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('无数据');

    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.previousClose || meta.chartPreviousClose || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      source: 'yahoo',
      code: symbol,
      name: meta.shortName || meta.symbol || symbol,
      price,
      change: change.toFixed(2),
      changePct,
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap || 0,
      marketCapText: meta.marketCap ? `${(meta.marketCap / 100000000).toFixed(2)}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: `Yahoo: ${e.message}` };
  }
}

// 东方财富API - 另一个备用数据源
async function getFromEastMoney(code: string) {
  try {
    const codeNum = normalizeHKCode(code);
    // 东方财富港股格式
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${codeNum}&fields=f43,f57,f58,f107,f50,f169,f170,f171,f47,f48,f60,f46,f44,f45`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const stockData = data?.data;
    if (!stockData) throw new Error('无数据');

    const price = stockData.f43 / 100 || 0;  // 当前价
    const prevClose = stockData.f60 / 100 || 0;  // 昨收
    const change = price - prevClose;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      source: 'eastmoney',
      code: `${codeNum}.HK`,
      name: stockData.f58 || '',
      price,
      change: change.toFixed(2),
      changePct,
      volume: stockData.f47 || 0,
      marketCap: 0,
      marketCapText: null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: `东方财富: ${e.message}` };
  }
}

// 本地备用数据库
const LOCAL_DB: Record<string, any> = {
  '02659': { name: '宝济药业-B', nameEn: 'Baoji Pharma', industry: '生物医药' },
  '02575': { name: '轩竹生物', nameEn: 'Xuanzhu Biotech', industry: '生物医药' },
  '02655': { name: '果下科技', nameEn: 'Guoxia Technology', industry: '科技' },
  '00700': { name: '腾讯控股', nameEn: 'Tencent Holdings', industry: '互联网' },
  '09988': { name: '阿里巴巴-SW', nameEn: 'Alibaba Group', industry: '互联网' },
  '03690': { name: '美团-W', nameEn: 'Meituan', industry: '互联网' },
  '01810': { name: '小米集团-W', nameEn: 'Xiaomi Group', industry: '互联网' },
  '02418': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网' },
  '01877': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药' },
  '02269': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '09868': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源汽车' },
  '09881': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源汽车' },
  '06030': { name: '中信证券', nameEn: 'CITIC Securities', industry: '金融' },
  '02318': { name: '中国平安', nameEn: 'Ping An', industry: '保险' },
  '00981': { name: '中芯国际', nameEn: 'SMIC', industry: '半导体' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.toLowerCase().replace(/\.hk$/i, '').replace(/\.hk$/i, '') || '';
  
  if (!code) {
    return NextResponse.json({ success: false, error: '缺少股票代码' }, { status: 400 });
  }

  console.log('========== 股票查询 ==========');
  console.log('股票代码:', code);

  // 按优先级尝试各数据源
  const sources = [
    { name: '腾讯财经', fn: () => getFromTencent(code) },
    { name: 'Yahoo Finance', fn: () => getFromYahoo(code) },
    { name: '东方财富', fn: () => getFromEastMoney(code) },
  ];

  let lastError = '';

  for (const src of sources) {
    console.log(`尝试 ${src.name}...`);
    const result = await src.fn();
    
    if (result.success) {
      console.log(`${src.name} 成功! 价格: ${result.price}, 市值: ${result.marketCapText}`);
      
      // 补充本地数据库信息
      const localInfo = LOCAL_DB[code.padStart(5, '0')];
      if (localInfo) {
        result.name = localInfo.name;
        result.nameEn = localInfo.nameEn;
        result.industry = localInfo.industry;
      }
      
      return NextResponse.json(result);
    }
    
    lastError = result.error || '未知错误';
    console.log(`${src.name} 失败:`, lastError);
  }

  // 所有API失败，返回本地数据
  const localInfo = LOCAL_DB[code.padStart(5, '0')];
  if (localInfo) {
    console.log('使用本地数据库');
    return NextResponse.json({
      success: true,
      source: 'local',
      code: `${code.padStart(5, '0')}.HK`,
      name: localInfo.name,
      nameEn: localInfo.nameEn,
      industry: localInfo.industry,
      price: 0,
      change: '0.00',
      changePct: '0.00',
      volume: 0,
      marketCap: 0,
      marketCapText: null,
      warning: `实时API不可用(${lastError})，本地数据仅供参考`,
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({
    success: false,
    error: `所有数据源失败: ${lastError}`,
    code: code
  }, { status: 500 });
}
