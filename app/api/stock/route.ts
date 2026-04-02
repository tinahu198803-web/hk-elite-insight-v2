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
    
    // f116=总市值(元), f117=流通市值(元) - 东方财富直接返回元为单位
    const totalMarketCap = d.f116 || 0; // 总市值(元)
    const floatMarketCap = d.f117 || 0; // 流通市值(元)
    
    // 转换为亿港元 (假设汇率约1.03)
    const HKD_RATE = 1.03;
    const totalCapHKD = totalMarketCap / 100000000 / HKD_RATE;
    const floatCapHKD = floatMarketCap / 100000000 / HKD_RATE;
    
    // 生成市值显示文本
    let marketCapText = null;
    let floatMarketCapText = null;
    if (totalCapHKD > 0) {
      marketCapText = `${totalCapHKD.toFixed(2)}亿港元`;
    }
    if (floatCapHKD > 0) {
      floatMarketCapText = `${floatCapHKD.toFixed(2)}亿港元`;
    }

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
      marketCapText,
      floatMarketCap: floatMarketCap,
      floatMarketCapText,
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

// 本地数据库 - 核心股票代码映射（从hk-stocks.json同步）
const LOCAL_DB: Record<string, any> = {
  // 互联网/科技
  '00700': { name: '腾讯控股', nameEn: 'Tencent Holdings', industry: '互联网' },
  '09988': { name: '阿里巴巴-SW', nameEn: 'Alibaba Group', industry: '互联网' },
  '03690': { name: '美团-W', nameEn: 'Meituan', industry: '互联网' },
  '01810': { name: '小米集团-W', nameEn: 'Xiaomi Group', industry: '互联网' },
  '02418': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网' },
  '09618': { name: '百度集团-SW', nameEn: 'Baidu', industry: '互联网' },
  '09633': { name: '京东健康', nameEn: 'JD Health', industry: '互联网医疗' },
  '02559': { name: '快手-W', nameEn: 'Kuaishou', industry: '互联网' },
  '09999': { name: '网易-S', nameEn: 'NetEase', industry: '互联网' },
  '06699': { name: '创梦天地', nameEn: 'iDreamSky', industry: '互联网' },
  // 汽车/新能源
  '09868': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源汽车' },
  '09881': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源汽车' },
  '01765': { name: '比亚迪股份', nameEn: 'BYD', industry: '新能源汽车' },
  '02333': { name: '长城汽车', nameEn: 'Great Wall Motor', industry: '汽车' },
  '00175': { name: '吉利汽车', nameEn: 'Geely', industry: '汽车' },
  // 医药/生物
  '01877': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药' },
  '02269': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '02269': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '02575': { name: '轩竹生物', nameEn: 'Xuanzhu Biotech', industry: '生物医药' },
  '02659': { name: '宝济药业-B', nameEn: 'BAO PHARMA-B', industry: '生物医药' },
  '02655': { name: '果下科技', nameEn: 'Guoxia Tech', industry: '科技' },
  '09989': { name: '翰森制药', nameEn: 'Hansoh Pharmaceutical', industry: '医药' },
  '01801': { name: '信达生物', nameEn: 'Innovent', industry: '生物医药' },
  '01548': { name: '金斯瑞生物科技', nameEn: 'GenScript', industry: '生物医药' },
  '06186': { name: '康宁杰瑞', nameEn: 'Alphamab Oncology', industry: '生物医药' },
  '09939': { name: '康方生物', nameEn: 'Akeso', industry: '生物医药' },
  '02569': { name: '再鼎医药', nameEn: 'Zai Lab', industry: '生物医药' },
  // 金融
  '06030': { name: '中信证券', nameEn: 'CITIC Securities', industry: '金融' },
  '06837': { name: '海通证券', nameEn: 'Haitong Securities', industry: '金融' },
  '03908': { name: '中金公司', nameEn: 'CICC', industry: '金融' },
  '06099': { name: '招商证券', nameEn: 'China Merchants Securities', industry: '金融' },
  '02318': { name: '中国平安', nameEn: 'Ping An', industry: '保险' },
  '02313': { name: '申洲国际', nameEn: 'Shenzhou', industry: '纺织' },
  '00981': { name: '中芯国际', nameEn: 'SMIC', industry: '半导体' },
  '06098': { name: '碧桂园服务', nameEn: 'Country Garden Services', industry: '房地产' },
  '06060': { name: '贝壳-W', nameEn: 'KE Holdings', industry: '互联网' },
  '02691': { name: '京东物流', nameEn: 'JD Logistics', industry: '物流' },
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

  // 1. 首先检查本地数据库 - 本地名称优先，更准确
  const localData = LOCAL_DB[code];
  
  // 2. 东方财富API获取实时数据
  const eastmoneyResult = await getFromEastMoney(code);
  if (eastmoneyResult.success) {
    console.log('东方财富成功:', eastmoneyResult.price, eastmoneyResult.floatMarketCapText);
    // ⚠️ 关键修复：本地名称准确，强制使用本地名称覆盖API返回的名称
    if (localData) {
      eastmoneyResult.name = localData.name;
      eastmoneyResult.nameEn = localData.nameEn;
      eastmoneyResult.industry = localData.industry;
      console.log('使用本地名称:', localData.name);
    }
    return NextResponse.json(eastmoneyResult);
  }
  console.log('东方财富失败:', eastmoneyResult.error);

  // 2. 腾讯API - 也需要强制使用本地名称
  const tencentResult = await getFromTencent(code);
  if (tencentResult.success) {
    console.log('腾讯成功:', tencentResult.price);
    // ⚠️ 关键修复：强制使用本地准确的名称
    if (localData) {
      tencentResult.name = localData.name;
      tencentResult.nameEn = localData.nameEn;
      tencentResult.industry = localData.industry;
      console.log('使用本地名称:', localData.name);
    }
    return NextResponse.json(tencentResult);
  }
  console.log('腾讯失败:', tencentResult.error);

  // 3. 本地数据库 (localData已在前面定义)
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
