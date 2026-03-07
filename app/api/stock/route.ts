import { NextResponse } from 'next/server';

// 腾讯财经API基础URL
const TENCENT_FINANCE_API = 'https://qt.gtimg.cn/q=';

// 港股股票代码规范化
function normalizeStockCode(code: string): string {
  // 移除空格和特殊字符
  let normalized = code.trim().toUpperCase();
  
  // 如果已经是完整格式 (如 00700.hk)，直接返回
  if (normalized.endsWith('.HK')) {
    return normalized;
  }
  
  // 如果只是数字，添加 .hk 后缀
  if (/^\d+$/.test(normalized)) {
    return `${normalized}.hk`;
  }
  
  return normalized;
}

// 获取股票数据
async function getStockData(stockCode: string) {
  try {
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
      name: dataParts[0],           // 股票名称
      price: parseFloat(dataParts[1]),        // 当前价格
      change: parseFloat(dataParts[2]),      // 涨跌额
      changePct: parseFloat(dataParts[3]),   // 涨跌幅
      volume: parseInt(dataParts[4]),         // 成交量
      amount: parseFloat(dataParts[5]),      // 成交额
      amplitude: parseFloat(dataParts[5]),   // 振幅
      high: parseFloat(dataParts[33]),       // 最高价
      low: parseFloat(dataParts[34]),        // 最低价
      open: parseFloat(dataParts[36]),       // 开盘价
      prevClose: parseFloat(dataParts[37]),  // 昨收价
      turnoverRate: parseFloat(dataParts[38]), // 换手率
      marketCap: parseFloat(dataParts[45]),   // 总市值
      pe: parseFloat(dataParts[46]),         // 市盈率
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('获取股票数据失败:', error);
    throw error;
  }
}

// 批量获取多只股票数据
async function getMultipleStockData(stockCodes: string[]) {
  try {
    const codes = stockCodes.map(code => normalizeStockCode(code)).join(',');
    const url = `${TENCENT_FINANCE_API}${codes}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const results: any[] = [];
    
    // 解析多个股票数据
    // 格式: "stock_id="data1","data2"... "stock_id2="data1"... 
    const stockMatches = Array.from(text.matchAll(/"([^"]+?)="([^"]+)"/g));
    
    for (const match of stockMatches) {
      const stockCode = match[1];
      const dataParts = match[2].split(',');
      
      if (dataParts.length >= 10) {
        results.push({
          code: stockCode,
          name: dataParts[0],
          price: parseFloat(dataParts[1]),
          change: parseFloat(dataParts[2]),
          changePct: parseFloat(dataParts[3]),
          volume: parseInt(dataParts[4]),
          amount: parseFloat(dataParts[5]),
          high: parseFloat(dataParts[33]),
          low: parseFloat(dataParts[34]),
          open: parseFloat(dataParts[36]),
          prevClose: parseFloat(dataParts[37]),
          marketCap: parseFloat(dataParts[45]),
          pe: parseFloat(dataParts[46]),
        });
      }
    }

    return results;
  } catch (error: any) {
    console.error('批量获取股票数据失败:', error);
    throw error;
  }
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
