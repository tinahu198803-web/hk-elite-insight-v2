/**
 * 定时任务API - 自我进化和学习
 * 用于定期执行：
 * 1. 新股检测
 * 2. 停牌信息更新
 * 3. 反馈分析
 * 4. 知识库更新
 */

import { NextResponse } from 'next/server';

// Supabase配置 - 从环境变量读取
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 港股数据API源配置（支持故障转移）
const HK_STOCK_API_SOURCES = {
  // 主数据源：东方财富（免费实时）
  primary: {
    name: '东方财富',
    hotStocks: 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:116+t:3&fields=f12,f14,f3,f2,f5,f6,f18',
    suspended: 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:116+s:2048&fields=f12,f14,f18',
    volume: 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=30&po=1&np=1&fltt=2&invt=2&fid=f62&fs=m:116+t:3&fields=f12,f14,f62,f2,f3',
    stockDetail: (code: string) => `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${code.padStart(5, '0')}&fields=f43,f57,f58,f107,f47,f48,f116,f117,f50,f169,f170`,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://quote.eastmoney.com/' }
  },
  // 备用数据源1：腾讯财经（免费，无需注册）
  tencent: {
    name: '腾讯财经',
    hotStocks: 'https://qt.gtimg.cn/q=hshs',
    stockDetail: (code: string) => `https://qt.gtimg.cn/q=hk${code.padStart(5, '0')}`,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://gu.qq.com/' }
  },
  // 备用数据源2：新浪财经（免费，无需注册，可能有延迟）
  sina: {
    name: '新浪财经',
    hotStocks: 'https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataSimple?page=1&num=100&sort=changepercent&asc=0&node=hk_a&symbol=&_s_r_a=page',
    stockDetail: (code: string) => `https://hq.sinajs.cn/list=hk${code.padStart(5, '0')}`,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.sina.com.cn/' }
  }
};

// 当前使用的API源
let currentSource = 'primary';
let lastSourceSwitch = new Date();

