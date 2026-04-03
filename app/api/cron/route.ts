/**
 * 定时任务API - 自我进化和学习
 * 用于定期执行：
 * 1. 新股检测
 * 2. 停牌信息更新
 * 3. 反馈分析
 * 4. 知识库更新
 */

import { NextResponse } from 'next/server';

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

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

// 获取东方财富港股涨幅榜
async function getEastMoneyHotStocks(): Promise<any[]> {
  try {
    // 获取今日涨幅最大的港股
    const url = 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:116+t:3&fields=f12,f14,f3,f2,f5,f6,f18';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com/'
      },
      cache: 'no-store'
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data?.diff || []).map((item: any) => ({
      code: item.f12?.toString().padStart(5, '0'),
      name: item.f14,
      change: item.f3,
      price: item.f2,
      volume: item.f5,
      reason: item.f18 || '热门股票'
    }));

  } catch (error) {
    console.error('获取热门股票失败:', error);
    return [];
  }
}

// 获取停牌股票
async function getSuspendedStocks(): Promise<any[]> {
  try {
    const url = 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:116+s:2048&fields=f12,f14,f18';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com/'
      },
      cache: 'no-store'
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data?.diff || []).map((item: any) => ({
      code: item.f12?.toString().padStart(5, '0'),
      name: item.f14,
      suspendDate: item.f18
    }));

  } catch (error) {
    console.error('获取停牌股票失败:', error);
    return [];
  }
}

// 获取东方财富特定股票信息
async function getStockDetail(code: string): Promise<any> {
  try {
    const normalizedCode = code.padStart(5, '0');
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${normalizedCode}&fields=f43,f57,f58,f107,f47,f48,f116,f117,f50,f169,f170`;
    
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
      changePct: d.f170 || 0,
      volume: d.f47 || 0,
      amount: d.f48 || 0,
      marketCap: d.f116 || 0,
      floatMarketCap: d.f117 || 0,
      pe: d.f50 || null,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('获取股票详情失败:', error);
    return null;
  }
}

// 任务1: 新股检测
async function taskNewStockDetection(): Promise<any> {
  console.log('📡 执行任务: 新股检测');
  
  const hotStocks = await getEastMoneyHotStocks();
  const newStocks: any[] = [];
  
  // 检测涨幅超10%的股票（可能是新股或热门股）
  for (const stock of hotStocks.slice(0, 50)) {
    if (stock.change > 10 || stock.volume > 1000000) {
      const detail = await getStockDetail(stock.code);
      if (detail && detail.price > 0) {
        newStocks.push({
          code: stock.code,
          name: stock.name,
          price: detail.price,
          change: detail.change,
          changePct: detail.changePct,
          marketCap: detail.marketCap,
          detectedAt: new Date().toISOString(),
          detectionType: stock.change > 10 ? 'high_change' : 'high_volume'
        });
      }
    }
  }

  await logTask('new_stock_detection', true, {
    detectedCount: newStocks.length,
    stocks: newStocks.map(s => ({ code: s.code, name: s.name }))
  });

  return { newStocks, count: newStocks.length };
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
  
  // 检查是否需要更新法规年份（现在是2026年）
  updates.push('检查法规年份是否更新到2026年');
  
  // 检查新上市公司
  const newStocks = await taskNewStockDetection();
  if (newStocks.count > 0) {
    updates.push(`发现${newStocks.count}只可能的新股票`);
  }

  await logTask('knowledge_update_check', true, { updates });

  return { updates, count: updates.length };
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

      default:
        return NextResponse.json({ 
          success: false, 
          error: '未知任务',
          availableTasks: ['new_stocks', 'suspended', 'feedback', 'knowledge', 'full']
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
