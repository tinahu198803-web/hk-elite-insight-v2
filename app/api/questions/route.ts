// 用户咨询问题数据收集API
// 用于收集和整理用户咨询的主要内容问题

import { NextRequest, NextResponse } from 'next/server';

// 模拟数据库 - 实际项目中应使用真实数据库
const userQuestions: Array<{
  id: string;
  expertId: string;
  question: string;
  userId?: string;
  timestamp: string;
  category?: string;
}> = [];

// POST - 记录用户问题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expertId, question, userId, category } = body;
    
    if (!expertId || !question) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expertId,
      question: question.substring(0, 500), // 限制问题长度
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      category: category || extractCategory(question)
    };
    
    userQuestions.push(newQuestion);
    
    // 只保留最近1000条记录
    if (userQuestions.length > 1000) {
      userQuestions.splice(0, userQuestions.length - 1000);
    }
    
    return NextResponse.json({
      success: true,
      data: newQuestion
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - 获取问题统计
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expertId = searchParams.get('expertId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const groupBy = searchParams.get('groupBy'); // 'expert' | 'category'
  
  let filteredQuestions = [...userQuestions];
  
  // 按专家筛选
  if (expertId) {
    filteredQuestions = filteredQuestions.filter(q => q.expertId === expertId);
  }
  
  // 按时间倒序
  filteredQuestions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // 返回指定数量
  filteredQuestions = filteredQuestions.slice(0, limit);
  
  // 如果需要分组统计
  if (groupBy === 'expert') {
    const expertStats: Record<string, number> = {};
    userQuestions.forEach(q => {
      expertStats[q.expertId] = (expertStats[q.expertId] || 0) + 1;
    });
    return NextResponse.json({
      success: true,
      data: {
        stats: Object.entries(expertStats).map(([expert, count]) => ({ expert, count })),
        total: userQuestions.length
      }
    });
  }
  
  if (groupBy === 'category') {
    const categoryStats: Record<string, number> = {};
    userQuestions.forEach(q => {
      const cat = q.category || '未分类';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });
    return NextResponse.json({
      success: true,
      data: {
        stats: Object.entries(categoryStats).map(([category, count]) => ({ category, count })),
        total: userQuestions.length
      }
    });
  }
  
  return NextResponse.json({
    success: true,
    data: {
      questions: filteredQuestions,
      total: userQuestions.length
    }
  });
}

// 从问题中提取分类关键词
function extractCategory(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('港股通') || q.includes('入通')) return '港股通';
  if (q.includes('招股书') || q.includes('上市')) return 'IPO上市';
  if (q.includes('估值') || q.includes('市值')) return '估值定价';
  if (q.includes('合规') || q.includes('合规性')) return '合规审查';
  if (q.includes('msci') || q.includes('富时') || q.includes('指数')) return '指数纳入';
  if (q.includes('路径') || q.includes('上市地点')) return '上市路径';
  
  return '其他';
}
