import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';
import stocksConfig from '../../config/hk-stocks.json';

// Azure OpenAI 配置 - 使用环境变量
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';

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

// 获取股票数据 - 大小写不敏感匹配
async function getStockData(stockCode: string): Promise<any> {
  const normalizedCode = normalizeStockCode(stockCode);
  
  // 遍历合并后的映射表进行大小写不敏感匹配
  for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
    if (key.toLowerCase() === normalizedCode.toLowerCase()) {
      return {
        code: key.toUpperCase(),  // 保持原始格式显示
        name: info.name,
        nameEn: info.nameEn,
        industry: info.industry,
        price: 0,
        change: 0,
        changePct: 0,
        marketCap: 0,
        source: 'local'
      };
    }
  }
  
  // 尝试API获取实时数据
  const apiResult = await getStockDataFromAPI(stockCode);
  if (apiResult) {
    return apiResult;
  }
  
  // 如果都查不到，使用搜索API获取新股信息
  return searchStockData(stockCode);
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
