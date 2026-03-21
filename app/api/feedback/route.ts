import { NextResponse } from 'next/server';

// 用户反馈类型
type Feedback = {
  id?: string;
  messageId: string;
  expertId: string;
  expertName: string;
  rating: 'helpful' | 'not_helpful' | 'accurate' | 'inaccurate';
  comment?: string;
  stockCode?: string;
  question?: string;
  timestamp?: string;
};

// 存储反馈数据（生产环境应存储到数据库）
const feedbackStore: Map<string, Feedback> = new Map();

// 反馈统计
const feedbackStats = {
  totalFeedback: 0,
  helpful: 0,
  notHelpful: 0,
  accurate: 0,
  inaccurate: 0,
  byExpert: {} as Record<string, { helpful: number; notHelpful: number; accurate: number; inaccurate: number }>,
  byStock: {} as Record<string, { helpful: number; notHelpful: number }>,
  recentTrends: [] as { date: string; helpful: number; notHelpful: number }[],
};

// 添加反馈
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId, expertId, expertName, rating, comment, stockCode, question } = body;

    // 验证必填字段
    if (!messageId || !expertId || !rating) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段'
      }, { status: 400 });
    }

    // 验证评分类型
    const validRatings = ['helpful', 'not_helpful', 'accurate', 'inaccurate'];
    if (!validRatings.includes(rating)) {
      return NextResponse.json({
        success: false,
        error: '无效的评分类型'
      }, { status: 400 });
    }

    // 创建反馈记录
    const feedback: Feedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      expertId,
      expertName,
      rating,
      comment,
      stockCode,
      question,
      timestamp: new Date().toISOString()
    };

    // 存储反馈
    feedbackStore.set(feedback.id!, feedback);

    // 更新统计
    updateStats(feedback);

    console.log('✅ 用户反馈已记录:', feedback);

    return NextResponse.json({
      success: true,
      message: '反馈已提交，感谢您的反馈！',
      feedbackId: feedback.id
    });

  } catch (error: any) {
    console.error('❌ 记录反馈失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 获取反馈统计
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const expertId = searchParams.get('expertId');

    if (type === 'summary') {
      // 返回总体统计
      return NextResponse.json({
        success: true,
        data: {
          totalFeedback: feedbackStats.totalFeedback,
          helpfulRate: feedbackStats.totalFeedback > 0 
            ? ((feedbackStats.helpful / feedbackStats.totalFeedback) * 100).toFixed(1) + '%' 
            : '0%',
          accurateRate: feedbackStats.totalFeedback > 0 
            ? ((feedbackStats.accurate / feedbackStats.totalFeedback) * 100).toFixed(1) + '%' 
            : '0%',
          byExpert: feedbackStats.byExpert,
          recentTrends: feedbackStats.recentTrends.slice(-7), // 最近7天
        }
      });
    }

    if (type === 'detailed' && expertId) {
      // 返回特定专家的详细反馈
      const expertFeedback = Array.from(feedbackStore.values())
        .filter(f => f.expertId === expertId)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
        .slice(0, 50);

      return NextResponse.json({
        success: true,
        data: expertFeedback
      });
    }

    if (type === 'problems') {
      // 返回问题分析（用户反馈不准确的问题）
      const problemFeedback = Array.from(feedbackStore.values())
        .filter(f => f.rating === 'inaccurate' || f.rating === 'not_helpful')
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
        .slice(0, 20);

      return NextResponse.json({
        success: true,
        data: {
          problems: problemFeedback,
          commonIssues: analyzeCommonIssues(problemFeedback)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: feedbackStats
    });

  } catch (error: any) {
    console.error('❌ 获取反馈统计失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 更新统计
function updateStats(feedback: Feedback) {
  feedbackStats.totalFeedback++;

  // 按评分类型统计
  switch (feedback.rating) {
    case 'helpful':
      feedbackStats.helpful++;
      break;
    case 'not_helpful':
      feedbackStats.notHelpful++;
      break;
    case 'accurate':
      feedbackStats.accurate++;
      break;
    case 'inaccurate':
      feedbackStats.inaccurate++;
      break;
  }

  // 按专家统计
  if (!feedbackStats.byExpert[feedback.expertId]) {
    feedbackStats.byExpert[feedback.expertId] = {
      helpful: 0,
      notHelpful: 0,
      accurate: 0,
      inaccurate: 0
    };
  }
  if (feedback.rating === 'helpful') feedbackStats.byExpert[feedback.expertId].helpful++;
  if (feedback.rating === 'not_helpful') feedbackStats.byExpert[feedback.expertId].notHelpful++;
  if (feedback.rating === 'accurate') feedbackStats.byExpert[feedback.expertId].accurate++;
  if (feedback.rating === 'inaccurate') feedbackStats.byExpert[feedback.expertId].inaccurate++;

  // 按股票统计
  if (feedback.stockCode) {
    if (!feedbackStats.byStock[feedback.stockCode]) {
      feedbackStats.byStock[feedback.stockCode] = { helpful: 0, notHelpful: 0 };
    }
    if (feedback.rating === 'helpful' || feedback.rating === 'accurate') {
      feedbackStats.byStock[feedback.stockCode].helpful++;
    }
    if (feedback.rating === 'not_helpful' || feedback.rating === 'inaccurate') {
      feedbackStats.byStock[feedback.stockCode].notHelpful++;
    }
  }

  // 更新趋势
  const today = new Date().toISOString().split('T')[0];
  const trendIndex = feedbackStats.recentTrends.findIndex(t => t.date === today);
  
  if (trendIndex >= 0) {
    if (feedback.rating === 'helpful' || feedback.rating === 'accurate') {
      feedbackStats.recentTrends[trendIndex].helpful++;
    }
    if (feedback.rating === 'not_helpful' || feedback.rating === 'inaccurate') {
      feedbackStats.recentTrends[trendIndex].notHelpful++;
    }
  } else {
    feedbackStats.recentTrends.push({
      date: today,
      helpful: feedback.rating === 'helpful' || feedback.rating === 'accurate' ? 1 : 0,
      notHelpful: feedback.rating === 'not_helpful' || feedback.rating === 'inaccurate' ? 1 : 0
    });
    // 只保留最近30天
    if (feedbackStats.recentTrends.length > 30) {
      feedbackStats.recentTrends.shift();
    }
  }
}

// 分析常见问题
function analyzeCommonIssues(problems: Feedback[]) {
  const issues = {
    wrongStockName: [] as string[],
    wrongPrice: [] as string[],
    wrongMarketCap: [] as string[],
    wrongConnectStatus: [] as string[],
    hallucination: [] as string[],
  };

  for (const problem of problems) {
    if (problem.comment) {
      const comment = problem.comment.toLowerCase();
      if (comment.includes('名字') || comment.includes('名称')) {
        issues.wrongStockName.push(problem.stockCode || '未知');
      }
      if (comment.includes('价格') || comment.includes('股价')) {
        issues.wrongPrice.push(problem.stockCode || '未知');
      }
      if (comment.includes('市值')) {
        issues.wrongMarketCap.push(problem.stockCode || '未知');
      }
      if (comment.includes('港股通') || comment.includes('入通')) {
        issues.wrongConnectStatus.push(problem.stockCode || '未知');
      }
      if (comment.includes('编造') || comment.includes('胡编') || comment.includes('幻觉')) {
        issues.hallucination.push(problem.stockCode || '未知');
      }
    }
  }

  return {
    wrongStockName: [...new Set(issues.wrongStockName)],
    wrongPrice: [...new Set(issues.wrongPrice)],
    wrongMarketCap: [...new Set(issues.wrongMarketCap)],
    wrongConnectStatus: [...new Set(issues.wrongConnectStatus)],
    hallucination: [...new Set(issues.hallucination)],
  };
}
