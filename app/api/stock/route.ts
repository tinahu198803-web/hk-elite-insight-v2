// 港股实时股票数据API v2.1 - 东方财富主数据源
import { NextResponse } from 'next/server';

// 标准化股票代码
function normalizeCode(rawCode: string): string {
  // 移除所有非数字字符
  const nums = rawCode.replace(/\D/g, '');
  // 补齐到5位
  return nums.padStart(5, '0');
}

// 东方财富API - 主数据源
async function getFromEastMoney(code: string) {
  try {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${code}&fields=f43,f57,f58,f107,f47,f48,f116,f117,f152,f50`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const json = await res.json();
    
    // 检查返回数据
    if (json.rc !== 0 || !json.data) {
      throw new Error('东方财富返回数据为空');
    }
    
    const d = json.data;
    
    // f43=当前价(分->元), f107=涨跌额(分->元)
    const price = (d.f43 || 0) / 100;
    const change = (d.f107 || 0) / 100;
    const prevClose = price - change;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';
    
    // 市值数据(元->亿港元)
    const totalMarketCap = d.f116 || 0; // 总市值
    const floatMarketCap = d.f117 || 0; // 流通市值
    
    // 转换为亿港元 (假设汇率约1.03)
    const HKD_RATE = 1.03;
    const totalCapHKD = totalMarketCap / 100000000 / HKD_RATE;
    const floatCapHKD = floatMarketCap / 100000000 / HKD_RATE;

    return {
      success: true,
      source: 'eastmoney',
      code: `${code}.HK`,
      name: d.f58 || `股票${code}`,
      nameEn: '',
      industry: '',
      price,
      change: change.toFixed(2),
      changePct,
      volume: d.f47 || 0,
      amount: d.f48 || 0,
      marketCap: totalMarketCap,
      marketCapText: totalCapHKD > 0 ? `${totalCapHKD.toFixed(2)}亿港元` : null,
      floatMarketCap: floatMarketCap,
      floatMarketCapText: floatCapHKD > 0 ? `${floatCapHKD.toFixed(2)}亿港元` : null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// 腾讯财经API - 备用
async function getFromTencent(code: string) {
  try {
    const url = `https://qt.gtimg.cn/q=hk${code}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://gu.qq.com'
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const text = await res.text();
    // 格式: v_hk00700="100~名称~代码~现价~昨收~今开~成交量~..."
    const match = text.match(/="([^"]+)"/);
    if (!match) throw new Error('数据格式错误');

    const p = match[1].split('~');
    if (p.length < 10) throw new Error('数据不完整');

    const price = parseFloat(p[3]) || 0;
    const prevClose = parseFloat(p[4]) || 0;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? ((change / prevClose) * 100).toFixed(2) : '0.00';

    return {
      success: true,
      source: 'tencent',
      code: `${code}.HK`,
      name: p[1] || '',
      nameEn: '',
      industry: '',
      price,
      change: change.toFixed(2),
      changePct,
      volume: parseInt(p[6]) || 0,
      amount: 0,
      marketCap: 0,
      marketCapText: null,
      floatMarketCap: 0,
      floatMarketCapText: null,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// 本地数据库
const LOCAL_DB: Record<string, any> = {
  '02659': { name: '宝济药业-B', nameEn: 'BAO PHARMA-B', industry: '生物医药' },
  '02575': { name: '轩竹生物', nameEn: 'Xuanzhu Biotech', industry: '生物医药' },
  '02655': { name: '果下科技', nameEn: 'Guoxia Tech', industry: '科技' },
  '00700': { name: '腾讯控股', nameEn: 'Tencent', industry: '互联网' },
  '09988': { name: '阿里巴巴-SW', nameEn: 'Alibaba', industry: '互联网' },
  '03690': { name: '美团-W', nameEn: 'Meituan', industry: '互联网' },
  '01810': { name: '小米集团-W', nameEn: 'Xiaomi', industry: '互联网' },
  '02418': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网' },
  '01877': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药' },
  '02269': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '09868': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源车' },
  '09881': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源车' },
  '06030': { name: '中信证券', nameEn: 'CITIC', industry: '金融' },
  '02318': { name: '中国平安', nameEn: 'Ping An', industry: '保险' },
  '00981': { name: '中芯国际', nameEn: 'SMIC', industry: '半导体' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let rawCode = searchParams.get('code') || '';
  
  // 标准化代码
  const code = normalizeCode(rawCode);
  
  if (code.length < 4) {
    return NextResponse.json({ 
      success: false, 
      error: `无效的股票代码: ${rawCode}`,
      code: rawCode
    }, { status: 400 });
  }

  console.log('股票查询:', rawCode, '->', code);

  // 1. 东方财富API
  const eastmoneyResult = await getFromEastMoney(code);
  if (eastmoneyResult.success) {
    console.log('东方财富成功:', eastmoneyResult.price, eastmoneyResult.floatMarketCapText);
    // 补充本地信息
    const local = LOCAL_DB[code];
    if (local) {
      eastmoneyResult.name = local.name;
      eastmoneyResult.nameEn = local.nameEn;
      eastmoneyResult.industry = local.industry;
    }
    return NextResponse.json(eastmoneyResult);
  }
  console.log('东方财富失败:', eastmoneyResult.error);

  // 2. 腾讯API
  const tencentResult = await getFromTencent(code);
  if (tencentResult.success) {
    console.log('腾讯成功:', tencentResult.price);
    const local = LOCAL_DB[code];
    if (local) {
      tencentResult.name = local.name;
      tencentResult.nameEn = local.nameEn;
      tencentResult.industry = local.industry;
    }
    return NextResponse.json(tencentResult);
  }
  console.log('腾讯失败:', tencentResult.error);

  // 3. 本地数据库
  const localData = LOCAL_DB[code];
  if (localData) {
    return NextResponse.json({
      success: true,
      source: 'local',
      code: `${code}.HK`,
      name: localData.name,
      nameEn: localData.nameEn,
      industry: localData.industry,
      price: 0,
      change: '0.00',
      changePct: '0.00',
      volume: 0,
      amount: 0,
      marketCap: 0,
      marketCapText: null,
      floatMarketCap: 0,
      floatMarketCapText: null,
      warning: '实时API不可用，本地数据仅供参考',
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({
    success: false,
    error: `未找到股票: ${rawCode}`,
    code: rawCode
  }, { status: 404 });
}
