import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

// 用户问题记录存储路径
const DATA_DIR = join(process.cwd(), 'data');
const QUESTIONS_FILE = join(DATA_DIR, 'user-questions.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 读取现有问题
function readQuestions() {
  ensureDataDir();
  if (!existsSync(QUESTIONS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(QUESTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 保存问题
function saveQuestions(questions: any[]) {
  ensureDataDir();
  writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
}

// 记录用户问题
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      userName,
      expertId, 
      expertName, 
      question, 
      answer,
      sessionId 
    } = body;

    // 验证必填字段
    if (!expertId || !question) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 读取现有问题
    const questions = readQuestions();

    // 添加新问题
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || 'anonymous',
      userEmail: userEmail || '',
      userName: userName || '',
      expertId,
      expertName: expertName || '',
      question: question.substring(0, 2000), // 限制问题长度
      answer: answer ? answer.substring(0, 5000) : '', // 限制答案长度
      sessionId: sessionId || '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      week: getWeekNumber(new Date()),
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
    };

    questions.push(newQuestion);
    saveQuestions(questions);

    return NextResponse.json({
      success: true,
      questionId: newQuestion.id
    });
  } catch (error: any) {
    console.error('记录问题失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 获取问题列表（支持筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const week = searchParams.get('week');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let questions = readQuestions();

    // 筛选
    if (expertId) {
      questions = questions.filter(q => q.expertId === expertId);
    }
    if (startDate) {
      questions = questions.filter(q => q.date >= startDate);
    }
    if (endDate) {
      questions = questions.filter(q => q.date <= endDate);
    }
    if (week) {
      questions = questions.filter(q => q.week === week);
    }

    // 排序（最新在前）
    questions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 分页
    const total = questions.length;
    const paginatedQuestions = questions.slice(offset, offset + limit);

    // 统计信息
    const stats = {
      total,
      byExpert: getStatsByExpert(questions),
      byWeek: getStatsByWeek(questions),
      byDate: getStatsByDate(questions),
    };

    return NextResponse.json({
      success: true,
      questions: paginatedQuestions,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    console.error('获取问题失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 获取周数
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}

// 按专家统计
function getStatsByExpert(questions: any[]) {
  const stats: Record<string, number> = {};
  questions.forEach(q => {
    stats[q.expertId] = (stats[q.expertId] || 0) + 1;
  });
  return stats;
}

// 按周统计
function getStatsByWeek(questions: any[]) {
  const stats: Record<string, number> = {};
  questions.forEach(q => {
    stats[q.week] = (stats[q.week] || 0) + 1;
  });
  return stats;
}

// 按日期统计
function getStatsByDate(questions: any[]) {
  const stats: Record<string, number> = {};
  questions.forEach(q => {
    stats[q.date] = (stats[q.date] || 0) + 1;
  });
  return stats;
}
