import { NextResponse } from 'next/server';

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// 知识条目类型
type KnowledgeEntry = {
  id: string;
  type: 'case' | 'rule' | 'faq' | 'market_data' | 'success_story' | 'lesson';
  title: string;
  content: string;
  tags: string[];
  expertId?: string;
  source?: string;
  createdAt: string;
  usageCount: number;
  lastUsed?: string;
  insights?: string[];
};

// 进化分析结果类型
type EvolutionAnalysis = {
  expertId: string;
  learningCycle: number;
  issues: {
    category: string;
    count: number;
    examples: string[];
  }[];
  insights: string[];
  recommendations: string[];
  knowledgeGaps: string[];
};

// 获取专家反馈统计
async function getExpertFeedbackStats(expertId: string): Promise<any> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/expert_feedback?expert_id=eq.${expertId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('获取反馈失败:', error);
    return null;
  }
}

// 获取当前进化状态
async function getEvolutionState(expertId: string): Promise<any> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/expert_evolution?expert_id=eq.${expertId}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('获取进化状态失败:', error);
    return null;
  }
}

// 更新进化状态
async function updateEvolutionState(expertId: string, metrics: any): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/expert_evolution?expert_id=eq.${expertId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          learning_cycle: metrics.learningCycle,
          status: metrics.status,
          last_update: new Date().toISOString(),
          metrics: metrics.metrics
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('更新进化状态失败:', error);
    return false;
  }
}

