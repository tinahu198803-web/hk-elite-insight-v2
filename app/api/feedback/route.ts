import { NextResponse } from 'next/server';

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

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

// 添加反馈到Supabase
async function addFeedbackToDB(feedback: Feedback): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/expert_feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          expert_id: feedback.expertId,
          interaction_id: feedback.messageId,
          user_id: null,
          rating: feedback.rating === 'helpful' || feedback.rating === 'accurate' ? 'positive' : 'negative',
          feedback: feedback.comment,
          improvement_suggestion: null,
          question_context: feedback.question,
          response_context: null,
          stock_code: feedback.stockCode,
          created_at: feedback.timestamp || new Date().toISOString()
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Supabase写入失败:', error);
    return false;
  }
}

// 从Supabase获取反馈统计
async function getFeedbackStats(): Promise<any> {
  try {
    // 获取总反馈数
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/expert_feedback?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!countRes.ok) {
      return getLocalStats();
    }

    const data = await countRes.json();
    
    // 计算统计数据
    const totalFeedback = data.length || 0;
    const positive = data.filter((f: any) => f.rating === 'positive').length;
    const negative = data.filter((f: any) => f.rating === 'negative').length;
    const byExpert: Record<string, any> = {};

    for (const f of data) {
      if (!byExpert[f.expert_id]) {
        byExpert[f.expert_id] = { helpful: 0, notHelpful: 0, accurate: 0, inaccurate: 0 };
      }
      if (f.rating === 'positive') byExpert[f.expert_id].helpful++;
      if (f.rating === 'negative') byExpert[f.expert_id].notHelpful++;
    }

    return {
      totalFeedback,
      helpful: positive,
      notHelpful: negative,
      helpfulRate: totalFeedback > 0 ? ((positive / totalFeedback) * 100).toFixed(1) + '%' : '0%',
      byExpert
    };
  } catch (error) {
    console.error('获取Supabase数据失败:', error);
    return getLocalStats();
  }
}

// 获取本地统计（备用）
function getLocalStats() {
  return {
    totalFeedback: 0,
    helpful: 0,
    notHelpful: 0,
    helpfulRate: '0%',
    byExpert: {}
  };
}

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

    // 同时写入Supabase和本地（双重保险）
    const dbSuccess = await addFeedbackToDB(feedback);

    console.log('✅ 用户反馈已记录:', feedback, 'DB写入:', dbSuccess ? '成功' : '失败');

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
      const stats = await getFeedbackStats();
      
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    if (type === 'detailed' && expertId) {
      // 返回特定专家的详细反馈
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/expert_feedback?expert_id=eq.${expertId}&order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: '获取数据失败'
        }, { status: 500 });
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        data
      });
    }

    if (type === 'problems') {
      // 返回问题分析（用户反馈不准确的问题）
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/expert_feedback?rating=eq.negative&order=created_at.desc&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: '获取数据失败'
        }, { status: 500 });
      }

      const data = await response.json();
      const commonIssues = analyzeCommonIssues(data);

      return NextResponse.json({
        success: true,
        data: {
          problems: data,
          commonIssues
        }
      });
    }

    const stats = await getFeedbackStats();
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ 获取反馈统计失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 分析常见问题
function analyzeCommonIssues(problems: any[]) {
  const issues = {
    wrongStockName: [] as string[],
    wrongPrice: [] as string[],
    wrongMarketCap: [] as string[],
    wrongConnectStatus: [] as string[],
    hallucination: [] as string[],
  };

  for (const problem of problems) {
    if (problem.feedback) {
      const comment = problem.feedback.toLowerCase();
      if (comment.includes('名字') || comment.includes('名称')) {
        issues.wrongStockName.push(problem.stock_code || '未知');
      }
      if (comment.includes('价格') || comment.includes('股价')) {
        issues.wrongPrice.push(problem.stock_code || '未知');
      }
      if (comment.includes('市值')) {
        issues.wrongMarketCap.push(problem.stock_code || '未知');
      }
      if (comment.includes('港股通') || comment.includes('入通')) {
        issues.wrongConnectStatus.push(problem.stock_code || '未知');
      }
      if (comment.includes('编造') || comment.includes('胡编') || comment.includes('幻觉')) {
        issues.hallucination.push(problem.stock_code || '未知');
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
