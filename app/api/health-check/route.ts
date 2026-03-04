import { NextResponse } from 'next/server';

// Azure OpenAI 配置 - 使用环境变量
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';

// 港股通体检系统提示词
const HEALTH_CHECK_SYSTEM_PROMPT = `你是一位拥有20年经验的港股IPO上市专家，专精于港股通准入条件和香港联交所上市规则。你的名字叫"港股通体检专家"。

## 你的职责
根据用户提供的公司信息，进行港股通入通可行性体检，并给出专业的改进建议。

## 港股通准入条件（必须严格遵守）

### 主板上市条件（满足其一即可）：
1. 盈利测试：最近一年盈利≥3500万港元，前两年累计盈利≥4500万港元，前三年累计盈利≥8000万港元
2. 市值收益测试：市值≥40亿港元，最近一年收益≥5亿港元
3. 市值收益现金流测试：市值≥20亿港元，最近一年收益≥5亿港元，最近三年累计现金流≥1亿港元

### 港股通纳入条件：
- 必须在香港主板或创业板上市
- 市值不低于50亿港元
- 需被纳入恒生综合大型股/中型股指数

## 输出格式
请按照以下JSON格式输出体检结果：
{
  "overallScore": 0-100的评分,
  "summary": "总体评估摘要",
  "details": {
    "财务指标": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""},
    "股权架构": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""},
    "合规要求": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""},
    "市值达标": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""}
  },
  "recommendations": [{"priority": "high/medium/low", "category": "", "suggestion": ""}]
}`;

// 调用Azure OpenAI API
async function callAzureOpenAI(messages: any[]) {
  try {
    const response = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Azure OpenAI API error:', error);
    throw error;
  }
}