// 添加学习案例
async function addLearnedCase(expertId: string, caseType: string, content: string, keywords: string[], insights: string[], source: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/expert_learned_cases`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          expert_id: expertId,
          case_type: caseType,
          content,
          keywords,
          insights,
          source
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('添加学习案例失败:', error);
    return false;
  }
}

// 分析问题模式
function analyzeIssuePatterns(feedback: any[]): EvolutionAnalysis['issues'] {
  const issues: EvolutionAnalysis['issues'] = [];
  
  const categories = {
    '股票名称错误': { count: 0, examples: [] as string[] },
    '价格数据错误': { count: 0, examples: [] as string[] },
    '市值数据错误': { count: 0, examples: [] as string[] },
    '港股通状态错误': { count: 0, examples: [] as string[] },
    '法规引用过时': { count: 0, examples: [] as string[] },
    'AI幻觉/编造': { count: 0, examples: [] as string[] },
    '分析建议不准确': { count: 0, examples: [] as string[] }
  };

  for (const f of feedback) {
    if (f.feedback) {
      const text = f.feedback.toLowerCase();
      const stock = f.stock_code || '通用问题';
      
      if (text.includes('名字') || text.includes('名称')) {
        categories['股票名称错误'].count++;
        if (!categories['股票名称错误'].examples.includes(stock)) {
          categories['股票名称错误'].examples.push(stock);
        }
      }
      if (text.includes('价格') || text.includes('股价')) {
        categories['价格数据错误'].count++;
        if (!categories['价格数据错误'].examples.includes(stock)) {
          categories['价格数据错误'].examples.push(stock);
        }
      }
      if (text.includes('市值')) {
        categories['市值数据错误'].count++;
        if (!categories['市值数据错误'].examples.includes(stock)) {
          categories['市值数据错误'].examples.push(stock);
        }
      }
      if (text.includes('港股通') || text.includes('入通')) {
        categories['港股通状态错误'].count++;
        if (!categories['港股通状态错误'].examples.includes(stock)) {
          categories['港股通状态错误'].examples.push(stock);
        }
      }
      if (text.includes('过时') || text.includes('旧') || text.includes('2024') || text.includes('2025')) {
        categories['法规引用过时'].count++;
        if (!categories['法规引用过时'].examples.includes(stock)) {
          categories['法规引用过时'].examples.push(stock);
        }
      }
      if (text.includes('编造') || text.includes('胡编') || text.includes('幻觉')) {
        categories['AI幻觉/编造'].count++;
        if (!categories['AI幻觉/编造'].examples.includes(stock)) {
          categories['AI幻觉/编造'].examples.push(stock);
        }
      }
      if (text.includes('建议') || text.includes('分析')) {
        categories['分析建议不准确'].count++;
      }
    }
  }

  // 只返回有问题的类别
  for (const [name, data] of Object.entries(categories)) {
    if (data.count > 0) {
      issues.push({
        category: name,
        count: data.count,
        examples: data.examples.slice(0, 5)
      });
    }
  }

  return issues;
}

// 生成改进建议
function generateRecommendations(issues: EvolutionAnalysis['issues']): string[] {
  const recommendations: string[] = [];

  for (const issue of issues) {
    switch (issue.category) {
      case '股票名称错误':
        recommendations.push('在systemPrompt中强调：必须使用/api/stock返回的实时数据，优先使用API名称而非本地配置');
        recommendations.push(`发现${issue.examples.length}只股票名称可能错误：${issue.examples.join(', ')}，需要更新本地股票名称映射`);
        break;
      case '价格数据错误':
        recommendations.push('在systemPrompt中强调：所有价格数据必须来自/api/stock实时API，明确告知用户价格可能存在延迟');
        break;
      case '市值数据错误':
        recommendations.push('强调流动市值计算规则：市值以港元为单位，使用/api/stock返回的市值数据');
        break;
      case '港股通状态错误':
        recommendations.push('在systemPrompt中强调：必须使用【股票数据查询结果】中的港股通状态字段，这是实时数据');
        recommendations.push('提醒用户港股通状态可能随恒生综指调整而变化');
        break;
      case '法规引用过时':
        recommendations.push('立即更新专家知识库，使用2026年最新法规数据');
        recommendations.push('将systemPrompt中的年份从"2024年/2025年"更新为"2026年最新"');
        break;
      case 'AI幻觉/编造':
        recommendations.push('在systemPrompt中添加：遇到不确定的信息时，必须明确告知用户"请核实"而非编造');
        recommendations.push('添加合规免责声明，要求用户去官方渠道核实');
        break;
      case '分析建议不准确':
        recommendations.push('建议增加具体案例分析，增强实战经验引用');
        break;
    }
  }

  return recommendations;
}

// 生成知识缺口
function generateKnowledgeGaps(issues: EvolutionAnalysis['issues']): string[] {
  const gaps: string[] = [];

  for (const issue of issues) {
    if (issue.count >= 3) {
      switch (issue.category) {
        case '股票名称错误':
          gaps.push('需要建立股票名称的自动更新机制');
          break;
        case '港股通状态错误':
          gaps.push('需要接入实时港股通名单数据源');
          break;
        case '法规引用过时':
          gaps.push('需要建立法规更新的自动监控机制');
          break;
      }
    }
  }

  return gaps;
}

// POST: 执行进化分析
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, action } = body;

    if (action === 'analyze') {
      // 分析特定专家的反馈
      if (!expertId) {
        return NextResponse.json({ success: false, error: '缺少expertId' }, { status: 400 });
      }

      const feedback = await getExpertFeedbackStats(expertId);
      if (!feedback || feedback.length === 0) {
        return NextResponse.json({
          success: true,
          message: '暂无反馈数据',
          data: { feedbackCount: 0 }
        });
      }

      // 分析问题模式
      const issues = analyzeIssuePatterns(feedback);
      const recommendations = generateRecommendations(issues);
      const knowledgeGaps = generateKnowledgeGaps(issues);

      // 生成洞察
      const insights = issues.map(i => `发现${i.count}条关于"${i.category}"的反馈`);

      const analysis: EvolutionAnalysis = {
        expertId,
        learningCycle: 1,
        issues,
        insights,
        recommendations,
        knowledgeGaps
      };

      // 更新进化状态
      const evolutionState = await getEvolutionState(expertId);
      const newCycle = (evolutionState?.learning_cycle || 0) + 1;

      await updateEvolutionState(expertId, {
        learningCycle: newCycle,
        status: issues.length > 0 ? 'learning' : 'stable',
        metrics: {
          totalInteractions: feedback.length,
          positiveFeedback: feedback.filter((f: any) => f.rating === 'positive').length,
          negativeFeedback: feedback.filter((f: any) => f.rating === 'negative').length,
          issues: issues.map(i => i.category),
          successfulCases: 0,
          improvementAreas: recommendations
        }
      });

      // 如果有负面反馈，添加学习案例
      if (issues.length > 0) {
        await addLearnedCase(
          expertId,
          'failure',
          `学习周期${newCycle}：发现以下问题 - ${issues.map(i => i.category).join(', ')}`,
          issues.map(i => i.category),
          recommendations,
          'user_feedback'
        );
      }

      return NextResponse.json({
        success: true,
        data: analysis
      });
    }

    if (action === 'full_analysis') {
      // 全量分析所有专家
      const experts = ['health-check', 'ipo-analysis', 'listing-path', 'compliance', 'valuation', 'index-inclusion', 'stock-connect-planning', 'market-cap-maintenance'];
      const results = [];

      for (const expId of experts) {
        const feedback = await getExpertFeedbackStats(expId);
        if (feedback && feedback.length > 0) {
          const issues = analyzeIssuePatterns(feedback);
          results.push({
            expertId: expId,
            feedbackCount: feedback.length,
            positiveRate: ((feedback.filter((f: any) => f.rating === 'positive').length / feedback.length) * 100).toFixed(1) + '%',
            issuesCount: issues.length,
            topIssues: issues.slice(0, 3)
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          totalExperts: experts.length,
          analyzedExperts: results.length,
          results
        }
      });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });

  } catch (error: any) {
    console.error('进化分析失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: 获取进化状态
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      // 获取所有专家的进化状态
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/expert_evolution?select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
      }

      const data = await response.json();
      return NextResponse.json({ success: true, data });
    }

    if (expertId) {
      const state = await getEvolutionState(expertId);
      const feedback = await getExpertFeedbackStats(expertId);

      return NextResponse.json({
        success: true,
        data: {
          evolution: state,
          feedback: {
            total: feedback?.length || 0,
            positive: feedback?.filter((f: any) => f.rating === 'positive').length || 0,
            negative: feedback?.filter((f: any) => f.rating === 'negative').length || 0
          }
        }
      });
    }

    return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });

  } catch (error: any) {
    console.error('获取进化状态失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
