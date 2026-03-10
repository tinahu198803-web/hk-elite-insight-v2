import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';
import stocksConfig from '../../config/hk-stocks.json';

// Azure OpenAI 配置 - 使用环境变量
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

// 腾讯财经API基础URL
const TENCENT_FINANCE_API = 'https://qt.gtimg.cn/q=';

// 从外部JSON加载港股股票映射表
const HK_STOCK_MAP: Record<string, { name: string; nameEn: string; industry: string; listedDate?: string }> = 
  stocksConfig.stocks || {};

// 备用股票映射 - 确保基本股票能识别
const FALLBACK_STOCK_MAP: Record<string, { name: string; nameEn: string; industry: string }> = {
  '00700.hk': { name: '腾讯控股', nameEn: 'Tencent Holdings', industry: '互联网' },
  '09988.hk': { name: '阿里巴巴-SW', nameEn: 'Alibaba Group', industry: '互联网' },
  '03690.hk': { name: '美团-W', nameEn: 'Meituan', industry: '互联网' },
  '01810.hk': { name: '小米集团-W', nameEn: 'Xiaomi Group', industry: '互联网' },
  '02418.hk': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网' },
  '02659.hk': { name: '宝济药业-B', nameEn: 'Baoji Pharma', industry: '生物医药' },
  '06030.hk': { name: '中信证券', nameEn: 'CITIC Securities', industry: '金融' },
  '02318.hk': { name: '中国平安', nameEn: 'Ping An', industry: '保险' },
  '00981.hk': { name: '中芯国际', nameEn: 'SMIC', industry: '半导体' },
  '02628.hk': { name: '中国人寿', nameEn: 'China Life', industry: '保险' },
  '01398.hk': { name: '工商银行', nameEn: 'ICBC', industry: '银行' },
  '00939.hk': { name: '建设银行', nameEn: 'CCB', industry: '银行' },
  '03988.hk': { name: '中国银行', nameEn: 'BOC', industry: '银行' },
  '00005.hk': { name: '汇丰控股', nameEn: 'HSBC', industry: '银行' },
  '02333.hk': { name: '长城汽车', nameEn: 'Great Wall Motor', industry: '汽车' },
  '09868.hk': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源汽车' },
  '09881.hk': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源汽车' },
  '02219.hk': { name: '复星医药', nameEn: 'Fosun Pharma', industry: '医药' },
  '06677.hk': { name: '药明康德', nameEn: 'WuXi AppTec', industry: '医药' },
  '02269.hk': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '01928.hk': { name: '金沙中国', nameEn: 'Las Vegas Sands', industry: '博彩旅游' },
  '00027.hk': { name: '银河娱乐', nameEn: 'Galaxy Entertainment', industry: '博彩旅游' },
  '00388.hk': { name: '香港交易所', nameEn: 'HKEX', industry: '金融' },
  '01109.hk': { name: '华润置地', nameEn: 'CR Land', industry: '房地产' },
  '02020.hk': { name: '安踏体育', nameEn: 'ANTA Sports', industry: '消费' },
  '09999.hk': { name: '网易-S', nameEn: 'NetEase', industry: '互联网' },
  '09699.hk': { name: '携程集团-S', nameEn: 'Trip.com', industry: '互联网' },
  '02559.hk': { name: '快手-W', nameEn: 'Kuaishou', industry: '互联网' },
  '01877.hk': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药' },
  '00099.hk': { name: '中国通信服务', nameEn: 'China Communications Services', industry: '通信' },
  '02382.hk': { name: '舜宇光学科技', nameEn: 'Sunny Optical', industry: '光学' },
  '00002.hk': { name: '中电控股', nameEn: 'CLP Holdings', industry: '公用事业' },
  '00003.hk': { name: '香港中华煤气', nameEn: 'HK & China Gas', industry: '公用事业' },
  '00011.hk': { name: '恒生银行', nameEn: 'Hang Seng Bank', industry: '银行' },
  '00175.hk': { name: '吉利汽车', nameEn: 'Geely Automobile', industry: '汽车' },
  '00728.hk': { name: '中国电信', nameEn: 'China Telecom', industry: '通信' },
  '00998.hk': { name: '中银香港', nameEn: 'BOCHK', industry: '银行' },
  '03968.hk': { name: '招商银行', nameEn: 'CMB', industry: '银行' },
  '01919.hk': { name: '中远海控', nameEn: 'COSCO Shipping', industry: '航运' },
  '06690.hk': { name: '海尔智家', nameEn: 'Haier Smart Home', industry: '消费' },
  '00291.hk': { name: '华润啤酒', nameEn: 'CR Beer', industry: '消费' },
  '03606.hk': { name: '蒙牛乳业', nameEn: 'Mengniu Dairy', industry: '消费' },
  '01093.hk': { name: '石药集团', nameEn: 'CSPC Pharmaceutical', industry: '医药' },
  '06618.hk': { name: '京东健康', nameEn: 'JD Health', industry: '互联网医疗' },
  '01548.hk': { name: '金斯瑞生物科技', nameEn: 'GenScript Biotech', industry: '生物医药' },
  '01801.hk': { name: '信达生物', nameEn: 'Innovent Biologics', industry: '生物医药' },
  '09618.hk': { name: '百度集团-SW', nameEn: 'Baidu', industry: '互联网' },
  '02569.hk': { name: '再鼎医药', nameEn: 'Zai Lab', industry: '生物医药' },
  '09939.hk': { name: '康方生物', nameEn: 'Akeso', industry: '生物医药' },
  '01531.hk': { name: '康希诺生物', nameEn: 'CanSino Biologics', industry: '生物医药' },
};