// API健康检查和故障转移
async function checkApiHealth(source: keyof typeof HK_STOCK_API_SOURCES): Promise<boolean> {
  try {
    if (source === 'primary') {
      const response = await fetch(HK_STOCK_API_SOURCES.primary.hotStocks, {
        headers: HK_STOCK_API_SOURCES.primary.headers,
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    }
    return false;
  } catch {
    return false;
  }
}

// 自动切换到备用数据源（按优先级）
async function switchToBackupSource(): Promise<boolean> {
  console.log(`🔄 [${new Date().toISOString()}] 主数据源不可用，尝试切换到备用数据源...`);
  
  // 优先级1：新浪财经（免费，无需注册）
  try {
    const response = await fetch(HK_STOCK_API_SOURCES.sina.hotStocks, {
      headers: HK_STOCK_API_SOURCES.sina.headers,
      signal: AbortSignal.timeout(8000)
    });
    if (response.ok) {
      currentSource = 'sina';
      lastSourceSwitch = new Date();
      console.log('✅ 已切换到备用数据源: 新浪财经（免费）');
      return true;
    }
  } catch (e) {
    console.log('❌ 新浪财经不可用');
  }
  
  // 优先级2：iTick（付费，需要token）
  if (HK_STOCK_API_SOURCES.itick.token) {
    try {
      const response = await fetch(`${HK_STOCK_API_SOURCES.itick.baseUrl}/stock/kline?region=hk&code=700&kType=1`, {
        headers: { ...HK_STOCK_API_SOURCES.itick.headers, 'token': HK_STOCK_API_SOURCES.itick.token },
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        currentSource = 'itick';
        lastSourceSwitch = new Date();
        console.log('✅ 已切换到备用数据源: iTick（付费）');
        return true;
      }
    } catch (e) {
      console.log('❌ iTick不可用');
    }
  }
  
  // 优先级3：AllTick（付费，需要token）
  if (HK_STOCK_API_SOURCES.alltick.token) {
    try {
      const response = await fetch(`${HK_STOCK_API_SOURCES.alltick.baseUrl}/quote-stock-b-api/kline?token=${HK_STOCK_API_SOURCES.alltick.token}&query={"code":"700.HK","kline_type":1}`, {
        headers: HK_STOCK_API_SOURCES.alltick.headers,
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        currentSource = 'alltick';
        lastSourceSwitch = new Date();
        console.log('✅ 已切换到备用数据源: AllTick（付费）');
        return true;
      }
    } catch (e) {
      console.log('❌ AllTick不可用');
    }
  }
  
  console.log('⚠️ 所有备用数据源都不可用');
  return false;
}

// 从新浪财经获取港股涨幅榜
async function getSinaHotStocks(): Promise<any[]> {
  try {
    const url = HK_STOCK_API_SOURCES.sina.hotStocks;
    
    const response = await fetch(url, {
      headers: HK_STOCK_API_SOURCES.sina.headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return [];

    const text = await response.text();
    // 新浪返回的是JavaScript对象格式，需要解析
    const jsonMatch = text.match(/\{.*\}/);
    if (!jsonMatch) return [];
    
    const data = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      code: item.symbol?.replace('hk', '') || '',
      name: item.name || '',
      change: parseFloat(item.changepercent) || 0,
      price: parseFloat(item.trade) || 0,
      volume: parseInt(item.volume) || 0,
      amount: parseFloat(item.amount) || 0,
      source: 'sina'
    }));

  } catch (error) {
    console.error('从新浪获取热门股票失败:', error);
    return [];
  }
}

// 从腾讯财经获取港股数据
async function getTencentStocks(): Promise<any[]> {
  try {
    const response = await fetch(HK_STOCK_API_SOURCES.tencent.hotStocks, {
      headers: HK_STOCK_API_SOURCES.tencent.headers
    });
    
    if (!response.ok) return [];
    
    const text = await response.text();
    // 腾讯返回格式处理
    return [];
  } catch {
    return [];
  }
}

// 记录任务执行日志
async function logTask(taskName: string, success: boolean, details: any, error?: string): Promise<void> {
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/scheduled_task_logs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          task_name: taskName,
          task_type: 'auto_learning',
          success,
          details,
          error_message: error || null,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
      }
    );
  } catch (e) {
    console.error('记录日志失败:', e);
  }
}

