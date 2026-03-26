/**
 * 港股通数据爬虫API
 * 定时抓取最新的港股通名单
 * 
 * 调用方式：
 * GET /api/crawl/stock-connect?key=YOUR_CRON_KEY
 * 
 * Vercel Cron配置：
 * vercel.json 中配置每天凌晨2点运行
 */

import { NextResponse } from 'next/server';

// 环境变量
const CRON_KEY = process.env.CRON_SECRET_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// 验证Cron Key
function verifyCronKey(requestKey: string | null): boolean {
  if (!CRON_KEY) return true; // 如果没有设置key，直接放行
  return requestKey === CRON_KEY;
}

// 东方财富港股通数据API
async function fetchHKStockConnectFromEastMoney(): Promise<any[]> {
  try {
    const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get';
    const params = new URLSearchParams({
      reportName: 'RPT_SA_HK_STOCKS_DAILYSTATIC',
      columns: 'ALL',
      pageNumber: '1',
      pageSize: '500',
      sortTypes: '-1',
      sortColumns: 'TRADE_DATE',
      source: 'WEB',
      client: 'WEB'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.eastmoney.com'
      },
      next: { revalidate: 0 }
    });

    const data = await response.json();
    
    if (data.success && data.result?.data) {
      return data.result.data;
    }
    return [];
  } catch (error) {
    console.error('东方财富API请求失败:', error);
    return [];
  }
}

// 更新Supabase数据库
async function updateSupabaseStockConnect(stocks: any[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const stock of stocks) {
    try {
      const stockCode = stock.SECURITY_CODE?.replace('HK', '').padStart(5, '0') || '';
      
      const record = {
        stock_code: stockCode,
        stock_name: stock.NAME || stock.SECURITY_CODE,
        stock_name_en: stock.EN_NAME || '',
        industry: stock.INDUSTRY || '未知',
        connect_type: '南向',
        hsci_type: stock.HS_TYPE || '小型股',
        inclusion_date: stock.INTO_DATE || null,
        status: 'active',
        source: 'eastmoney',
        notes: `市值: ${stock.MARKET_VALUE || 'N/A'}亿港元`
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/hk_stock_connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`更新股票 ${stock.SECURITY_CODE} 失败:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// 记录更新日志
async function logUpdate(dataType: string, status: string, records: number, error?: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/data_update_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        data_type: dataType,
        update_status: status,
        records_updated: records,
        error_message: error || null,
        completed_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('记录更新日志失败:', error);
  }
}

// GET - 手动触发爬虫
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const force = searchParams.get('force') === 'true';

  // 验证key
  if (!verifyCronKey(key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('开始抓取港股通数据...');

  try {
    // 1. 从东方财富获取数据
    const stocks = await fetchHKStockConnectFromEastMoney();
    console.log(`获取到 ${stocks.length} 条股票数据`);

    // 2. 如果没有获取到数据，使用备用方案
    if (stocks.length === 0 || force) {
      console.log('使用备用数据...');
      
      // 备用数据：已知的主要港股通股票
      const backupStocks = [
        { code: '02659', name: '宝济药业-B', date: '2025-03-09', type: '小型股' },
        { code: '02575', name: '轩竹生物', date: '2025-03-09', type: '小型股' },
        { code: '02655', name: '果下科技', date: '2025-03', type: '小型股' },
        { code: '00700', name: '腾讯控股', date: null, type: '大型股' },
        { code: '09988', name: '阿里巴巴-SW', date: '2019-11', type: '大型股' },
        { code: '03690', name: '美团-W', date: '2018-09', type: '大型股' },
        { code: '01810', name: '小米集团-W', date: '2019-09', type: '大型股' },
        { code: '09618', name: '京东集团-SW', date: '2020-06', type: '大型股' },
        { code: '09909', name: '网易-S', date: '2020-06', type: '大型股' },
        { code: '09961', name: '百度集团-SW', date: '2021-03', type: '大型股' },
        { code: '02318', name: '中国平安', date: null, type: '大型股' },
        { code: '00941', name: '中国移动', date: null, type: '大型股' },
        { code: '00939', name: '建设银行', date: null, type: '大型股' },
        { code: '02628', name: '中国人寿', date: null, type: '大型股' },
        { code: '09688', name: '友邦保险', date: null, type: '大型股' },
        { code: '03968', name: '招商银行', date: null, type: '中型股' },
        { code: '06030', name: '中信证券', date: null, type: '中型股' },
        { code: '02382', name: '舜宇光学', date: '2018-09', type: '中型股' },
        { code: '06690', name: '海尔智家', date: '2018-12', type: '中型股' },
        { code: '06808', name: '京东健康', date: '2020-12', type: '中型股' },
        { code: '02899', name: '紫金矿业', date: '2020-12', type: '中型股' },
        { code: '00291', name: '华润啤酒', date: null, type: '中型股' },
        { code: '03888', name: '海底捞', date: '2018-09', type: '中型股' },
        { code: '01877', name: '百济神州', date: '2018-03', type: '中型股' },
        { code: '02269', name: '药明生物', date: '2017-06', type: '中型股' },
        { code: '09888', name: '小鹏汽车-W', date: '2021-07', type: '中型股' },
        { code: '09881', name: '理想汽车-W', date: '2024-03', type: '中型股' },
      ];

      // 更新备用数据到Supabase
      let updated = 0;
      for (const stock of backupStocks) {
        try {
          const record = {
            stock_code: stock.code,
            stock_name: stock.name,
            industry: stock.name.includes('药') || stock.name.includes('生物') ? '生物医药' : 
                     stock.name.includes('银行') || stock.name.includes('保险') ? '金融' :
                     stock.name.includes('汽车') ? '新能源汽车' : '综合',
            connect_type: '南向',
            hsci_type: stock.type,
            inclusion_date: stock.date,
            status: 'active',
            source: 'manual_backup',
            notes: stock.date ? `纳入日期: ${stock.date}` : '上市即入通'
          };

          const response = await fetch(`${SUPABASE_URL}/rest/v1/hk_stock_connect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(record)
          });

          if (response.ok) updated++;
        } catch (e) {
          console.error(`更新 ${stock.code} 失败`);
        }
      }

      const duration = Date.now() - startTime;
      await logUpdate('hk_connect', 'success', updated);

      return NextResponse.json({
        success: true,
        source: 'backup_data',
        recordsUpdated: updated,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // 3. 更新到Supabase
    const result = await updateSupabaseStockConnect(stocks);
    const duration = Date.now() - startTime;

    // 4. 记录日志
    await logUpdate('hk_connect', result.failed > 0 ? 'partial' : 'success', result.success, 
      result.failed > 0 ? `${result.failed}条更新失败` : undefined);

    console.log(`完成！成功: ${result.success}, 失败: ${result.failed}`);

    return NextResponse.json({
      success: true,
      source: 'eastmoney',
      recordsFetched: stocks.length,
      recordsUpdated: result.success,
      recordsFailed: result.failed,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('爬虫执行失败:', error);
    await logUpdate('hk_connect', 'failed', 0, error.message);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
