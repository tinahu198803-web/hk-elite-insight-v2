// 招股书分析AI服务

export const IPO_ANALYSIS_SYSTEM_PROMPT = `你是一位资深的港股IPO分析师，专门为投资者解读招股书的核心要点。你的名字叫"招股书分析专家"。

## 你的职责
根据用户选择的IPO公司，提供专业、易懂的招股书分析报告。

## 分析维度

1. **商业模式**
   - 公司主营业务是什么
   - 收入来源和结构
   - 竞争优势和护城河

2. **保荐人记录**
   - 保荐人的历史业绩
   - 胜率和项目质量
   - 声誉评估

3. **基石投资者**
   - 基石投资者背景
   - 认购金额和比例
   - 锁定期安排

4. **风险因素**
   - 行业风险
   - 经营风险
   - 监管风险
   - 财务风险

## 输出格式
请按照以下JSON格式输出分析结果：
{
  "companyName": "公司名称",
  "ipoDate": "上市日期",
  "issuePrice": "发行价",
  "analysis": {
    "商业模式": {
      "summary": "简要描述",
      "keyPoints": ["要点1", "要点2", "要点3"]
    },
    "保荐人记录": {
      "summary": "简要描述",
      "sponsors": ["保荐人1", "保荐人2"],
      "historicalPerformance": "历史表现评估"
    },
    "基石投资者": {
      "summary": "简要描述",
      "investors": [{"name": "投资者名称", "amount": "认购金额", "lockup": "锁定期"}]
    },
    "风险因素": {
      "summary": "简要描述",
      "risks": ["风险1", "风险2", "风险3"]
    }
  },
  "recommendation": {
    "score": 0-10,
    "summary": "推荐理由"
  }
}

请基于公开信息进行分析，如果没有具体数据，请说明"根据公开信息暂未披露"。`;

// IPO列表数据
export const IPO_LIST = [
  {
    id: 1,
    name: '美的集团',
    code: '0030.HK',
    date: '2024-02-20',
    status: '申购中',
    price: '54.8',
    minQty: 100,
    industry: '家电制造',
    description: '全球领先的家电制造商'
  },
  {
    id: 2,
    name: '地平线机器人',
    code: '9660.HK',
    date: '2024-02-15',
    status: '已上市',
    price: '4.1',
    minQty: 500,
    industry: '自动驾驶',
    description: '中国领先的自动驾驶解决方案供应商'
  },
  {
    id: 3,
    name: '麦士克',
    code: '2024-02-12',
    status: '待上市',
    price: '待定',
    minQty: 200,
    industry: '食品饮料',
    description: '食品饮料制造商'
  },
  {
    id: 4,
    name: '七云牛',
    code: '2024-02-08',
    status: '已上市',
    price: '15.6',
    minQty: 200,
    industry: '云计算',
    description: '云计算服务提供商'
  },
  {
    id: 5,
    name: '蚂蚁集团',
    code: '6688.HK',
    date: '2024-03',
    status: '待上市',
    price: '待定',
    minQty: 50,
    industry: '金融科技',
    description: '全球领先的金融科技平台'
  }
];

// 获取模拟分析结果
export function getMockAnalysis(companyName: string) {
  const company = IPO_LIST.find(i => i.name === companyName);
  
  return {
    companyName: companyName,
    ipoDate: company?.date || '待定',
    issuePrice: company?.price || '待定',
    analysis: {
      商业模式: {
        summary: `${companyName}主要从事${company?.industry || '相关业务'}，公司采用直销与分销相结合的模式，拥有完善的销售网络。`,
        keyPoints: [
          '主营业突出，市场份额领先',
          '毛利率稳定，盈利能力较强',
          '研发投入持续增加，创新能力较强'
        ]
      },
      保荐人记录: {
        summary: '本次IPO由多家知名投行担任联席保荐人，团队拥有丰富的IPO项目经验。',
        sponsors: ['中金公司', '摩根士丹利', '高盛', '海通国际'],
        historicalPerformance: '历史项目胜率高，声誉良好'
      },
      基石投资者: {
        summary: '引入多家知名基石投资者，合计认购金额约占发行规模的40%。',
        investors: [
          { name: '新加坡主权基金', amount: '约2亿美元', lockup: '6个月' },
          { name: '高瓴资本', amount: '约1亿美元', lockup: '6个月' },
          { name: '红杉中国', amount: '约5000万美元', lockup: '6个月' }
        ]
      },
      风险因素: {
        summary: '投资者需关注以下风险因素：',
        risks: [
          '行业竞争激烈，市场份额面临挤压',
          '宏观经济波动可能影响业绩',
          '原材料价格波动对利润率的影响',
          '监管政策变化带来的不确定性'
        ]
      }
    },
    recommendation: {
      score: 7.5,
      summary: '公司基本面良好，行业前景广阔，建议关注。'
    }
  };
}
