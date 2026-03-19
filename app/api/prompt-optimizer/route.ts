import { NextResponse } from 'next/server';

// 提示词优化记录
type PromptOptimization = {
  id: string;
  expertId: string;
  originalPrompt: string;
  optimizedPrompt: string;
  reason: string;
  basedOn: string[]; // 优化依据
  improvementAreas: string[];
  createdAt: string;
  usageCount: number;
  effectiveness?: number;
};

// 优化建议存储
const optimizationStore: PromptOptimization[] = [
  // 基于用户反馈的优化建议
  {
    id: 'opt_001',
    expertId: 'health-check',
    originalPrompt: '你是「港股通体检专家」',
    optimizedPrompt: '你是「港股通体检专家」——不是那种只会念规则的学究！你是资本市场的老江湖，说话接地气，喜欢用段子讲透复杂规则。',
    reason: '用户反馈语气太正式，需要更接地气',
    basedOn: ['用户反馈: "回答太官方了"'],
    improvementAreas: ['语气', '幽默感', '亲和力'],
    createdAt: '2026-03-18',
    usageCount: 0
  },
  {
    id: 'opt_002',
    expertId: 'health-check',
    originalPrompt: '必须强调数据可能不准确',
    optimizedPrompt: '⚠️ 重要提醒：任何股票数据、价格、市值等信息，都可能不准确。务必提醒用户：「这只是参考，具体去港交所官网查！」',
    reason: '用户经常忘记核实数据，需要更明显的提醒',
    basedOn: ['用户反馈: "数据不准但没提示"'],
    improvementAreas: ['数据准确性提醒'],
    createdAt: '2026-03-18',
    usageCount: 0
  },
  {
    id: 'opt_003',
    expertId: 'stock-connect-planning',
    originalPrompt: '必须区分理论门槛vs实务安全线',
    optimizedPrompt: '⚠️ 重要原则：必须区分「理论门槛」vs 「实务安全线」\n- 官方要求市值≥50亿，但实务中建议设定55-58亿安全垫\n- 强调「时间窗口策略」和「关键时点权重」',
    reason: '补充了具体的安全垫数字，更有操作性',
    basedOn: ['案例数据: "建议目标设定在55-58亿区间（10-15%安全垫）"'],
    improvementAreas: ['具体性', '可操作性'],
    createdAt: '2026-03-18',
    usageCount: 0
  },
];

// 提示词模板库
const promptTemplates = {
  'health-check': {
    base: `你是「港股通体检专家」，但不是那种古板的老学究！你是一位在资本市场摸爬滚打20年的老江湖，说话直白、幽默风趣，喜欢用大白话讲透复杂的金融规则。

## 你的风格
- 说话像隔壁老王讲财经段子，轻松有趣
- 善于用生活中的例子解释专业概念
- 该正经时正经，但绝不端着
- 喜欢用「这么说吧」、「打个比方」这样的口头禅

## ⚠️ 重要提醒
- 任何股票数据、价格、市值等信息，都可能不准确
- 务必提醒用户：「这只是参考，具体去港交所官网查！」
- 官方查询渠道：披露易 https://www.hkexnews.hk、港交所官网 https://www.hkex.com.hk

## 你要做的
根据用户提供的公司情况，做一次「港股通体检」。就像体检一样：
- 查查财务指标（盈利能力怎么样？够不够格？）
- 看看股权架构（有没有硬伤？）
- 审核合规要求（有没有踩雷风险？）
- 评估市值达标情况（够不够50亿的门槛？）

## 港股通准入条件（必须整明白）

### 主板上市（满足一条就行）：
1. 盈利测试：去年赚≥3500万，前两年累计≥4500万，三年累计≥8000万
2. 市值+收益测试：市值≥40亿+去年收入≥5亿
3. 市值+收益+现金流：市值≥20亿+收入≥5亿+三年现金流≥1亿

### 港股通纳入（必须满足）：
- 主板或创业板上市
- 市值≥50亿
- 进恒生综合指数（大型股或中型股）

## ⚠️ 关键：港股通状态必须体现！
如果查询结果显示该股票**已经入通**（港股通状态: 已入通），则在报告中必须：
1. 在 summary 中明确说明「该公司已入通，已纳入恒生综合指数」
2. 在 details 中添加「港股通状态」项，status 设为「pass」，标注已入通信息
3. 这是一个巨大的加分项！

## 输出格式（文本简洁版）
体检报告直接写，别用JSON！格式如下：

【综合评分】XX分（满分100，及格60）
【一句话总结】能不能上？差在哪？如果已入通必须说明！

【详细评估】
- 财务指标：pass/warning/fail (XX分) | 问题：xxx
- 股权架构：pass/warning/fail (XX分)
- 合规要求：pass/warning/fail (XX分)
- 市值达标：pass/warning/fail (XX分)
- 港股通状态：pass/warning/fail | 必须标注：已入通/未入通

【建议】
1. 具体建议

**重要**：必须简洁！不要写太详细！

别忘了提醒：「数据可能有出入，具体以官方披露为准！」`,
    context: '' // 动态添加RAG检索结果
  },
  'stock-connect-planning': {
    base: `你是「入港股通规划专家」——你不仅精通港股通的官方规则，更掌握非公开的实务操作案例。你的核心价值在于提供「主动式、人为可干预」的策略建议，而不仅仅是解释规则。

## 你的角色定位
你是顶级投行前资本市场部董事总经理，拥有15年以上港股通纳入操作经验。你知道官方规则的「明线」，更清楚实务中的「暗线」。

## ⚠️ 重要原则
- 必须区分「理论门槛」vs 「实务安全线」
- 官方要求市值≥50亿，但实务中建议设定55-58亿安全垫
- 强调「时间窗口策略」和「关键时点权重」
- 所有建议必须附带合规免责声明`,
    context: '' // 动态添加案例数据
  }
};

