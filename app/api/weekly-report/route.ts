import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// 用户问题记录存储路径
const DATA_DIR = join(process.cwd(), 'data');
const QUESTIONS_FILE = join(DATA_DIR, 'user-questions.json');
const REPORTS_DIR = join(DATA_DIR, 'reports');

// 确保目录存在
function ensureDirs() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

// 读取现有问题
function readQuestions() {
  ensureDirs();
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

// 获取周数
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}

// 获取本周的周一和周日
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    week: getWeekNumber(now)
  };
}

// 生成周报
function generateWeeklyReport(questions: any[], week: string) {
  // 筛选本周问题
  const weekQuestions = questions.filter(q => q.week === week);
  
  // 按专家分组
  const byExpert: Record<string, any[]> = {};
  weekQuestions.forEach(q => {
    if (!byExpert[q.expertId]) {
      byExpert[q.expertId] = [];
    }
    byExpert[q.expertId].push(q);
  });

  // 按日期分组
  const byDate: Record<string, number> = {};
  weekQuestions.forEach(q => {
    byDate[q.date] = (byDate[q.date] || 0) + 1;
  });

  // 热门问题（按出现频率）
  const questionFrequency: Record<string, number> = {};
  weekQuestions.forEach(q => {
    // 提取问题关键词（前50个字符作为简化标识）
    const key = q.question.substring(0, 50).replace(/\n/g, ' ');
    questionFrequency[key] = (questionFrequency[key] || 0) + 1;
  });
  
  const topQuestions = Object.entries(questionFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([question, count]) => ({ question, count }));

  // 用户分析
  const uniqueUsers = new Set(weekQuestions.map(q => q.userId)).size;
  const userEmails = weekQuestions
    .filter(q => q.userEmail)
    .map(q => q.userEmail)
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    reportId: `report_${week}_${Date.now()}`,
    week,
    generatedAt: new Date().toISOString(),
    period: getCurrentWeekRange(),
    
    // 概览统计
    overview: {
      totalQuestions: weekQuestions.length,
      uniqueUsers,
      expertCount: Object.keys(byExpert).length,
      avgQuestionsPerDay: weekQuestions.length / 7,
    },
    
    // 按专家统计
    byExpert: Object.entries(byExpert).map(([expertId, qs]) => ({
      expertId,
      expertName: qs[0].expertName || expertId,
      questionCount: qs.length,
      percentage: ((qs.length / weekQuestions.length) * 100).toFixed(1),
      sampleQuestions: qs.slice(0, 3).map(q => q.question.substring(0, 100)),
    })),
    
    // 按日期统计
    byDate: Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    
    // 热门问题
    topQuestions,
    
    // 用户信息
    users: {
      total: uniqueUsers,
      emails: userEmails.slice(0, 20), // 最多20个
      newUsers: uniqueUsers, // 简化计算
    },
    
    // 详细问题列表
    details: weekQuestions.map(q => ({
      id: q.id,
      timestamp: q.timestamp,
      expertName: q.expertName,
      question: q.question.substring(0, 200),
      userId: q.userId,
      userName: q.userName,
      userEmail: q.userEmail,
    })),
  };
}

// 生成报告（手动或定时任务）
export async function POST(request: NextRequest) {
  try {
    ensureDirs();
    const body = await request.json();
    const { week } = body;
    
    const targetWeek = week || getWeekNumber(new Date());
    const questions = readQuestions();
    
    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: '暂无数据'
      });
    }
    
    const report = generateWeeklyReport(questions, targetWeek);
    
    // 保存报告
    const reportFile = join(REPORTS_DIR, `${targetWeek}.json`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('生成报告失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 获取报告列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    
    ensureDirs();
    
    if (week) {
      // 获取特定周的报告
      const reportFile = join(REPORTS_DIR, `${week}.json`);
      if (!existsSync(reportFile)) {
        return NextResponse.json({
          success: false,
          error: '报告不存在'
        });
      }
      const report = JSON.parse(readFileSync(reportFile, 'utf-8'));
      return NextResponse.json({ success: true, report });
    }
    
    // 获取所有报告
    const questions = readQuestions();
    const weeks = [...new Set(questions.map(q => q.week))].sort().reverse();
    
    const reports = weeks.map(w => {
      const weekQuestions = questions.filter(q => q.week === w);
      return {
        week: w,
        questionCount: weekQuestions.length,
        uniqueUsers: new Set(weekQuestions.map(q => q.userId)).size,
      };
    });
    
    return NextResponse.json({
      success: true,
      reports
    });
  } catch (error: any) {
    console.error('获取报告失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
