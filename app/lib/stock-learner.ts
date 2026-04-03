/**
 * 股票自动学习器
 * 功能：
 * 1. 从东方财富API获取最新港股IPO数据
 * 2. 自动更新股票名称映射
 * 3. 学习新上市公司案例
 * 4. 监控停牌信息
 */

import { NextResponse } from 'next/server';

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// 已知股票代码集合（用于检测新股票）
const KNOWN_STOCKS = new Set([
  '00700', '09988', '03690', '01810', '02418', '09618', '06618', '02559', '09999',
  '09868', '09881', '01765', '02333', '00175', '01877', '02269', '02659', '02655',
  '09989', '01801', '01548', '06186', '09939', '02569', '06030', '06837', '03908',
  '06099', '02318', '00981', '02691', '09633', '06699', '06098', '06060'
]);

// 从东方财富获取最新港股行情
async function getRecentHKStocks(): Promise<any[]> {
  try {
    // 东方财富港股实时行情 - 获取今日涨幅榜
    const url = 'https://push2.eastmoney.com/api/qt/clist/get?cb=jQuery&pn=1&pz=50&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:116+t:3&fields=f1,f2,f3,f12,f14,f15,f16,f17,f18';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/'
      },
      next: { revalidate: 300 } // 5分钟缓存
    });

    if (!response.ok) {
      console.error('东方财富API请求失败:', response.status);
      return [];
    }

    const text = await response.text();
    const jsonMatch = text.match(/jQuery\((.*)\)/);
    if (!jsonMatch) {
      console.error('东方财富返回数据格式错误');
      return [];
    }

    const data = JSON.parse(jsonMatch[1]);
    if (!data.data || !data.data.diff) {
      console.error('东方财富返回数据为空');
      return [];
    }

    return data.data.diff.map((item: any) => ({
      code: item.f12,
      name: item.f14,
      change: item.f3,
      price: item.f2,
      high: item.f15,
      low: item.f16,
      volume: item.f5,
      time: item.f18
    }));

  } catch (error) {
    console.error('获取港股数据失败:', error);
    return [];
  }
}

// 从东方财富获取特定股票信息
async function getStockInfoFromAPI(code: string): Promise<any> {
  try {
    const normalizedCode = code.padStart(5, '0');
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${normalizedCode}&fields=f43,f57,f58,f107,f47,f48,f116,f117,f50`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com/'
      }
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (json.rc !== 0 || !json.data) return null;

    const d = json.data;
    return {
      code: normalizedCode,
      name: d.f58 || '',
      price: (d.f43 || 0) / 100,
      change: ((d.f107 || 0) / 100).toFixed(2),
      volume: d.f47 || 0,
      marketCap: d.f116 || 0,
      floatMarketCap: d.f117 || 0
    };

  } catch (error) {
    console.error('获取股票信息失败:', error);
    return null;
  }
}

// 保存新股票到数据库
async function saveNewStock(stock: any): Promise<boolean> {
  try {
    // 先检查是否已存在
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/ipo_learned_cases?stock_code=eq.${stock.code}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing.length > 0) {
        // 已存在，更新
        await fetch(
          `${SUPABASE_URL}/rest/v1/ipo_learned_cases?stock_code=eq.${stock.code}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              listing_price: stock.price,
              market_cap: stock.marketCap,
              updated_at: new Date().toISOString()
            })
          }
        );
        return true;
      }
    }

    // 新增记录
    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/ipo_learned_cases`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          stock_code: stock.code,
          company_name: stock.name,
          listing_date: new Date().toISOString().split('T')[0],
          listing_price: stock.price || 0,
          market_cap: stock.marketCap || 0,
          industry: stock.industry || '未知',
          listing_type: 'main_board',
          outcome: 'success'
        })
      }
    );

    return insertResponse.ok;

  } catch (error) {
    console.error('保存股票失败:', error);
    return false;
  }
}

// 获取停牌股票列表
async function getSuspendedStocks(): Promise<any[]> {
  try {
    // 东方财富停牌股票列表
    const url = 'https://push2.eastmoney.com/api/qt/clist/get?cb=jQuery&pn=1&pz=100&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:116+s:2048&fields=f12,f14,f18';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com/'
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) return [];

    const text = await response.text();
    const jsonMatch = text.match(/jQuery\((.*)\)/);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    if (!data.data || !data.data.diff) return [];

    return data.data.diff.map((item: any) => ({
      code: item.f12,
      name: item.f14,
      suspendDate: item.f18
    }));

  } catch (error) {
    console.error('获取停牌股票失败:', error);
    return [];
  }
}

// 主函数：检测新股票
export async function detectNewStocks(): Promise<{
  newStocks: any[];
  totalChecked: number;
  timestamp: string;
}> {
  console.log('🔍 开始检测新港股...');
  
  const recentStocks = await getRecentHKStocks();
  const newStocks: any[] = [];

  for (const stock of recentStocks) {
    // 清理股票代码（前缀0）
    const cleanCode = stock.code.replace(/^0+/, '') || stock.code;
    
    // 检查是否是新股票
    if (!KNOWN_STOCKS.has(cleanCode) && stock.change !== '-' && stock.change !== 0) {
      console.log(`📈 发现潜在新股票: ${stock.code} - ${stock.name}`);
      
      // 获取详细信息
      const detailedInfo = await getStockInfoFromAPI(cleanCode);
      
      if (detailedInfo && detailedInfo.name) {
        newStocks.push({
          code: cleanCode,
          name: detailedInfo.name,
          price: detailedInfo.price,
          change: detailedInfo.change,
          marketCap: detailedInfo.marketCap,
          isNew: !KNOWN_STOCKS.has(cleanCode)
        });

        // 自动保存到数据库
        await saveNewStock(detailedInfo);
        
        // 添加到已知列表
        KNOWN_STOCKS.add(cleanCode);
      }
    }
  }

  return {
    newStocks,
    totalChecked: recentStocks.length,
    timestamp: new Date().toISOString()
  };
}

// 主函数：获取停牌信息
export async function getSuspensionInfo(): Promise<{
  suspendedStocks: any[];
  count: number;
  timestamp: string;
}> {
  console.log('🔍 开始获取停牌股票...');
  
  const suspended = await getSuspendedStocks();

  return {
    suspendedStocks: suspended,
    count: suspended.length,
    timestamp: new Date().toISOString()
  };
}

// 导出API路由
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'detect_new') {
      const result = await detectNewStocks();
      return NextResponse.json({
        success: true,
        data: result,
        message: result.newStocks.length > 0 
          ? `发现${result.newStocks.length}只新股票` 
          : '未发现新股票'
      });
    }

    if (action === 'suspended') {
      const result = await getSuspensionInfo();
      return NextResponse.json({
        success: true,
        data: result,
        message: `当前${result.count}只股票停牌`
      });
    }

    if (action === 'full_scan') {
      // 全量扫描
      const newStocksResult = await detectNewStocks();
      const suspendedResult = await getSuspensionInfo();
      
      return NextResponse.json({
        success: true,
        data: {
          newStocks: newStocksResult,
          suspended: suspendedResult
        },
        message: `扫描完成：新股票${newStocksResult.newStocks.length}只，停牌${suspendedResult.count}只`
      });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });

  } catch (error: any) {
    console.error('自动学习失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'detect_new';

    if (action === 'detect_new') {
      const result = await detectNewStocks();
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'suspended') {
      const result = await getSuspensionInfo();
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });

  } catch (error: any) {
    console.error('获取信息失败:', error);
    return NextResponse.json({success: false, error: error.message }, { status: 500 });
  }
}
