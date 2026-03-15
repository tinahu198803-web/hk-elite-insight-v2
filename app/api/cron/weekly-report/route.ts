import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// 用户问题记录存储路径
const DATA_DIR = join(process.cwd(), 'data');
const QUESTIONS_FILE = join(DATA_DIR, 'user-questions.json');
const REPORTS_DIR = join(DATA_DIR, 'reports');

// 管理员配置的接收邮箱（生产环境建议使用环境变量）
const ADMIN_EMAIL = process.env.ADMIN_REPORT_EMAIL || 'admin@example.com';

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

// 获取上周的周数
function getLastWeekNumber(): string {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return getWeekNumber(now);
}

// 生成周报
function generateWeeklyReport(questions: any[], week: string) {
  const weekQuestions = questions.filter(q => q.week === week);
  
  if (weekQuestions.length === 0) {
    return null;
  }
  
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

  // 热门问题
  const questionFrequency: Record<string, number> = {};
  weekQuestions.forEach(q => {
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
    
    overview: {
      totalQuestions: weekQuestions.length,
      uniqueUsers,
      expertCount: Object.keys(byExpert).length,
      avgQuestionsPerDay: (weekQuestions.length / 7).toFixed(1),
    },
    
    byExpert: Object.entries(byExpert).map(([expertId, qs]) => ({
      expertId,
      expertName: qs[0].expertName || expertId,
      questionCount: qs.length,
      percentage: ((qs.length / weekQuestions.length) * 100).toFixed(1),
    })),
    
    byDate: Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    
    topQuestions,
    
    users: {
      total: uniqueUsers,
      emails: userEmails.slice(0, 20),
    },
  };
}

// 定时任务：每周一生成上周报告
export async function GET(request: NextRequest) {
  try {
    // 验证Cron密钥（Vercel会自动添加CRON_KEY环境变量）
    const authHeader = request.headers.get('authorization');
    const cronKey = process.env.CRON_KEY;
    
    // 如果配置了密钥，需要验证
    if (cronKey && authHeader !== `Bearer ${cronKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    ensureDirs();
    const questions = readQuestions();
    
    if (questions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '暂无数据，跳过报告生成',
        week: getLastWeekNumber()
      });
    }
    
    // 生成上周报告
    const lastWeek = getLastWeekNumber();
    const report = generateWeeklyReport(questions, lastWeek);
    
    if (!report) {
      return NextResponse.json({
        success: true,
        message: '上周无问题数据',
        week: lastWeek
      });
    }
    
    // 保存报告
    const reportFile = join(REPORTS_DIR, `${lastWeek}.json`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // TODO: 发送邮件通知（需要配置SMTP）
    // await sendEmail(ADMIN_EMAIL, `周报 ${lastWeek}`, report);
    
    console.log(`周报生成成功: ${lastWeek}, 问题数: ${report.overview.totalQuestions}`);
    
    return NextResponse.json({
      success: true,
      message: '周报生成成功',
      week: lastWeek,
      overview: report.overview,
    });
  } catch (error: any) {
    console.error('生成周报失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