// 模拟体检结果（当API调用失败时使用）
function getMockHealthCheckResult(data: any) {
  const profits = data.profits || []
  const latestProfit = profits[2] || 0
  const totalProfit = profits.reduce((a: number, b: number) => a + b, 0)
  const marketCap = data.marketCap || 0
  const revenue = data.revenue || 0
  
  let financialScore = 50
  const financialIssues: string[] = []
  
  if (latestProfit >= 3500 && totalProfit >= 8000) {
    financialScore = 90
  } else if (latestProfit >= 2000 || totalProfit >= 5000) {
    financialScore = 70
    if (latestProfit < 3500) financialIssues.push('最近一年盈利未达到3500万要求')
    if (totalProfit < 8000) financialIssues.push('三年累计盈利未达到8000万要求')
  } else {
    financialIssues.push('不满足盈利测试要求')
    if (marketCap >= 40 && revenue >= 5) {
      financialScore = 80
    } else if (marketCap >= 20 && revenue >= 5) {
      financialScore = 75
    } else {
      financialScore = 30
      financialIssues.push('不满足市值收益测试要求')
    }
  }
  
  let ownershipScore = 80
  const ownershipIssues: string[] = []
  if (data.controllingShareholder > 75) {
    ownershipScore -= 20
    ownershipIssues.push('控股股东持股比例过高，可能影响独立性')
  }
  if (data.isVIE) {
    ownershipScore -= 15
    ownershipIssues.push('采用VIE架构需关注监管合规')
  }
  
  let marketCapScore = 60
  const marketCapIssues: string[] = []
  if (marketCap >= 50) {
    marketCapScore = 95
  } else if (marketCap >= 40) {
    marketCapScore = 85
    marketCapIssues.push('市值50亿以上可纳入港股通')
  }
  
  let complianceScore = 70
  const complianceIssues: string[] = []
  if (data.isVIE) {
    complianceIssues.push('需关注VIE架构合规性')
    complianceScore -= 10
  }
  
  const overallScore = Math.round(
    (financialScore * 0.35) + 
    (ownershipScore * 0.2) + 
    (marketCapScore * 0.3) + 
    (complianceScore * 0.15)
  )
  
  let summary = ''
  if (overallScore >= 80) {
    summary = '公司整体情况良好，具备港股上市基本条件，建议尽快启动上市筹备工作。'
  } else if (overallScore >= 60) {
    summary = '公司具备一定上市基础，但存在部分问题需要改进，建议针对性优化后再启动。'
  } else {
    summary = '公司目前离港股上市要求还有较大差距，建议优先解决关键问题后再考虑上市。'
  }
  
  return {
    overallScore,
    summary,
    details: {
      财务指标: {
        status: financialScore >= 70 ? 'pass' : financialScore >= 50 ? 'warning' : 'fail',
        score: financialScore,
        issues: financialIssues,
        details: `最近一年盈利${latestProfit}万，三年累计${totalProfit}万。`
      },
      股权架构: {
        status: ownershipScore >= 70 ? 'pass' : ownershipScore >= 50 ? 'warning' : 'fail',
        score: ownershipScore,
        issues: ownershipIssues,
        details: `控股股东持股${data.controllingShareholder}%。${data.isVIE ? '采用VIE架构。' : ''}`
      },
      合规要求: {
        status: complianceScore >= 70 ? 'pass' : complianceScore >= 50 ? 'warning' : 'fail',
        score: complianceScore,
        issues: complianceIssues,
        details: `行业类型：${data.industry}。`
      },
      市值达标: {
        status: marketCapScore >= 70 ? 'pass' : 'warning',
        score: marketCapScore,
        issues: marketCapIssues,
        details: `预计市值${marketCap}亿，营收${revenue}亿。`
      }
    },
    recommendations: [
      {
        priority: overallScore < 70 ? 'high' : 'medium',
        category: '财务优化',
        suggestion: financialScore < 70 ? '建议提升盈利水平或选择适合的上市财务测试路径' : '财务状况良好，保持即可'
      },
      {
        priority: data.isVIE ? 'high' : 'low',
        category: '架构调整',
        suggestion: data.isVIE ? '建议咨询专业律师，确保VIE架构合规性' : '股权架构清晰，继续保持'
      },
      {
        priority: marketCap < 50 ? 'medium' : 'low',
        category: '市值提升',
        suggestion: marketCap < 50 ? '建议在上市前完成Pre-IPO融资，提升市值至50亿以上' : '市值已达标'
      }
    ].filter((r: any) => r.suggestion)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      companyName, 
      industry, 
      isVIE, 
      profits, 
      marketCap, 
      revenue, 
      controllingShareholder,
      hasOffshore 
    } = body
    
    // 构建用户消息
    const userMessage = `请为以下公司进行港股通入通可行性体检：

## 公司基本信息
- 公司名称：${companyName}
- 行业类型：${industry}
- 是否采用VIE架构：${isVIE ? '是' : '否'}

## 财务数据（万港元）
- 最近一年盈利：${profits?.[2] || '未提供'}
- 前一年盈利：${profits?.[1] || '未提供'}
- 大前年盈利：${profits?.[0] || '未提供'}
- 预计市值：${marketCap}亿港元
- 最近一年营收：${revenue}亿港元

## 股权架构
- 控股股东持股比例：${controllingShareholder}%
- 是否存在境外股东：${hasOffshore ? '是' : '否'}

请基于以上信息，按照港股通准入条件进行专业分析，并输出JSON格式的体检结果。`

    try {
      // 调用Azure OpenAI
      const aiResponse = await callAzureOpenAI([
        { role: 'system', content: HEALTH_CHECK_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ])
      
      // 尝试解析AI响应为JSON
      let aiResult
      try {
        aiResult = JSON.parse(aiResponse)
      } catch {
        // 如果解析失败，使用模拟结果但添加AI分析摘要
        const mockResult = getMockHealthCheckResult({
          companyName, industry, isVIE, profits, marketCap, revenue, controllingShareholder, hasOffshore
        })
        return NextResponse.json({
          success: true,
          data: mockResult,
          aiAnalysis: aiResponse,
          message: 'AI分析完成'
        })
      }
      
      return NextResponse.json({
        success: true,
        data: aiResult,
        message: 'AI分析完成'
      })
      
    } catch (aiError: any) {
      console.error('AI调用失败，使用模拟结果:', aiError)
      // API调用失败时返回模拟结果
      const mockResult = getMockHealthCheckResult({
        companyName,
        industry,
        isVIE,
        profits,
        marketCap,
        revenue,
        controllingShareholder,
        hasOffshore
      })
      
      return NextResponse.json({
        success: true,
        data: mockResult,
        isMock: true,
        message: '演示模式（AI服务暂时不可用）'
      })
    }
    
  } catch (error: any) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || '体检服务出现错误'
    }, { status: 500 })
  }
}