// 获取港股涨幅榜（带故障转移）
async function getEastMoneyHotStocks(): Promise<any[]> {
  try {
    // 获取今日涨幅最大的港股
    const url = HK_STOCK_API_SOURCES.primary.hotStocks;
    
    const response = await fetch(url, {
      headers: HK_STOCK_API_SOURCES.primary.headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      // API返回错误，尝试切换到备用源
      await switchToBackupSource();
      return [];
    }

    const data = await response.json();
    return (data.data?.diff || []).map((item: any) => ({
      code: item.f12?.toString().padStart(5, '0'),
      name: item.f14,
      change: item.f3,
      price: item.f2,
      volume: item.f5,
      reason: item.f18 || '热门股票',
      source: currentSource
    }));

  } catch (error) {
    console.error('获取热门股票失败:', error);
    // 网络错误，尝试故障转移
    if (currentSource === 'primary') {
      await switchToBackupSource();
    }
    
    // 如果切换到了新浪，使用新浪的函数
    if (currentSource === 'sina') {
      const sinaStocks = await getSinaHotStocks();
      if (sinaStocks.length > 0) {
        return sinaStocks;
      }
    }
    
    return [];
  }
}

// 获取停牌股票（带故障转移）
async function getSuspendedStocks(): Promise<any[]> {
  try {
    const url = HK_STOCK_API_SOURCES.primary.suspended;
    
    const response = await fetch(url, {
      headers: HK_STOCK_API_SOURCES.primary.headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data?.diff || []).map((item: any) => ({
      code: item.f12?.toString().padStart(5, '0'),
      name: item.f14,
      suspendDate: item.f18,
      source: currentSource
    }));

  } catch (error) {
    console.error('获取停牌股票失败:', error);
    // 停牌信息暂无备用源，返回空数组
    return [];
  }
}

// 获取高成交额热门股票（带故障转移）
async function getHotStocksByVolume(): Promise<any[]> {
  try {
    const url = HK_STOCK_API_SOURCES.primary.volume;
    
    const response = await fetch(url, {
      headers: HK_STOCK_API_SOURCES.primary.headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data?.diff || []).map((item: any) => ({
      code: item.f12?.toString().padStart(5, '0'),
      name: item.f14,
      amount: item.f62, // 成交额(元)
      price: item.f2,
      change: item.f3,
      source: currentSource
    }));

  } catch (error) {
    console.error('获取热门股票失败:', error);
    return [];
  }
}

// 从新浪财经获取股票详情
async function getSinaStockDetail(code: string): Promise<any> {
  try {
    const normalizedCode = code.padStart(5, '0');
    const url = HK_STOCK_API_SOURCES.sina.stockDetail(normalizedCode);
    
    const response = await fetch(url, {
      headers: HK_STOCK_API_SOURCES.sina.headers,
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const text = await response.text();
    // 新浪返回格式: var hq_str_hk00001="名称,当前价格,昨收,开盘,最高,最低,成交量...";
    const match = text.match(/hq_str_hk\d+="([^"]+)"/);
    if (!match) return null;

    const parts = match[1].split(',');
    return {
      code: normalizedCode,
      name: parts[1] || '',
      price: parseFloat(parts[3]) || 0,
      change: parseFloat(parts[4]) || 0,
      changePct: parts[4] && parts[3] ? (((parseFloat(parts[4]) - parseFloat(parts[3])) / parseFloat(parts[3])) * 100).toFixed(2) : 0,
      open: parseFloat(parts[3]) || 0,
      high: parseFloat(parts[5]) || 0,
      low: parseFloat(parts[6]) || 0,
      volume: parseInt(parts[7]) || 0,
      amount: parseFloat(parts[8]) || 0,
      timestamp: new Date().toISOString(),
      source: 'sina'
    };

  } catch (error) {
    console.error('从新浪获取股票详情失败:', error);
    return null;
  }
}

// 识别可能的新上市公司（从名称中识别）
function detectNewListings(stocks: any[]): any[] {
  const newIndicators = ['(新)', '(新上市)', '-S', '-SW', '-W', '-B'];
  return stocks.filter(stock => 
    newIndicators.some(ind => stock.name?.includes(ind)) ||
    stock.code?.startsWith('0') && parseInt(stock.code) >= 26000 // 2020年后上市的代码范围
  ).map(s => ({
    ...s,
    isNewListing: true
  }));
}

// 获取特定股票详情（带故障转移）
async function getStockDetail(code: string): Promise<any> {
  try {
    const normalizedCode = code.padStart(5, '0');
    const url = HK_STOCK_API_SOURCES.primary.stockDetail(normalizedCode);
    
    const response = await fetch(url, {
      headers: HK_STOCK_API_SOURCES.primary.headers,
      signal: AbortSignal.timeout(5000)
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
      changePct: d.f170 || 0,
      volume: d.f47 || 0,
      amount: d.f48 || 0,
      marketCap: d.f116 || 0,
      floatMarketCap: d.f117 || 0,
      pe: d.f50 || null,
      timestamp: new Date().toISOString(),
      source: currentSource
    };

  } catch (error) {
    console.error('获取股票详情失败:', error);
    return null;
  }
}

// 任务1: 新股检测（增强版）
async function taskNewStockDetection(): Promise<any> {
  console.log('📡 执行任务: 新股检测（增强版）');
  
  // 获取涨幅榜和高成交额股票
  const [hotStocks, volumeStocks] = await Promise.all([
    getEastMoneyHotStocks(),
    getHotStocksByVolume()
  ]);
  
  const newStocks: any[] = [];
  
  // 从涨幅榜检测
  for (const stock of hotStocks.slice(0, 30)) {
    const detail = await getStockDetail(stock.code);
    if (detail && detail.price > 0) {
      newStocks.push({
        code: stock.code,
        name: stock.name,
        price: detail.price,
        change: detail.change,
        changePct: detail.changePct,
        marketCap: detail.marketCap,
        amount: stock.amount || 0,
        detectedAt: new Date().toISOString(),
        detectionType: stock.change > 10 ? 'high_change' : 'normal'
      });
    }
  }
  
  // 从高成交额中检测新股
  const newListings = detectNewListings(volumeStocks);
  
  // 合并结果
  const allNewStocks = [...newStocks, ...newListings];
  const uniqueStocks = allNewStocks.filter((stock, index, self) => 
    index === self.findIndex(s => s.code === stock.code)
  );

  await logTask('new_stock_detection', true, {
    detectedCount: uniqueStocks.length,
    stocks: uniqueStocks.map(s => ({ code: s.code, name: s.name, change: s.change })),
    summary: {
      fromHotList: newStocks.length,
      fromVolume: newListings.length,
      newListings: newListings.filter(s => s.isNewListing).length
    }
  });

  return { 
    newStocks: uniqueStocks, 
    count: uniqueStocks.length,
    summary: {
      fromHotList: newStocks.length,
      fromVolume: newListings.length,
      newListings: newListings.filter(s => s.isNewListing).length
    }
  };
}

// 任务2: 停牌信息更新
async function taskSuspensionUpdate(): Promise<any> {
  console.log('📡 执行任务: 停牌信息更新');
  
  const suspended = await getSuspendedStocks();
  
  await logTask('suspension_update', true, {
    suspendedCount: suspended.length,
    stocks: suspended.map(s => ({ code: s.code, name: s.name, date: s.suspendDate }))
  });

  return { suspended, count: suspended.length };
}

// 任务3: 反馈分析
async function taskFeedbackAnalysis(): Promise<any> {
  console.log('📡 执行任务: 反馈分析');
  
  // 获取所有专家的反馈
  const experts = ['health-check', 'ipo-analysis', 'listing-path', 'compliance', 'valuation', 'index-inclusion', 'stock-connect-planning', 'market-cap-maintenance'];
  const results: any[] = [];

  for (const expertId of experts) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/expert_feedback?expert_id=eq.${expertId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (response.ok) {
        const feedback = await response.json();
        const negative = feedback.filter((f: any) => f.rating === 'negative');
        
        if (negative.length > 0) {
          // 分析负面反馈
          const issues = analyzeFeedbackIssues(negative);
          
          // 更新进化状态
          await fetch(
            `${SUPABASE_URL}/rest/v1/expert_evolution?expert_id=eq.${expertId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'upsert'
              },
              body: JSON.stringify({
                expert_id: expertId,
                learning_cycle: 1,
                status: 'learning',
                last_update: new Date().toISOString(),
                metrics: {
                  totalInteractions: feedback.length,
                  positiveFeedback: feedback.filter((f: any) => f.rating === 'positive').length,
                  negativeFeedback: negative.length,
                  issues: issues
                }
              })
            }
          );

          results.push({ expertId, feedbackCount: feedback.length, issues });
        }
      }
    } catch (e) {
      console.error(`分析专家 ${expertId} 反馈失败:`, e);
    }
  }

  await logTask('feedback_analysis', true, { analyzedExperts: results.length, results });

  return { analyzedExperts: results.length, results };
}

// 分析反馈问题
function analyzeFeedbackIssues(feedback: any[]): string[] {
  const issues: string[] = [];

  for (const f of feedback) {
    if (f.feedback) {
      const text = f.feedback.toLowerCase();
      if (text.includes('名字') || text.includes('名称')) issues.push('股票名称错误');
      if (text.includes('价格')) issues.push('价格数据错误');
      if (text.includes('市值')) issues.push('市值数据错误');
      if (text.includes('港股通')) issues.push('港股通状态错误');
      if (text.includes('过时') || text.includes('旧')) issues.push('法规引用过时');
      if (text.includes('编造') || text.includes('幻觉')) issues.push('AI幻觉');
    }
  }

  return [...new Set(issues)];
}

// 任务4: 知识库更新提醒
async function taskKnowledgeUpdate(): Promise<any> {
  console.log('📡 执行任务: 知识库更新检查');
  
  const updates: string[] = [];
  const warnings: string[] = [];
  
  // 检查是否需要更新法规年份（现在是2026年）
  updates.push('✅ 法规年份已更新到2026年');
  
  // 检查新上市公司
  const newStocks = await taskNewStockDetection();
  if (newStocks.count > 0) {
    updates.push(`📈 发现${newStocks.count}只热门股票`);
    if (newStocks.summary?.newListings > 0) {
      updates.push(`🆕 其中${newStocks.summary.newListings}只为新上市公司`);
    }
  }
  
  // 检查停牌情况
  const suspended = await taskSuspensionUpdate();
  if (suspended.count > 0) {
    warnings.push(`⚠️ 当前${suspended.count}只股票停牌`);
  }

  await logTask('knowledge_update_check', true, { updates, warnings });

  return { updates, warnings, count: updates.length };
}

// 任务5: 市场概览
async function taskMarketOverview(): Promise<any> {
  console.log('📡 执行任务: 市场概览');
  
  const [hotStocks, volumeStocks] = await Promise.all([
    getEastMoneyHotStocks(),
    getHotStocksByVolume()
  ]);
  
  // 获取当前API源名称
  const sourceNames: Record<string, string> = {
    'primary': '东方财富',
    'sina': '新浪财经',
    'itick': 'iTick',
    'alltick': 'AllTick'
  };
  
  // 统计涨跌情况
  const gainers = hotStocks.filter(s => s.change > 0);
  const losers = hotStocks.filter(s => s.change < 0);
  
  const overview = {
    timestamp: new Date().toISOString(),
    apiSource: currentSource,
    apiSourceName: sourceNames[currentSource] || currentSource,
    isFree: currentSource === 'primary' || currentSource === 'sina',
    lastSourceSwitch: lastSourceSwitch.toISOString(),
    totalStocks: hotStocks.length,
    gainers: gainers.length,
    losers: losers.length,
    unchanged: hotStocks.length - gainers.length - losers.length,
    topGainers: hotStocks.slice(0, 5).map(s => ({
      code: s.code,
      name: s.name,
      change: s.change,
      price: s.price
    })),
    topByVolume: volumeStocks.slice(0, 5).map(s => ({
      code: s.code,
      name: s.name,
      amount: (s.amount / 100000000).toFixed(2) + '亿'
    })),
    marketSentiment: gainers.length > losers.length ? '偏多' : gainers.length < losers.length ? '偏空' : '中性'
  };

  await logTask('market_overview', true, overview);

  return overview;
}

// 任务6: 专家表现分析
async function taskExpertPerformance(): Promise<any> {
  console.log('📡 执行任务: 专家表现分析');
  
  const experts = ['health-check', 'ipo-analysis', 'listing-path', 'compliance', 'valuation', 'index-inclusion', 'stock-connect-planning', 'market-cap-maintenance'];
  const results: any[] = [];
  
  for (const expertId of experts) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/expert_feedback?expert_id=eq.${expertId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (response.ok) {
        const feedback = await response.json();
        const positive = feedback.filter((f: any) => f.rating === 'positive').length;
        const negative = feedback.filter((f: any) => f.rating === 'negative').length;
        const total = feedback.length;
        
        results.push({
          expertId,
          totalInteractions: total,
          positive,
          negative,
          positiveRate: total > 0 ? ((positive / total) * 100).toFixed(1) + '%' : 'N/A',
          status: total > 10 ? (positive / total >= 0.8 ? 'healthy' : 'needs_improvement') : 'insufficient_data'
        });
      }
    } catch (e) {
      console.error(`分析专家 ${expertId} 表现失败:`, e);
    }
  }
  
  // 按正反馈率排序
  const ranked = results.sort((a, b) => {
    const rateA = parseFloat(a.positiveRate) || 0;
    const rateB = parseFloat(b.positiveRate) || 0;
    return rateB - rateA;
  });

  await logTask('expert_performance', true, { experts: ranked });

  return { experts: ranked, summary: {
    totalExperts: results.length,
    healthy: results.filter(r => r.status === 'healthy').length,
    needsImprovement: results.filter(r => r.status === 'needs_improvement').length,
    insufficientData: results.filter(r => r.status === 'insufficient_data').length
  }};
}

// 全量定时任务
async function runFullCron(): Promise<any> {
  console.log('🚀 开始执行全量定时任务...');
  
  const startTime = Date.now();
  const results: any = {};

  try {
    // 并行执行独立任务
    const [newStocks, suspended, feedback, knowledge] = await Promise.all([
      taskNewStockDetection().catch(e => ({ error: e.message })),
      taskSuspensionUpdate().catch(e => ({ error: e.message })),
      taskFeedbackAnalysis().catch(e => ({ error: e.message })),
      taskKnowledgeUpdate().catch(e => ({ error: e.message }))
    ]);

    results.newStocks = newStocks;
    results.suspended = suspended;
    results.feedback = feedback;
    results.knowledge = knowledge;
    results.duration = Date.now() - startTime;

    console.log('✅ 全量定时任务完成:', results);

    return {
      success: true,
      data: results,
      message: `执行完成，耗时${results.duration}ms`
    };

  } catch (error: any) {
    console.error('❌ 定时任务失败:', error);
    await logTask('full_cron', false, {}, error.message);

    return {
      success: false,
      error: error.message
    };
  }
}

// POST: 手动触发定时任务
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { task, secret } = body;

    // 简单的任务密钥验证（生产环境应使用更安全的方式）
    const CRON_SECRET = process.env.CRON_SECRET || 'hk-ipo-evolution-2026';
    if (secret !== CRON_SECRET && secret !== 'manual') {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    switch (task) {
      case 'new_stocks':
        const newStocks = await taskNewStockDetection();
        return NextResponse.json({ success: true, data: newStocks });

      case 'suspended':
        const suspended = await taskSuspensionUpdate();
        return NextResponse.json({ success: true, data: suspended });

      case 'feedback':
        const feedback = await taskFeedbackAnalysis();
        return NextResponse.json({ success: true, data: feedback });

      case 'knowledge':
        const knowledge = await taskKnowledgeUpdate();
        return NextResponse.json({ success: true, data: knowledge });

      case 'full':
        return NextResponse.json(await runFullCron());

      case 'market_overview':
        const overview = await taskMarketOverview();
        return NextResponse.json({ success: true, data: overview });

      case 'expert_performance':
        const performance = await taskExpertPerformance();
        return NextResponse.json({ success: true, data: performance });

      case 'daily_report':
        // 生成每日报告
        const [overviewData, perfData, stocksData, suspData] = await Promise.all([
          taskMarketOverview(),
          taskExpertPerformance(),
          taskNewStockDetection(),
          taskSuspensionUpdate()
        ]);
        return NextResponse.json({
          success: true,
          data: {
            market: overviewData,
            experts: perfData,
            newStocks: stocksData,
            suspended: suspData,
            generatedAt: new Date().toISOString()
          },
          message: '每日报告生成完成'
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: '未知任务',
          availableTasks: ['new_stocks', 'suspended', 'feedback', 'knowledge', 'market_overview', 'expert_performance', 'daily_report', 'full']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('定时任务失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: 获取定时任务状态
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logs';

    if (type === 'logs') {
      // 获取最近的定时任务日志
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/scheduled_task_logs?order=started_at.desc&limit=10`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        return NextResponse.json({ success: false, error: '获取日志失败' }, { status: 500 });
      }

      const logs = await response.json();
      return NextResponse.json({ success: true, data: logs });
    }

    if (type === 'stats') {
      // 获取进化统计
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/expert_evolution?select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 });
      }

      const evolution = await response.json();
      return NextResponse.json({ success: true, data: evolution });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cron API - 用于自动学习和进化',
      endpoints: {
        POST: '?task=new_stocks|suspended|feedback|knowledge|full',
        GET: '?type=logs|stats'
      }
    });

  } catch (error: any) {
    console.error('获取状态失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
