/**
 * 股票学习管理API
 * 用于查看和管理自动学习的股票代码
 */

import { NextResponse } from 'next/server';
import { stockLearner } from '../../lib/stock-learner';

// GET - 获取学习统计和未验证的股票
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';
  
  try {
    if (action === 'stats') {
      // 获取学习统计
      const stats = await stockLearner.getLearningStats();
      const unverified = await stockLearner.getUnverifiedStocks();
      
      return NextResponse.json({
        success: true,
        stats,
        unverified,
        message: '统计获取成功'
      });
    }
    
    if (action === 'verified') {
      // 获取已验证的股票
      const stocks = await stockLearner.getVerifiedStocks();
      return NextResponse.json({
        success: true,
        stocks,
        count: stocks.length
      });
    }
    
    if (action === 'all') {
      // 获取所有股票
      const { supabaseAdmin } = await import('../../lib/supabase');
      const { data } = await supabaseAdmin
        .from('stock_codes')
        .select('*')
        .order('query_count', { ascending: false });
      
      return NextResponse.json({
        success: true,
        stocks: data || [],
        count: data?.length || 0
      });
    }
    
    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    
  } catch (e: any) {
    console.error('管理API错误:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST - 添加/验证股票
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, code, name, name_en, industry } = body;
    
    if (action === 'verify') {
      // 验证股票
      const success = await stockLearner.verifyStock(code);
      return NextResponse.json({ success, message: success ? '验证成功' : '验证失败' });
    }
    
    if (action === 'add') {
      // 手动添加股票
      const success = await stockLearner.learnStock(code, name, name_en || '', industry || '', 'manual');
      if (success) {
        await stockLearner.verifyStock(code); // 手动添加直接验证
      }
      return NextResponse.json({ success, message: success ? '添加成功' : '添加失败' });
    }
    
    if (action === 'delete') {
      // 删除学习记录
      const success = await stockLearner.deleteLearned(code);
      return NextResponse.json({ success, message: success ? '删除成功' : '删除失败' });
    }
    
    if (action === 'batch-verify') {
      // 批量验证
      const { codes } = body;
      let verified = 0;
      for (const c of codes) {
        if (await stockLearner.verifyStock(c)) verified++;
      }
      return NextResponse.json({ success: true, verified, total: codes.length });
    }
    
    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    
  } catch (e: any) {
    console.error('POST错误:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
