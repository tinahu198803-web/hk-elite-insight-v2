/**
 * 港股通数据查询API
 * 从Supabase数据库查询最新数据
 * 
 * GET /api/stock-connect?code=02659
 */

import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

interface StockConnectRecord {
  stock_code: string;
  stock_name: string;
  stock_name_en: string;
  industry: string;
  connect_type: string;
  hsci_type: string;
  inclusion_date: string;
  status: string;
  notes: string;
}

// 从Supabase获取港股通数据
async function getFromSupabase(stockCode: string): Promise<StockConnectRecord | null> {
  try {
    const normalizedCode = stockCode.replace(/\.hk$/i, '').replace(/^hk/i, '').padStart(5, '0');
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/hk_stock_connect?stock_code=eq.${normalizedCode}&status=eq.active&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        next: { revalidate: 60 } // 缓存60秒
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return data[0];
      }
    }
  } catch (error) {
    console.error('Supabase查询失败:', error);
  }
  return null;
}

// 备用本地数据
const LOCAL_BACKUP: Record<string, StockConnectRecord> = {
  '02659': {
    stock_code: '02659',
    stock_name: '宝济药业-B',
    stock_name_en: 'Baoji Pharma',
    industry: '生物医药',
    connect_type: '南向',
    hsci_type: '小型股',
    inclusion_date: '2025-03-09',
    status: 'active',
    notes: '2024年12月上市，2025年3月9日正式纳入港股通！'
  },
  '02575': {
    stock_code: '02575',
    stock_name: '轩竹生物',
    stock_name_en: 'Xuanzhu Biotech',
    industry: '生物医药',
    connect_type: '南向',
    hsci_type: '小型股',
    inclusion_date: '2025-03-09',
    status: 'active',
    notes: '2025年3月9日上市，上市当日纳入港股通！'
  },
  '02655': {
    stock_code: '02655',
    stock_name: '果下科技',
    stock_name_en: 'Guoxia Technology',
    industry: '科技',
    connect_type: '南向',
    hsci_type: '小型股',
    inclusion_date: '2025-03',
    status: 'active',
    notes: '2025年3月纳入港股通'
  },
  '00700': {
    stock_code: '00700',
    stock_name: '腾讯控股',
    stock_name_en: 'Tencent Holdings',
    industry: '互联网',
    connect_type: '南向',
    hsci_type: '大型股',
    inclusion_date: '',
    status: 'active',
    notes: '上市即入通，恒生指数成分股'
  },
  '09988': {
    stock_code: '09988',
    stock_name: '阿里巴巴-SW',
    stock_name_en: 'Alibaba Group',
    industry: '互联网',
    connect_type: '南向',
    hsci_type: '大型股',
    inclusion_date: '2019-11',
    status: 'active',
    notes: '恒生指数成分股'
  },
  '03690': {
    stock_code: '03690',
    stock_name: '美团-W',
    stock_name_en: 'Meituan',
    industry: '消费',
    connect_type: '南向',
    hsci_type: '大型股',
    inclusion_date: '2018-09',
    status: 'active',
    notes: '恒生指数成分股'
  },
  '01810': {
    stock_code: '01810',
    stock_name: '小米集团-W',
    stock_name_en: 'Xiaomi Group',
    industry: '科技',
    connect_type: '南向',
    hsci_type: '大型股',
    inclusion_date: '2019-09',
    status: 'active',
    notes: '恒生指数成分股'
  },
  '09618': {
    stock_code: '09618',
    stock_name: '京东集团-SW',
    stock_name_en: 'JD.com',
    industry: '互联网',
    connect_type: '南向',
    hsci_type: '大型股',
    inclusion_date: '2020-06',
    status: 'active',
    notes: '恒生指数成分股'
  },
  '02318': {
    stock_code: '02318',
    stock_name: '中国平安',
    stock_name_en: 'Ping An',
    industry: '保险',
    connect_type: '南向',
    hsci_type: '大型股',
    inclusion_date: '',
    status: 'active',
    notes: '上市即入通，恒生指数成分股'
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: '缺少股票代码参数' }, { status: 400 });
  }

  // 1. 优先从Supabase获取
  const dbRecord = await getFromSupabase(code);
  
  if (dbRecord) {
    return NextResponse.json({
      success: true,
      source: 'database',
      data: {
        code: dbRecord.stock_code,
        name: dbRecord.stock_name,
        nameEn: dbRecord.stock_name_en,
        industry: dbRecord.industry,
        connectStatus: dbRecord.connect_type === '南向' ? '已入通' : '未入通',
        hsciType: dbRecord.hsci_type,
        inclusionDate: dbRecord.inclusion_date,
        notes: dbRecord.notes,
        status: dbRecord.status
      }
    });
  }

  // 2. 备用本地数据
  const normalizedCode = code.replace(/\.hk$/i, '').replace(/^hk/i, '').padStart(5, '0');
  const localRecord = LOCAL_BACKUP[normalizedCode];

  if (localRecord) {
    return NextResponse.json({
      success: true,
      source: 'local_backup',
      data: {
        code: localRecord.stock_code,
        name: localRecord.stock_name,
        nameEn: localRecord.stock_name_en,
        industry: localRecord.industry,
        connectStatus: localRecord.connect_type === '南向' ? '已入通' : '未入通',
        hsciType: localRecord.hsci_type,
        inclusionDate: localRecord.inclusion_date,
        notes: localRecord.notes,
        status: localRecord.status
      }
    });
  }

  // 3. 未找到
  return NextResponse.json({
    success: false,
    error: '未找到该股票的港股通数据',
    code: normalizedCode
  }, { status: 404 });
}
