import { NextRequest, NextResponse } from 'next/server';

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2x4cGxqZmlkbGFhdWZlYWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTgzODIsImV4cCI6MjA4OTEzNDM4Mn0.o7q4YR8W67I__eDbTIu-OIDn18PqTgez3S1fMF7dFyo';

interface Question {
  id?: string;
  expert_id: string;
  expert_name: string;
  company_name: string;      // 公司名称
  project_content: string;  // 项目内容
  question: string;
  answer: string;
  created_at?: string;
  date?: string;
  week?: string;
  month?: string;
}

// 获取本周编号
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}

// Supabase API调用
async function supabaseRequest(endpoint: string, method: string = 'GET', body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
  return response;
}

// GET: 获取问题列表和统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const expertId = searchParams.get('expertId') || '';
    const companyName = searchParams.get('companyName') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    // 构建查询
    let query = 'questions?order=created_at.desc';
    if (limit) query += `&limit=${limit}`;
    
    const response = await supabaseRequest(query);
    let questions: Question[] = await response.json();

    // 过滤
    if (startDate) {
      questions = questions.filter(q => q.date >= startDate);
    }
    if (expertId) {
      questions = questions.filter(q => q.expert_id === expertId);
    }
    if (companyName) {
      questions = questions.filter(q => q.company_name?.includes(companyName));
    }

    // 统计
    const stats = {
      total: questions.length,
      byExpert: {} as Record<string, number>,
      byCompany: {} as Record<string, number>,
      byProject: {} as Record<string, number>,
      byWeek: {} as Record<string, number>,
      byDate: {} as Record<string, number>,
      topCompanies: [] as { name: string; count: number }[],
      topProjects: [] as { name: string; count: number }[],
    };

    questions.forEach(q => {
      stats.byExpert[q.expert_id] = (stats.byExpert[q.expert_id] || 0) + 1;
      stats.byWeek[q.week || ''] = (stats.byWeek[q.week || ''] || 0) + 1;
      stats.byDate[q.date || ''] = (stats.byDate[q.date || ''] || 0) + 1;
      
      // 统计公司
      if (q.company_name) {
        stats.byCompany[q.company_name] = (stats.byCompany[q.company_name] || 0) + 1;
      }
      // 统计项目
      if (q.project_content) {
        stats.byProject[q.project_content] = (stats.byProject[q.project_content] || 0) + 1;
      }
    });

    // 获取Top公司
    stats.topCompanies = Object.entries(stats.byCompany)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // 获取Top项目
    stats.topProjects = Object.entries(stats.byProject)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      expertId, 
      expertName, 
      companyName,    // 公司名称
      projectContent, // 项目内容
      question, 
      answer, 
      userId, 
      userEmail, 
      userName, 
      sessionId 
    } = body;

    if (!expertId || !question) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const now = new Date();
    const newQuestion = {
      expert_id: expertId,
      expert_name: expertName || '',
      company_name: companyName || '',      // 公司名称
      project_content: projectContent || '', // 项目内容
      question: question.substring(0, 2000),
      answer: answer ? answer.substring(0, 5000) : '',
      user_id: userId || null,
      user_email: userEmail || null,
      user_name: userName || null,
      session_id: sessionId || null,
      created_at: now.toISOString(),
      date: now.toISOString().split('T')[0],
      week: getWeekNumber(now),
      month: now.toISOString().slice(0, 7),
    };

    const response = await supabaseRequest('questions', 'POST', newQuestion);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Supabase保存失败:', error);
      return NextResponse.json({
        success: false,
        error: '保存失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: `q_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('记录问题失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