// 合并两个数据源
const COMBINED_STOCK_MAP = { ...FALLBACK_STOCK_MAP, ...HK_STOCK_MAP };

// 港股股票代码规范化
function normalizeStockCode(code: string): string {
  let normalized = code.trim().toLowerCase();  // 改为小写
  if (normalized.endsWith('.hk')) {
    return normalized;
  }
  if (/^\d+$/.test(normalized)) {
    return `${normalized}.hk`;
  }
  return normalized;
}

// 提取消息中的股票代码 - 支持各种格式
function extractStockCodes(message: string): string[] {
  // 匹配各种格式的港股代码：00700.hk, 00700, 02659.hk, 02569.HK 等
  // 匹配4-5位数字，可选的.hk后缀（大小写不敏感）
  const stockCodePattern = /\b(0\d{4,5}(?:\.hk|\.HK)?)\b/gi;
  const matches = message.match(stockCodePattern) || [];
  
  // 过滤并标准化 - 移除点号和hk后缀，然后重新添加
  return matches
    .map(code => {
      // 移除所有非数字字符
      let cleaned = code.replace(/\D/g, '');
      // 保持前导零（港股代码需要）
      cleaned = cleaned.padStart(5, '0').slice(-5);
      return cleaned + '.hk';  // 统一使用小写
    })
    .filter(code => code.length === 6); // 格式如 02569.hk
}

// 获取股票数据 - 优先本地映射，确保名称准确
async function getStockData(stockCode: string): Promise<any> {
  const normalizedCode = normalizeStockCode(stockCode);
  let localInfo = null;
  
  // 1. 首先从本地映射获取公司名称（这是最准确的）
  for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
    if (key.toLowerCase() === normalizedCode.toLowerCase()) {
      localInfo = { code: key, ...info };
      break;
    }
  }
  
  // 2. 尝试从API获取实时数据
  const apiResult = await getStockDataFromAPI(stockCode);
  
  if (apiResult) {
    // 如果API成功，合并本地名称和API数据（以本地名称为准）
    return {
      code: apiResult.code,
      name: localInfo ? localInfo.name : apiResult.name, // 优先本地名称
      nameEn: localInfo ? localInfo.nameEn : apiResult.nameEn,
      industry: localInfo ? localInfo.industry : apiResult.industry,
      price: apiResult.price,
      change: apiResult.change,
      changePct: apiResult.changePct,
      marketCap: apiResult.marketCap,
      turnover: apiResult.turnover,
      source: 'realtime'
    };
  }
  
  // 3. 如果本地有记录但API失败，返回本地数据
  if (localInfo) {
    return {
      code: localInfo.code.toUpperCase(),
      name: localInfo.name,
      nameEn: localInfo.nameEn,
      industry: localInfo.industry,
      price: 0,
      change: 0,
      changePct: 0,
      marketCap: 0,
      turnover: 0,
      source: 'local'
    };
  }
  
  // 4. 完全查不到
  return null;
}

// 使用搜索API获取新股信息
async function searchStockData(stockCode: string) {
  try {
    // 提取纯数字代码
    const codeNum = stockCode.replace(/\D/g, '').replace(/^0+/, '') || stockCode;
    const searchUrl = `https://www.google.com/search?q=${codeNum}.hk+股票+港股`;
    
    // 这里我们返回null，让AI知道查不到并提示用户
    // 注意：在生产环境中，可以使用付费的股票API如Bloomberg、Wind等
    console.log(`股票代码 ${stockCode} 未找到，尝试搜索...`);
    return null;
  } catch (error) {
    console.error('搜索股票数据失败:', error);
    return null;
  }
}

