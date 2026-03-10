import { NextResponse } from 'next/server';

// iTick API配置
const ITICK_API_BASE = 'https://api.itick.org';

// 获取环境变量中的API Key
function getApiKey(): string {
  // 优先使用环境变量，否则使用默认值
  return process.env.ITICK_API_KEY || '';
}

// 港股股票代码规范化
function normalizeStockCode(code: string): string {
  // 移除空格和特殊字符
  let normalized = code.trim().toUpperCase();
  
  // 如果已经是完整格式 (如 00700.HK)，直接返回
  if (normalized.endsWith('.HK')) {
    return normalized;
  }
  
  // 如果只是数字，添加 .hk 后缀
  if (/^\d+$/.test(normalized)) {
    return `${normalized}.hk`;
  }
  
  return normalized;
}

// 从iTick API获取股票报价
async function getStockQuoteFromITick(stockCode: string) {
  const apiKey = getApiKey();
  const normalizedCode = normalizeStockCode(stockCode);
  
  // 提取纯数字代码用于iTick
  const numericCode = normalizedCode.replace(/\.hk$/i, '').replace(/^0+/, '') || normalizedCode;
  
  const url = `${ITICK_API_BASE}/stock/quotes?region=hk&code=${numericCode}`;
  
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'token': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`iTick API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// 从iTick API获取股票K线数据
async function getStockKlineFromITick(stockCode: string, kType: number = 1) {
  const apiKey = getApiKey();
  const normalizedCode = normalizeStockCode(stockCode);
  
  // 提取纯数字代码
  const numericCode = normalizedCode.replace(/\.hk$/i, '').replace(/^0+/, '') || normalizedCode;
  
  const url = `${ITICK_API_BASE}/stock/kline?region=hk&code=${numericCode}&kType=${kType}`;
  
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'token': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`iTick API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// 获取股票数据
async function getStockData(stockCode: string) {
  try {
    const normalizedCode = normalizeStockCode(stockCode);
    const apiKey = getApiKey();
    
    // 如果没有API Key，返回提示信息
    if (!apiKey) {
      // 备用：使用腾讯API
      return await getStockDataFromTencent(normalizedCode);
    }
    
    // 尝试使用iTick API
    try {
      const quoteData = await getStockQuoteFromITick(normalizedCode);
      
      if (quoteData && quoteData.data && quoteData.data.length > 0) {
        const stock = quoteData.data[0];
        return {
          code: normalizedCode,
          name: stock.n || stock.name || normalizedCode,  // 股票名称
          price: parseFloat(stock.p) || 0,               // 当前价格
          change: parseFloat(stock.d) || 0,              // 涨跌额
          changePct: parseFloat(stock.dp) || 0,          // 涨跌幅
          volume: parseInt(stock.v) || 0,                // 成交量
          amount: parseFloat(stock.a) || 0,              // 成交额
          high: parseFloat(stock.h) || 0,                // 最高价
          low: parseFloat(stock.l) || 0,                 // 最低价
          open: parseFloat(stock.o) || 0,                // 开盘价
          prevClose: parseFloat(stock.pc) || 0,           // 昨收价
          timestamp: new Date().toISOString()
        };
      }
    } catch (itickError) {
      console.warn('iTick API failed, falling back to Tencent:', itickError);
    }
    
    // iTick失败时使用备用方案
    return await getStockDataFromTencent(normalizedCode);
    
  } catch (error: any) {
    console.error('获取股票数据失败:', error);
    throw error;
  }
}

// 备用：使用腾讯API获取股票数据
async function getStockDataFromTencent(stockCode: string) {
  const TENCENT_FINANCE_API = 'https://qt.gtimg.cn/q=';
  const normalizedCode = normalizeStockCode(stockCode);
  const url = `${TENCENT_FINANCE_API}${normalizedCode}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  
  // 解析返回数据
  // 格式: "stock_id="name","price","change","change_pct","volume","amount","..." 
  const match = text.match(/="([^"]+)"/);
  
  if (!match || !match[1]) {
    throw new Error('股票数据解析失败');
  }

  const dataParts = match[1].split(',');
  
  if (dataParts.length < 10) {
    throw new Error('股票数据格式错误');
  }

  return {
    code: normalizedCode,
    name: dataParts[0],                    // 股票名称
    price: parseFloat(dataParts[1]),       // 当前价格
    change: parseFloat(dataParts[2]),      // 涨跌额
    changePct: parseFloat(dataParts[3]),  // 涨跌幅
    volume: parseInt(dataParts[4]),        // 成交量
    amount: parseFloat(dataParts[5]),      // 成交额
    amplitude: parseFloat(dataParts[5]),   // 振幅
    high: parseFloat(dataParts[33]),       // 最高价
    low: parseFloat(dataParts[34]),        // 最低价
    open: parseFloat(dataParts[36]),       // 开盘价
    prevClose: parseFloat(dataParts[37]),  // 昨收价
    turnoverRate: parseFloat(dataParts[38]), // 换手率
    marketCap: parseFloat(dataParts[45]),  // 总市值
    pe: parseFloat(dataParts[46]),         // 市盈率
    timestamp: new Date().toISOString()
  };
}

// 批量获取多只股票数据
async function getMultipleStockData(stockCodes: string[]) {
  const apiKey = getApiKey();
  const results: any[] = [];
  
  // 尝试使用iTick批量查询
  if (apiKey && stockCodes.length > 0) {
    try {
      // iTick支持逗号分隔批量查询
      const codesParam = stockCodes.map(code => 
        normalizeStockCode(code).replace(/\.hk$/i, '').replace(/^0+/, '')
      ).join(',');
      
      const url = `${ITICK_API_BASE}/stock/quotes?region=hk&code=${codesParam}`;
      
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'token': apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          for (const stock of data.data) {
            results.push({
              code: `${stock.s}.hk`,
              name: stock.n || stock.name || `${stock.s}.hk`,
              price: parseFloat(stock.p) || 0,
              change: parseFloat(stock.d) || 0,
              changePct: parseFloat(stock.dp) || 0,
              volume: parseInt(stock.v) || 0,
              amount: parseFloat(stock.a) || 0,
              high: parseFloat(stock.h) || 0,
              low: parseFloat(stock.l) || 0,
              open: parseFloat(stock.o) || 0,
              prevClose: parseFloat(stock.pc) || 0,
            });
          }
          return results;
        }
      }
    } catch (itickError) {
      console.warn('iTick batch query failed:', itickError);
    }
  }
  
  // 备用：使用腾讯API逐个查询
  for (const stockCode of stockCodes) {
    try {
      const data = await getStockDataFromTencent(normalizeStockCode(stockCode));
      results.push(data);
    } catch (error) {
      console.error(`Failed to get data for ${stockCode}:`, error);
      results.push({
        code: normalizeStockCode(stockCode),
        name: '获取失败',
        error: '数据获取失败'
      });
    }
  }

  return results;
}

// GET请求 - 获取单只股票数据
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get('code');
    const codes = searchParams.get('codes'); // 批量查询用逗号分隔

    // 批量查询
    if (codes) {
      const stockList = codes.split(',').map((c: string) => c.trim()).filter((c: string) => c);
      const results = await getMultipleStockData(stockList);
      
      return NextResponse.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    }

    // 单只股票查询
    if (!stockCode) {
      return NextResponse.json({
        success: false,
        error: '请提供股票代码 (如: 00700.hk 或 700)'
      }, { status: 400 });
    }

    const stockData = await getStockData(stockCode);

    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Stock API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '获取股票数据失败',
      message: '请检查股票代码是否正确，港股代码格式如: 00700.hk 或 700'
    }, { status: 500 });
  }
}

// POST请求 - 支持批量查询
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stockCode, stockCodes } = body;

    // 批量查询
    if (stockCodes && Array.isArray(stockCodes)) {
      const results = await getMultipleStockData(stockCodes);
      
      return NextResponse.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
    }

    // 单只股票查询
    if (!stockCode) {
      return NextResponse.json({
        success: false,
        error: '请提供股票代码'
      }, { status: 400 });
    }

    const stockData = await getStockData(stockCode);

    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Stock API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '获取股票数据失败',
      message: '请检查股票代码是否正确，港股代码格式如: 00700.hk 或 700'
    }, { status: 500 });
  }
}
