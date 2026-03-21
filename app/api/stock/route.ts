// 港股实时股票数据API - 基于东方财富
import { NextResponse } from 'next/server';

// 港股代码格式转换
function normalizeHKCode(code: string): string {
  const nums = code.replace(/\D/g, '');
  return nums.padStart(5, '0');
}

// 东方财富API - 主数据源（返回完整市值数据）
async function getFromEastMoney(code: string) {
  try {
    const codeNum = normalizeHKCode(code);
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${codeNum}&fields=f43,f57,f58,f107,f47,f48,f116,f117,f152,f50,f169,f170`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const d = data?.data;
    if (!d) throw new Error('无数据');

    // f43=当前价(分), f107=涨跌(点), f47=成交量, f48=成交额
    // f116=总市值(元), f117=流通市值(元)
    const price = (d.f43 || 0) / 100;
    const prevClose = price - ((d.f107 || 0) / 100);
    const change = d.f107 ? d.f107 / 100 : 0;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';
    
    // 市值转换为亿港元
    const totalMarketCap = d.f116 || 0; // 总市值(元)
    const floatMarketCap = d.f117 || 0; // 流通市值(元)
    
    const totalMarketCapHKD = totalMarketCap > 0 ? (totalMarketCap / 100000000).toFixed(2) : null;
    const floatMarketCapHKD = floatMarketCap > 0 ? (floatMarketCap / 100000000).toFixed(2) : null;

    return {
      success: true,
      source: 'eastmoney',
      code: `${codeNum}.HK`,
      name: d.f58 || '',
      price,
      change: change.toFixed(2),
      changePct,
      volume: d.f47 || 0,  // 成交量
      amount: d.f48 || 0,  // 成交额
      marketCap: totalMarketCap, // 原始值(元)
      marketCapText: totalMarketCapHKD ? `${totalMarketCapHKD}亿港元` : null,
      floatMarketCap: floatMarketCap, // 流通市值(元)
      floatMarketCapText: floatMarketCapHKD ? `${floatMarketCapHKD}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: `东方财富: ${e.message}` };
  }
}

// 腾讯财经API - 备用数据源
async function getFromTencent(code: string) {
  try {
    const codeNum = normalizeHKCode(code);
    const url = `https://qt.gtimg.cn/q=hk${codeNum}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://gu.qq.com'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const text = await res.text();
    const match = text.match(/="([^"]+)"/);
    if (!match) throw new Error('数据格式错误');

    const p = match[1].split('~');
    if (p.length < 50) throw new Error('数据不完整');

    const price = parseFloat(p[3]) || 0;
    const prevClose = parseFloat(p[4]) || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      source: 'tencent',
      code: `${codeNum}.HK`,
      name: p[1] || '',
      price,
      change: change.toFixed(2),
      changePct,
      volume: parseInt(p[6]) || 0,
      amount: parseFloat(p[37]) || 0,
      marketCap: 0,
      marketCapText: null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: `腾讯: ${e.message}` };
  }
}

// 本地备用数据库
const LOCAL_DB: Record<string, any> = {
  '02659': { name: '宝济药业-B', nameEn: 'BAO PHARMA-B', industry: '生物医药' },
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
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code') || '';
  const code = rawCode.toLowerCase().replace(/\.hk$/i, '').replace(/\.hk$/i, '');
  
  if (!code) {
    return NextResponse.json({ success: false, error: '缺少股票代码' }, { status: 400 });
  }

  console.log('========== 股票查询 ==========');
  console.log('股票代码:', code);

  // 按优先级尝试各数据源
  const sources = [
    { name: '东方财富', fn: () => getFromEastMoney(code) },
    { name: '腾讯财经', fn: () => getFromTencent(code) },
  ];

  let lastError = '';

  for (const src of sources) {
    console.log(`尝试 ${src.name}...`);
    const result = await src.fn();
    
    if (result.success) {
      console.log(`${src.name} 成功! 价格: ${result.price}, 流通市值: ${result.floatMarketCapText}`);
      
      // 补充本地数据库信息
      const paddedCode = code.padStart(5, '0');
      const localInfo = LOCAL_DB[paddedCode];
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
  const paddedCode = code.padStart(5, '0');
  const localInfo = LOCAL_DB[paddedCode];
  if (localInfo) {
    console.log('使用本地数据库');
    return NextResponse.json({
      success: true,
      source: 'local',
      code: `${paddedCode}.HK`,
      name: localInfo.name,
      nameEn: localInfo.nameEn,
      industry: localInfo.industry,
      price: 0,
      change: '0.00',
      changePct: '0.00',
      volume: 0,
      amount: 0,
      marketCap: 0,
      marketCapText: null,
      floatMarketCap: 0,
      floatMarketCapText: null,
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
