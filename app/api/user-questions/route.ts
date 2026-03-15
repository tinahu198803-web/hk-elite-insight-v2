import { NextResponse } from 'next/server';

// GitHub Gist配置 - 用于持久化存储用户问题
// 请在环境变量中设置: GITHUB_TOKEN (需要gist权限)
// 或者使用免费的JSONBin.io / JSONPlaceholder
const GITHUB_API = 'https://api.github.com';
const GIST_ID = process.env.QUESTIONS_GIST_ID || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// 使用简单的内存缓存（Vercel Serverless会冷启动，但同一实例内可缓存）
let cachedData: any = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1分钟缓存

interface Question {
  id: string;
  expertId: string;
  expertName: string;
  question: string;
  answer: string;
  timestamp: string;
  date: string;
  week: string;
  month: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

// 从Gist获取数据
async function fetchFromGist(): Promise<Question[]> {
  if (!GITHUB_TOKEN || !GIST_ID) {
    console.log('未配置GitHub Gist，使用内存存储');
    return cachedData || [];
  }

  try {
    const response = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error('Gist获取失败:', response.status);
      return cachedData || [];
    }

    const data = await response.json();
    const content = data.files['user-questions.json']?.content;
    
    if (content) {
      cachedData = JSON.parse(content);
      lastFetch = Date.now();
      return cachedData;
    }
  } catch (error) {
    console.error('获取Gist数据失败:', error);
  }

  return cachedData || [];
}

// 保存到Gist
async function saveToGist(questions: Question[]): Promise<boolean> {
  if (!GITHUB_TOKEN || !GIST_ID) {
    console.log('未配置GitHub Gist，仅保存在内存');
    cachedData = questions;
    return true;
  }

  try {
    const response = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: '用户咨询问题数据',
        files: {
          'user-questions.json': {
            content: JSON.stringify(questions, null, 2),
          },
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('保存到Gist失败:', error);
    return false;
  }
}

// 获取本周编号
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}

// GET: 获取问题列表和统计
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const expertId = searchParams.get('expertId') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    // 获取所有问题
    let questions = await fetchFromGist();

    // 过滤
    if (startDate) {
      questions = questions.filter(q => q.date >= startDate);
    }
    if (expertId) {
      questions = questions.filter(q => q.expertId === expertId);
    }

    // 限制数量
    questions = questions.slice(-limit);

    // 统计
    const stats = {
      total: questions.length,
      byExpert: {} as Record<string, number>,
      byWeek: {} as Record<string, number>,
      byDate: {} as Record<string, number>,
    };

    questions.forEach(q => {
      stats.byExpert[q.expertId] = (stats.byExpert[q.expertId] || 0) + 1;
      stats.byWeek[q.week] = (stats.byWeek[q.week] || 0) + 1;
      stats.byDate[q.date] = (stats.byDate[q.date] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      questions,
      stats,
    });
  } catch (error: any) {
    console.error('获取问题失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// POST: 记录新问题
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, expertName, question, answer, userId, userEmail, userName, sessionId } = body;

    if (!expertId || !question) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    // 获取现有问题
    const questions = await fetchFromGist();

    // 添加新问题
    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expertId,
      expertName: expertName || '',
      question: question.substring(0, 2000),
      answer: answer ? answer.substring(0, 5000) : '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      week: getWeekNumber(new Date()),
      month: new Date().toISOString().slice(0, 7),
    };

    if (userId) newQuestion.userId = userId;
    if (userEmail) newQuestion.userEmail = userEmail;
    if (userName) newQuestion.userName = userName;
    if (sessionId) (newQuestion as any).sessionId = sessionId;

    questions.push(newQuestion);

    // 保存
    await saveToGist(questions);

    return NextResponse.json({
      success: true,
      id: newQuestion.id,
    });
  } catch (error: any) {
    console.error('记录问题失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
