import { NextResponse } from 'next/server';

// 知识条目类型
type KnowledgeEntry = {
  id: string;
  type: 'case' | 'rule' | 'faq' | 'market_data' | 'success_story';
  title: string;
  content: string;
  tags: string[];
  expertId?: string;
  source?: string;
  createdAt: string;
  usageCount: number;
  lastUsed?: string;
};

// 知识库存储
const knowledgeBase: KnowledgeEntry[] = [
  // 港股通入通成功案例（来自用户提供的非公开案例，已脱敏）
  {
    id: 'case_001',
    type: 'case',
    title: '港股通入通成功案例 - 生物医药行业',
    content: `【入通成功关键策略】

1. 市值管理策略
   - 回购操作：检讨期内累计花费2亿多HKD，购买股份占总流通股本的2.4%
   - 配股配合：花费3亿HKD配股，股份占总流通股本的1.8%
   - 效果：市值从30多亿增加至约190亿（增长500%+）

2. 流动性提升
   - 方法：打量增加市场成交（持有底仓方式）
   - 持续时间：6个月以上
   - 效果：日均成交量由0.05%提升至0.1%以上

3. 股权结构优化
   - 基石投资者：累计延长禁售期5个月
   - 关键：有序的大宗交易承接

4. 事件催化
   - 利好类型：药物研发里程碑、与知名药企合作、成功开拓新市场
   - 时机：结合行业利好，整个板块趋势向上时更易拉升`,
    tags: ['港股通', '入通', '市值管理', '流动性', '生物医药', '回购', '配股'],
    expertId: 'stock-connect-planning',
    source: '非公开案例',
    createdAt: '2026-03-18',
    usageCount: 0
  },
  {
    id: 'case_002',
    type: 'case',
    title: '入通失败教训案例',
    content: `【入通失败常见原因】

1. 时间窗口错误
   - 太晚开始规划，错过检讨期
   - 没有预留足够的运作时间

2. 市值不达标
   - 未能达到50亿门槛的安全垫
   - 股价波动导致平均市值不足

3. 流动性不足
   - 日均成交量过低
   - 被认定为"僵尸股"

4. 股权结构问题
   - 主要股东持股过于集中
   - 自由流通量被低估

5. 监管风险
   - 股价短时间涨幅过快引起监管注意
   - 被纳入重点监控池`,
    tags: ['港股通', '失败教训', '风险控制', '时间窗口', '市值', '流动性'],
    expertId: 'health-check',
    source: '实战经验总结',
    createdAt: '2026-03-18',
    usageCount: 0
  },
  // 规则知识
  {
    id: 'rule_001',
    type: 'rule',
    title: '港股通纳入硬性门槛',
    content: `【港股通纳入条件】

硬性门槛：
1. 市值≥50亿港元
2. 上市满6个月（创业板需12个月）
3. 月均成交额≥2000万港元
4. 日均成交股数≥100万股
5. 无重大违规

恒生综指纳入规则：
- 季度审核：3、6、9、12月
- 考察期：检讨日前12个月平均市值
- 流通市值计算：扣除主要股东持股

实务安全线：
- 建议设定55-58亿市值安全垫（10-15%）
- 检讨期最后20个交易日是关键`,
    tags: ['港股通', '规则', '门槛', '市值', '恒生综指'],
    expertId: 'health-check',
    source: '港交所官方规则',
    createdAt: '2026-01-01',
    usageCount: 0
  },
  {
    id: 'rule_002',
    type: 'rule',
    title: 'MSCI纳入规则',
    content: `【MSCI指数纳入规则】

能进哪些指数？
- MSCI中国指数（China）
- MSCI新兴市场指数（Emerging Markets）
- MSCI全球指数（ACWI）

硬性门槛：
- 市值要求：纳入时的FIAS决定的最低市值
- 流动性要求：ATVR（年度交易价值比率）≥15%（新兴市场）
- 外资持股限制：外资可投资比例
- 上市时间要求：至少3-6个月

纳入流程：
- 初步审查 → 市场咨询 → 最终评估 → 纳入生效
- 年度审核：通常在2月、5月、8月、11月

实务技巧：
- ATVR计算：MSCI对"交易频率"的考量有时高于单日爆发量
- 建议通过做市商提供持续的双边报价
- 策划老股转让或配售，利用市场关注度`,
    tags: ['MSCI', '指数', '纳入', 'ATVR', '流动性'],
    expertId: 'index-inclusion',
    source: 'MSCI官方规则',
    createdAt: '2026-01-01',
    usageCount: 0
  },
  // 常见问题
  {
    id: 'faq_001',
    type: 'faq',
    title: '港股通入通需要多长时间？',
    content: `【入通时间线】

从开始规划到正式入通，通常需要6-12个月：

1. 规划期（1-2个月）
   - 评估现状和差距
   - 制定入通策略

2. 执行期（3-6个月）
   - 市值管理操作
   - 流动性提升
   - 股权结构优化

3. 等待期（1-3个月）
   - 等待检讨日
   - 维持各项指标

4. 生效期
   - 检讨日审核通过后，通常在下一次港股通调整日生效

关键：建议从目标检讨日倒推6个月开始规划`,
    tags: ['港股通', '入通', '时间线', '规划'],
    expertId: 'stock-connect-planning',
    source: '专家知识库',
    createdAt: '2026-01-01',
    usageCount: 0
  },
  {
    id: 'faq_002',
    type: 'faq',
    title: '入通需要多少资金？',
    content: `【入通资金估算】

根据案例数据，入通运作通常需要：

1. 市值管理
   - 回购：2-5亿HKD
   - 配股配合：3-5亿HKD
   - 视乎起始市值和目标差距

2. 流动性提升
   - 做市商费用：视服务商而定
   - 底仓维护：视成交量目标而定

3. 专业服务
   - 投行顾问费：100-300万HKD
   - 法律合规费：50-100万HKD

总计估算：5-10亿HKD（视项目复杂度）

注：具体金额需根据公司实际情况评估`,
    tags: ['港股通', '资金', '预算', '成本'],
    expertId: 'stock-connect-planning',
    source: '专家知识库',
    createdAt: '2026-01-01',
    usageCount: 0
  },
  // 成功故事
  {
    id: 'story_001',
    type: 'success_story',
    title: '港股通入通成功要素',
    content: `【入通成功关键要素】

1. 提前规划
   - 预留充足时间（建议6个月以上）
   - 做好各项准备工作

2. 多策略组合
   - 回购 + 配股 + 路演组合效果最佳
   - 单一策略效果有限

3. 持续流动性
   - 关键在于持续稳定的成交量
   - 不是单日爆发

4. 事件催化
   - 结合行业利好发布
   - 选择市场走势向上时

5. 风险控制
   - 避免股价短时间涨幅过快
   - 股权结构要尽早分散

这些要素缺一不可，相互配合才能提高入通成功率`,
    tags: ['港股通', '成功', '关键要素', '策略'],
    expertId: 'stock-connect-planning',
    source: '案例总结',
    createdAt: '2026-03-18',
    usageCount: 0
  },
];

