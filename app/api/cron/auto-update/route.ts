import { NextResponse } from 'next/server';

// Vercel Cron 配置
export const runtime = 'edge';

// 定时任务：每天早上8点自动更新股票数据库
export async function GET(request: Request) {
  try {
    // 验证请求来源（Vercel Cron会发送特定的header）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 开发环境跳过验证
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('⏰ 定时任务触发：自动更新股票数据库');
    console.log('📅 触发时间:', new Date().toISOString());

    // 导入并执行数据更新逻辑
    const { updateStockDatabase } = await import('../crawl/stock-data/updateLogic');
    const result = await updateStockDatabase();

    return NextResponse.json({
      success: true,
      message: '定时更新完成',
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error: any) {
    console.error('❌ 定时更新失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