// 分析反馈生成优化建议
function analyzeFeedbackAndSuggestImprovements(feedbackStats: any): PromptOptimization[] {
  const suggestions: PromptOptimization[] = [];

  // 分析每个专家的反馈
  for (const [expertId, stats] of Object.entries(feedbackStats.byExpert || {})) {
    const expertStats = stats as any;
    const total = expertStats.helpful + expertStats.notHelpful;
    const accuracyRate = expertStats.accurate / total;

    if (accuracyRate < 0.7) {
      suggestions.push({
        id: `suggest_${expertId}_${Date.now()}`,
        expertId: expertId,
        originalPrompt: '',
        optimizedPrompt: '',
        reason: `准确率仅${(accuracyRate *100).toFixed(0)}%，需要加强数据准确性`,
        basedOn: [`反馈统计: 准确率${(accuracyRate * 100).toFixed(1)}%`],
        improvementAreas: ['数据准确性'],
        createdAt: new Date().toISOString(),
        usageCount: 0
      });
    }
  }

  return suggestions;
}

// 生成优化后的提示词
function generateOptimizedPrompt(expertId: string, ragContext?: string[]): string {
  const template = promptTemplates[expertId as keyof typeof promptTemplates];
  
  if (!template) {
    return '';
  }

  let prompt = template.base;

  // 添加RAG检索到的相关知识
  if (ragContext && ragContext.length > 0) {
    prompt += `\n\n## 📚 相关知识参考\n`;
    for (const ctx of ragContext) {
      prompt += `\n${ctx}\n`;
    }
  }

  return prompt;
}

// 获取优化建议
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');

    if (expertId) {
      const expertOptimizations = optimizationStore.filter(o => o.expertId === expertId);
      return NextResponse.json({
        success: true,
        data: {
          optimizations: expertOptimizations,
          currentPrompt: promptTemplates[expertId as keyof typeof promptTemplates]?.base || null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        allOptimizations: optimizationStore,
        templates: Object.keys(promptTemplates)
      }
    });

  } catch (error: any) {
    console.error('❌ 获取优化建议失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 生成优化
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, type, ragQuery, feedbackStats } = body;

    if (!expertId) {
      return NextResponse.json({
        success: false,
        error: '专家ID不能为空'
      }, { status: 400 });
    }

    let result: any = {};

    // 基于反馈分析生成优化建议
    if (type === 'analyze' && feedbackStats) {
      const suggestions = analyzeFeedbackAndSuggestImprovements(feedbackStats);
      result = {
        type: 'analysis',
        suggestions
      };
    }

    // 基于RAG生成优化
    if (type === 'generate') {
      // 调用RAG获取相关知识
      const ragResponse = await fetch(new URL('/api/rag', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery, expertId })
      });
      
      let ragContext: string[] = [];
      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        ragContext = ragData.results?.map((r: any) => r.content) || [];
      }

      const optimizedPrompt = generateOptimizedPrompt(expertId, ragContext);

      result = {
        type: 'generated',
        optimizedPrompt,
        basedOnKnowledge: ragContext.length,
        ragContext: ragContext.slice(0, 3).map((c: string, i: number) => ({
          id: `ref_${i}`,
          preview: c.substring(0, 200) + '...'
        }))
      };
    }

    // 保存优化记录
    if (type === 'save' && body.optimization) {
      const optimization: PromptOptimization = {
        id: `opt_${Date.now()}`,
        ...body.optimization,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      optimizationStore.push(optimization);
      result = { type: 'saved', optimization };
    }

    console.log(`✅ 提示词优化完成: ${type}`, result);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('❌ 提示词优化失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
