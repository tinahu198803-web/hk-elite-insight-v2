import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';

// Azure OpenAI 配置 - 使用环境变量
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';

// 腾讯财经API基础URL
const TENCENT_FINANCE_API = 'https://qt.gtimg.cn/q=';

// 港股股票代码规范化
function normalizeStockCode(code: string): string {
  let normalized = code.trim().toUpperCase();
  if (normalized.endsWith('.HK')) {
    return normalized;
  }
  if (/^\d+$/.test(normalized)) {
    return `${normalized}.hk`;
  }
  return normalized;
}

// 提取消息中的股票代码
function extractStockCodes(message: string): string[] {
  // 匹配各种格式的港股代码：00700.hk, 00700, 02659.hk 等
  const stockCodePattern = /\b(0\d{4}\.?(?:hk|HK)?)\b/gi;
  const matches = message.match(stockCodePattern) || [];
  // 过滤并标准化
  return matches
    .map(code => {
      let cleaned = code.replace(/\./g, '').toLowerCase();
      if (!cleaned.endsWith('hk')) {
        cleaned += 'hk';
      }
      return cleaned;
    })
    .filter(code => code.length >= 6 && code.length <= 7); // 例如 00700.hk
}

// 获取股票数据
async function getStockData(stockCode: string) {
  try {
    const normalizedCode = normalizeStockCode(stockCode);
    const url = `${TENCENT_FINANCE_API}${normalizedCode}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    const match = text.match(/="([^"]+)"/);
    
    if (!match || !match[1]) {
      return null;
    }

    const dataParts = match[1].split(',');
    
    if (dataParts.length < 10) {
      return null;
    }

    return {
      code: normalizedCode.toUpperCase(),
      name: dataParts[0],           // 股票名称
      price: parseFloat(dataParts[1]),
      change: parseFloat(dataParts[2]),
      changePct: parseFloat(dataParts[3]),
      marketCap: parseFloat(dataParts[45]),
    };
  } catch (error) {
    console.error('获取股票数据失败:', error);
    return null;
  }
}

// 调用Azure OpenAI API
async function callAzureOpenAI(messages: any[], temperature: number = 0.7, maxTokens: number = 2000) {
  try {
    const response = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
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

// 聊天API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, message, history } = body;

    // 获取专家配置
    const expert = expertsConfig.experts.find(e => e.id === expertId);

    if (!expert) {
      return NextResponse.json({
        success: false,
        error: '专家不存在'
      }, { status: 404 });
    }

    // 自动提取并查询股票代码
    const stockCodes = extractStockCodes(message);
    let stockInfoContext = '';
    
    if (stockCodes.length > 0) {
      const uniqueCodes = [...new Set(stockCodes)];
      const stockDataPromises = uniqueCodes.slice(0, 3).map(code => getStockData(code));
      const stockResults = await Promise.all(stockDataPromises);
      
      const validStocks = stockResults.filter(s => s !== null);
      const notFoundStocks = uniqueCodes.filter((code, idx) => stockResults[idx] === null);
      
      if (validStocks.length > 0) {
        stockInfoContext = '\n\n【实时股票数据】\n';
        validStocks.forEach(stock => {
          if (stock) {
            stockInfoContext += `- ${stock.code}: ${stock.name} (当前价: ${stock.price}港元, 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元, ${stock.changePct}%)\n`;
          }
        });
        stockInfoContext += '请以上述实时数据为准回答用户问题。\n';
      }
      
      // 明确告知AI哪些股票查不到
      if (notFoundStocks.length > 0) {
        stockInfoContext += '\n【重要】以下股票代码未能在数据库中找到，请明确告知用户："抱歉，我无法识别该股票代码，请通过官方渠道（港交所披露易、 Bloomberg等）核实信息。"，切勿自行猜测公司名称！\n';
        notFoundStocks.forEach(code => {
          stockInfoContext += `- ${code}: 未找到数据\n`;
        });
      }
    }

    // 构建消息列表
    let systemPrompt = expert.systemPrompt;
    // 如果有股票信息，添加到系统提示中
    if (stockInfoContext) {
      systemPrompt += stockInfoContext;
    }
    
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史对话
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // 添加当前消息
    messages.push({ role: 'user', content: message });

    try {
      // 调用Azure OpenAI
      const aiResponse = await callAzureOpenAI(
        messages,
        expert.temperature,
        expert.maxTokens
      );

      return NextResponse.json({
        success: true,
        data: {
          expert: expert.name,
          response: aiResponse,
          timestamp: new Date().toISOString()
        }
      });
    } catch (aiError: any) {
      console.error('AI调用失败:', aiError);
      
      // 返回模拟响应（演示模式）
      return NextResponse.json({
        success: true,
        data: {
          expert: expert.name,
          response: getFallbackResponse(expertId, message),
          timestamp: new Date().toISOString(),
          isDemo: true
        },
        message: '演示模式（AI服务暂时不可用）'
      });
    }

  } catch (error: any) {
    console.error('Chat error:', error);

    return NextResponse.json({
      success: false,
      error: error.message || '聊天服务出现错误'
    }, { status: 500 });
  }
}

// 备用响应（当AI不可用时）
function getFallbackResponse(expertId: string, message: string): string {
  const responses: Record<string, string> = {
    'health-check': `感谢您的咨询！我是港股通体检专家。

根据您的问题"${message}"

我需要了解更多公司信息才能进行准确的体检分析。请您提供以下信息：

1. 公司名称和行业
2. 最近三年盈利情况（万港元）
3. 预计市值（亿港元）
4. 是否采用VIE架构
5. 控股股东持股比例

您可以通过首页的"港股通体检"功能，填写详细的表单信息，我将为您生成完整的体检报告。

或者您也可以继续描述您的问题，我会尽力为您解答港股通相关的专业知识。`,
    
    'ipo-analysis': `感谢您的咨询！我是招股书分析专家。

根据您的问题"${message}"

为了给您提供更准确的分析，请您提供以下信息：

1. 您想了解哪家公司或哪个IPO项目？
2. 是否已经有招股书文本？
3. 您关注的是投资价值还是风险评估？

您可以通过首页的"招股书分析"功能，上传招股书或输入公司名称，我将为您进行全面的分析。

请告诉我更多细节，我会为您提供专业的分析建议。`,
    
    'listing-path': `感谢您的咨询！我是上市路径规划专家。

根据您的问题"${message}"

为了给您制定合适的上市方案，请您提供：

1. 公司基本信息（名称、行业、成立时间）
2. 股权结构（是否已有外资股东）
3. 公司性质（国企/民企/外资）
4. 财务状况（盈利情况、市值预估）
5. 上市目标时间

我会根据您的情况，为您推荐最适合的上市路径，包括H股直接上市、VIE架构上市等方案。

请提供更多信息，我将为您详细规划。`,
    
    'compliance': `感谢您的咨询！我是合规审查专家。

根据您的问题"${message}"

为了帮您排查合规风险，请您提供：

1. 公司所在行业
2. 是否涉及外资准入限制
3. 过往是否存在监管处罚
4. 关联交易情况
5. 税务合规状况

我会根据您提供的信息，识别潜在的合规问题，并给出整改建议。

请告诉我更多详情。`,
    
    'valuation': `感谢您的咨询！我是估值定价专家。

根据您的问题"${message}"

为了给您提供准确的估值分析，请您提供：

1. 公司名称和行业
2. 盈利状况（最近三年净利润）
3. 预计募集资金规模
4. 可比上市公司（如有）
5. 业务模式和增长率

我会运用可比公司法、DCF现金流折现法等方法，为您提供估值参考区间。

请提供更多财务数据。`,
    
    'index-inclusion': `感谢您的咨询！我是指数纳入规划专家。

根据您的问题"${message}"

为了帮您规划MSCI和富时罗素指数的纳入路径，请您提供：

1. 公司当前市值（亿港元）
2. 日均成交金额
3. 是否已在香港上市
4. 外资持股比例
5. 您希望纳入的具体指数

我会根据您提供的信息，评估纳入可行性，并制定详细的时间线和准备方案。

请提供更多公司信息。`,

    'stock-connect-planning': `感谢您的咨询！我是入港股通规划专家。

根据您的问题"${message}"

为了帮您制定港股通纳入规划方案，请您提供：

1. 公司当前市值（亿港元）
2. 日均成交金额
3. 是否已在香港主板/创业板上市
4. 上市时间
5. 是否被纳入恒生综合指数

我会根据您的情况，评估入通可行性，并提供流动性提升策略和时间线规划。

请提供更多详细信息。`
  };

  return responses[expertId] || `感谢您的咨询！我是港股智通专家团队的一员。

根据您的问题："${message}"

请提供更多详细信息，我将为您提供专业的分析和建议。

您可以通过以下方式获得更详细的服务：
- 港股通体检：评估上市可行性
- 招股书分析：解读投资价值
- 上市规划：定制专属方案

期待为您提供更多帮助！`;
}