// 从API获取股票数据
async function getStockDataFromAPI(stockCode: string) {
  try {
    // 规范化代码（移除.hk后缀用于API查询）
    const codeNum = stockCode.replace(/\.hk$/i, '').replace(/^0+/, '').padStart(5, '0');
    const url = `${TENCENT_FINANCE_API}${codeNum}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 } // 缓存60秒
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
    
    if (dataParts.length < 50) {
      return null;
    }

    // 腾讯API返回的数据
    const price = parseFloat(dataParts[1]) || 0;
    const change = parseFloat(dataParts[2]) || 0;
    const changePct = parseFloat(dataParts[3]) || 0;
    const marketCap = parseFloat(dataParts[45]) || 0; // 港股市值（单位：港币）
    const turnover = parseFloat(dataParts[38]) || 0; // 成交量
    
    // 优先从本地映射获取准确的公司名称
    const normalizedCode = normalizeStockCode(stockCode);
    let localInfo = null;
    for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
      if (key.toLowerCase() === normalizedCode.toLowerCase()) {
        localInfo = info;
        break;
      }
    }

    return {
      code: codeNum + '.HK',
      name: localInfo ? localInfo.name : dataParts[0], // 优先使用本地映射的公司名
      nameEn: localInfo ? localInfo.nameEn : '',
      industry: localInfo ? localInfo.industry : dataParts[57] || '未知',
      price: price,
      change: change,
      changePct: changePct,
      marketCap: marketCap, // 已经是港币
      turnover: turnover,
      source: 'realtime'
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

// 定义可用的函数 - 股票查询工具
const FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "get_stock_info",
      description: "获取港股股票的基本信息和实时行情数据。当用户询问任何关于港股股票的问题时，必须先调用此函数获取准确的股票信息。",
      parameters: {
        type: "object",
        properties: {
          stock_code: {
            type: "string",
            description: "港股股票代码，格式如 00700、09988、02659（不需要.hk后缀）"
          }
        },
        required: ["stock_code"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "check_stock_connect_eligibility",
      description: "检查港股股票是否符合港股通（南向）纳入条件。根据恒生综合指数成分股、市值门槛等规则进行判定。",
      parameters: {
        type: "object",
        properties: {
          stock_code: {
            type: "string",
            description: "港股股票代码"
          }
        },
        required: ["stock_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_hsi_eligibility", 
      description: "检查港股股票是否符合恒生指数（HSI）纳入条件。包括市值排名、行业代表性等要求。",
      parameters: {
        type: "object",
        properties: {
          stock_code: {
            type: "string",
            description: "港股股票代码"
          }
        },
        required: ["stock_code"]
      }
    }
  }
];

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

    // 预提取股票代码并查询数据（核心修复：先查数据，再问AI）
    const stockCodes = extractStockCodes(message);
    let stockDataResults: any[] = [];
    let stockInfoContext = '';
    
    if (stockCodes.length > 0) {
      const uniqueCodes = [...new Set(stockCodes)].slice(0, 3);
      
      // 并行查询所有股票数据
      const stockDataPromises = uniqueCodes.map(code => getStockData(code));
      const stockResults = await Promise.all(stockDataPromises);
      
      stockDataResults = stockResults.filter(s => s !== null);
      
      // 构建股票信息上下文（强制AI使用）
      if (stockDataResults.length > 0) {
        stockInfoContext = `\n\n【股票数据查询结果 - 必须严格使用以下信息，禁止编造】\n`;
        stockDataResults.forEach(stock => {
          const priceInfo = stock.price > 0 
            ? `当前价: ${stock.price}港元, 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%), 流动市值: ${(stock.marketCap / 100000000).toFixed(2)}亿港元`
            : '价格数据暂未获取';
            
          stockInfoContext += `股票代码: ${stock.code}
公司名称: ${stock.name}
英文名称: ${stock.nameEn}
所属行业: ${stock.industry}
${priceInfo}
---\n`;
        });
        
        stockInfoContext += `【强制规则 - 违反将被严厉处罚】\n`;
        stockInfoContext += `1. 上述公司名称是唯一正确答案！禁止使用任何其他名称！\n`;
        stockInfoContext += `2. 如果你之前说的名称与上述不同，必须立即更正并道歉！\n`;
        stockInfoContext += `3. 回答中必须包含上述股票代码和名称作为证据！\n`;
        stockInfoContext += `4. 如果用户问的是关于这些股票的问题，必须引用上述数据！\n`;
      }
    }

    // 构建系统提示
    let systemPrompt = expert.systemPrompt;
    if (stockInfoContext) {
      systemPrompt += stockInfoContext;
    }
    
    // 添加专家特定的系统提示
    systemPrompt += `\n\n【专家身份】\n你是 ${expert.name}。${expert.description || ''}\n请用专业的口吻回答用户的问题。`;

    // 构建消息列表
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史对话（只保留最近5轮）
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg: any) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // 添加当前消息
    messages.push({ role: 'user', content: message });

    // 调用Azure OpenAI（带Function Calling）
    try {
      const aiResponse = await callAzureOpenAIWithFunctions(
        messages,
        stockCodes.length > 0 ? FUNCTIONS : [],
        expert.temperature,
        expert.maxTokens
      );

      // 构建返回数据
      const responseData: any = {
        expert: expert.name,
        response: aiResponse,
        timestamp: new Date().toISOString()
      };

      // 始终返回股票信息（即使AI没有正确使用）
      if (stockDataResults.length > 0) {
        responseData.detectedStocks = stockDataResults.map((stock: any) => ({
          code: stock.code,
          name: stock.name,
          nameEn: stock.nameEn,
          industry: stock.industry,
          price: stock.price || 0,
          change: stock.change || 0,
          changePct: stock.changePct || 0,
          marketCap: stock.marketCap || 0
        }));
      }

      return NextResponse.json({
        success: true,
        data: responseData
      });
    } catch (aiError: any) {
      console.error('AI调用失败:', aiError);
      
      // 返回带股票数据的结果
      return NextResponse.json({
        success: true,
        data: {
          expert: expert.name,
          response: `抱歉，AI服务暂时不可用。但以下是您查询的股票信息：\n\n${
            stockDataResults.map(s => `【${s.code}】${s.name} (${s.nameEn})\n行业: ${s.industry}\n当前价: ${s.price > 0 ? s.price + '港元' : '暂无'}\n涨跌: ${s.price > 0 ? (s.change > 0 ? '+' : '') + s.change + '港元 (' + s.changePct + '%)' : '暂无'}\n`).join('\n')
          }\n\n如需完整分析，请稍后重试。`,
          timestamp: new Date().toISOString(),
          detectedStocks: stockDataResults,
          isDemo: true
        },
        message: 'AI服务暂时不可用，已返回基础股票数据'
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

// 调用Azure OpenAI API（支持Function Calling）
async function callAzureOpenAIWithFunctions(
  messages: any[], 
  functions: any[] = [],
  temperature: number = 0.7, 
  maxTokens: number = 2000
) {
  try {
    const requestBody: any = {
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    };

    // 如果有函数定义，添加到请求中
    if (functions.length > 0) {
      requestBody.tools = functions;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    
    // 如果AI调用了函数，处理函数调用结果
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // 添加助手的消息（包含函数调用）
      messages.push(assistantMessage);
      
      // 处理每个函数调用
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        let functionResult = '';
        
        if (functionName === 'get_stock_info') {
          const stockData = await getStockData(args.stock_code);
          functionResult = JSON.stringify(stockData);
        } else if (functionName === 'check_stock_connect_eligibility') {
          // 简化版入通资格检查
          const stockData = await getStockData(args.stock_code);
          functionResult = JSON.stringify({
            stock_code: args.stock_code,
            stock_name: stockData?.name || '未知',
            eligible: stockData?.marketCap >= 5000000000, // 50亿门槛
            market_cap: stockData?.marketCap || 0,
            threshold: 5000000000,
            note: '港股通纳入标准：恒生综合指数成分股且市值≥50亿港元'
          });
        } else if (functionName === 'check_hsi_eligibility') {
          const stockData = await getStockData(args.stock_code);
          functionResult = JSON.stringify({
            stock_code: args.stock_code,
            stock_name: stockData?.name || '未知',
            eligible: stockData?.marketCap >= 100000000000, // 1000亿大致门槛
            market_cap: stockData?.marketCap || 0,
            threshold: 100000000000,
            note: '恒生指数纳入标准：市值排名靠前，流动性充足'
          });
        }
        
        // 添加函数结果
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: functionResult
        });
      }
      
      // 再次调用AI，让它基于函数结果生成回答
      const secondResponse = await fetch(AZURE_OPENAI_ENDPOINT, {
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

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        throw new Error(`Azure OpenAI API error: ${secondResponse.status} - ${errorText}`);
      }

      const secondData = await secondResponse.json();
      return secondData.choices[0].message.content;
    }

    // 如果没有函数调用，直接返回内容
    return assistantMessage.content;
  } catch (error: any) {
    console.error('Azure OpenAI API error:', error);
    throw error;
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