// 简单的文本相似度计算（基于关键词匹配）
function calculateRelevance(query: string, entry: KnowledgeEntry): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  const contentLower = entry.content.toLowerCase();
  const tagsLower = entry.tags.map(t => t.toLowerCase());
  const titleLower = entry.title.toLowerCase();

  let score = 0;

  // 标题匹配权重高
  for (const word of queryWords) {
    if (titleLower.includes(word)) score += 3;
  }

  // 标签匹配
  for (const word of queryWords) {
    if (tagsLower.some(tag => tag.includes(word))) score += 2;
  }

  // 内容匹配
  for (const word of queryWords) {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
    score += Math.min(matches, 5); // 限制单关键词得分
  }

  return score;
}

// RAG检索API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, expertId, type, limit = 5 } = body;

    if (!query) {
      return NextResponse.json({
        success: false,
        error: '查询内容不能为空'
      }, { status: 400 });
    }

    // 过滤知识库
    let filtered = knowledgeBase;

    // 按专家过滤
    if (expertId) {
      filtered = filtered.filter(k => k.expertId === expertId || !k.expertId);
    }

    // 按类型过滤
    if (type) {
      filtered = filtered.filter(k => k.type === type);
    }

    // 计算相关性得分
    const scored = filtered.map(entry => ({
      ...entry,
      relevance: calculateRelevance(query, entry)
    }));

    // 排序并取前N个
    const results = scored
      .filter(r => r.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    // 更新使用统计
    for (const result of results) {
      const entry = knowledgeBase.find(k => k.id === result.id);
      if (entry) {
        entry.usageCount++;
        entry.lastUsed = new Date().toISOString();
      }
    }

    console.log(`✅ RAG检索完成: 查询"${query}", 返回${results.length}条结果`);

    return NextResponse.json({
      success: true,
      query,
      results: results.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        content: r.content,
        tags: r.tags,
        relevance: r.relevance,
        source: r.source
      })),
      total: results.length
    });

  } catch (error: any) {
    console.error('❌ RAG检索失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 获取知识库统计
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'stats') {
      const stats = {
        total: knowledgeBase.length,
        byType: {} as Record<string, number>,
        byExpert: {} as Record<string, number>,
        mostUsed: [] as KnowledgeEntry[],
        recentlyUsed: [] as KnowledgeEntry[],
      };

      for (const entry of knowledgeBase) {
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        if (entry.expertId) {
          stats.byExpert[entry.expertId] = (stats.byExpert[entry.expertId] || 0) + 1;
        }
      }

      stats.mostUsed = [...knowledgeBase].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
      stats.recentlyUsed = [...knowledgeBase]
        .filter(k => k.lastUsed)
        .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
        .slice(0, 5);

      return NextResponse.json({ success: true, data: stats });
    }

    return NextResponse.json({
      success: true,
      data: knowledgeBase.map(k => ({
        id: k.id,
        type: k.type,
        title: k.title,
        tags: k.tags,
        usageCount: k.usageCount
      }))
    });

  } catch (error: any) {
    console.error('❌ 获取知识库失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
