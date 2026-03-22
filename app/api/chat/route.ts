// 简化版chat API - 支持无API密钥模式
import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';
import stocksConfig from '../../config/hk-stocks.json';
import stockConnectKnowledge from '../../config/stock-connect-knowledge.json';

type StockConnectInfo = {
  name?: string;
  nameEn?: string;
  industry?: string;
  stockConnectStatus?: string;
  connectType?: string;
  hsciType?: string;
  inclusionDate?: string;
  notes?: string;
};

const stockConnectData = stockConnectKnowledge as { stocks?: Record<string, StockConnectInfo> };
const STOCK_CONNECT_MAP: Record<string, StockConnectInfo> = stockConnectData.stocks || {};

function getStockConnectInfo(stockCode: string): any {
  const normalizedCode = stockCode.toLowerCase().replace('.hk', '').replace(/^hk/, '');
  for (const [key, info] of Object.entries(STOCK_CONNECT_MAP)) {
    const keyCode = key.toLowerCase().replace('.hk', '').replace(/^hk/, '');
    if (keyCode === normalizedCode) {
      return {
        stockConnectStatus: info.stockConnectStatus || '未知',
        connectType: info.connectType || '',
        hsciType: info.hsciType || '',
        inclusionDate: info.inclusionDate || '',
        notes: info.notes || ''
      };
    }
  }
  return null;
}

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

// 检查API是否已配置
const isAzureConfigured = AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY;

type StockInfo = {
  name: string;
  nameEn: string;
  industry: string;
  listedDate?: string;
  stockConnectStatus?: string;
  connectType?: string;
  hsciType?: string;
  inclusionDate?: string;
};

const stocksData = stocksConfig as { stocks?: Record<string, StockInfo> };
const HK_STOCK_MAP: Record<string, StockInfo> = stocksData.stocks || {};

const FALLBACK_STOCK_MAP: Record<string, StockInfo> = {
  '00700': { name: '腾讯控股', nameEn: 'Tencent Holdings', industry: '互联网' },
  '09988': { name: '阿里巴巴-SW', nameEn: 'Alibaba Group', industry: '互联网' },
  '03690': { name: '美团-W', nameEn: 'Meituan', industry: '互联网' },
  '01810': { name: '小米集团-W', nameEn: 'Xiaomi Group', industry: '互联网' },
  '02418': { name: '京东集团-SW', nameEn: 'JD.com', industry: '互联网' },
  '02659': { name: '宝济药业-B', nameEn: 'BAO PHARMA-B', industry: '生物医药' },
  '02575': { name: '轩竹生物', nameEn: 'Xuanzhu Biotech', industry: '生物医药' },
  '02655': { name: '果下科技', nameEn: 'Guoxia Tech', industry: '科技' },
  '01877': { name: '百济神州', nameEn: 'BeiGene', industry: '生物医药' },
  '02269': { name: '药明生物', nameEn: 'WuXi Biologics', industry: '生物医药' },
  '06030': { name: '中信证券', nameEn: 'CITIC Securities', industry: '金融' },
  '02318': { name: '中国平安', nameEn: 'Ping An', industry: '保险' },
  '00981': { name: '中芯国际', nameEn: 'SMIC', industry: '半导体' },
  '09868': { name: '小鹏汽车-W', nameEn: 'XPeng', industry: '新能源汽车' },
  '09881': { name: '理想汽车-W', nameEn: 'Li Auto', industry: '新能源汽车' },
};

const COMBINED_STOCK_MAP = { ...HK_STOCK_MAP, ...FALLBACK_STOCK_MAP };

function normalizeStockCode(code: string): string {
  return code.toLowerCase().replace('.hk', '').replace(/^hk/, '');
}

// 获取本地股票信息
function getLocalStockInfo(stockCode: string): any {
  const normalizedCode = normalizeStockCode(stockCode);
  for (const [key, info] of Object.entries(COMBINED_STOCK_MAP)) {
    const keyCode = normalizeStockCode(key);
    if (keyCode === normalizedCode) {
      return { code: key, ...info };
    }
  }
  return null;
}

async function getStockDataFromAPI(stockCode: string): Promise<any> {
  const normalizedCode = normalizeStockCode(stockCode);
  
  // 首先尝试调用内部/stock API
  try {
    const internalUrl = `/api/stock?code=${normalizedCode}`;
    const internalResponse = await fetch(internalUrl, {
      next: { revalidate: 0 }
    });
    
    if (internalResponse.ok) {
      const internalData = await internalResponse.json();
      if (internalData.success) {
        const localInfo = getLocalStockInfo(stockCode);
        const connectInfo = getStockConnectInfo(stockCode);
        
        return {
          code: internalData.code?.toUpperCase() || normalizedCode.toUpperCase(),
          name: localInfo?.name || internalData.name || normalizedCode,
          nameEn: localInfo?.nameEn || internalData.nameEn || '',
          industry: localInfo?.industry || internalData.industry || '未知',
          price: internalData.price || 0,
          change: internalData.change || 0,
          changePct: typeof internalData.changePct === 'string' 
            ? parseFloat(internalData.changePct) 
            : (internalData.changePct || 0),
          volume: internalData.volume || 0,
          amount: 0,
          marketCap: internalData.marketCap || 0,
          marketCapText: internalData.marketCapText || null,
          floatMarketCapText: internalData.floatMarketCapText || null,
          turnover: internalData.volume || 0,
          source: internalData.source || 'internal',
          warning: internalData.warning || null,
          stockConnectStatus: connectInfo?.stockConnectStatus || null,
          connectType: connectInfo?.connectType || null,
          hsciType: connectInfo?.hsciType || null,
          inclusionDate: connectInfo?.inclusionDate || null
        };
      }
    }
  } catch (error) {
    console.log('内部API调用失败:', error);
  }
  
  // 如果内部API失败，返回本地数据
  const localInfo = getLocalStockInfo(stockCode);
  if (localInfo) {
    const connectInfo = getStockConnectInfo(stockCode);
    return {
      code: normalizedCode.toUpperCase(),
      name: localInfo.name,
      nameEn: localInfo.nameEn,
      industry: localInfo.industry,
      price: 0,
      change: 0,
      changePct: 0,
      volume: 0,
      amount: 0,
      marketCap: 0,
      marketCapText: null,
      floatMarketCapText: null,
      turnover: 0,
      source: 'local',
      stockConnectStatus: connectInfo?.stockConnectStatus || null,
      connectType: connectInfo?.connectType || null,
      hsciType: connectInfo?.hsciType || null,
      inclusionDate: connectInfo?.inclusionDate || null
    };
  }
  
  return null;
}

async function callAzureOpenAI(messages: any[], temperature: number = 0.7, maxTokens: number = 2000) {
  const finalMaxTokens = Math.max(maxTokens, 4000);
  
  const response = await fetch(AZURE_OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages: messages,
      temperature: temperature,
      max_tokens: finalMaxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAzureOpenAIWithFunctions(messages: any[], functions: any[], temperature: number, maxTokens: number) {
  return callAzureOpenAI(messages, temperature, maxTokens);
}

function extractStockCodes(text: string): string[] {
  const patterns = [
    /(\d{5})\.HK/gi,
    /HK(\d{5})/gi,
    /(\d{5})\.hk/gi,
    /hk(\d{5})/gi,
    /(\d{4})\.hk/gi,
  ];
  
  const codes: string[] = [];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      codes.push(match[1]);
    }
  }
  
  return [...new Set(codes)];
}

// 生成股票信息卡片文本
function generateStockCardText(stock: any): string {
  const priceText = stock.price > 0 
    ? `当前价格: ${stock.price}港元\n涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%)`
    : `当前价格: 暂无实时数据`;
  
  const marketCapText = stock.floatMarketCapText || stock.marketCapText || '暂无数据';
  const totalCapText = stock.marketCapText && stock.marketCapText !== stock.floatMarketCapText ? `\n总市值: ${stock.marketCapText}` : '';
  
  let connectInfo = '';
  if (stock.stockConnectStatus) {
    connectInfo = `\n港股通状态: ${stock.stockConnectStatus}`;
    if (stock.connectType) connectInfo += ` (${stock.connectType})`;
    if (stock.hsciType) connectInfo += `\n恒生综合指数: ${stock.hsciType}`;
    if (stock.inclusionDate) connectInfo += `\n纳入时间: ${stock.inclusionDate}`;
  }
  
  return `【${stock.name} (${stock.code})】
英文名称: ${stock.nameEn}
所属行业: ${stock.industry}
${priceText}
流动市值: ${marketCapText}${totalCapText}${connectInfo}`;
}

// 生成AI回复文本（无API模式）
function generateFallbackResponse(message: string, stockData: any[], expert: any): string {
  let response = `您好！我是${expert.name}。\n\n`;
  
  if (stockData.length > 0) {
    response += `根据您的查询，为您整理以下股票信息：\n\n`;
    
    stockData.forEach(stock => {
      response += generateStockCardText(stock) + '\n\n';
    });
    
    response += `---\n\n`;
  }
  
  // 根据专家类型添加相关建议
  if (expert.id === 'index-inclusion') {
    response += `【指数纳入规划建议】\n\n`;
    if (stockData.length > 0) {
      stockData.forEach(stock => {
        if (stock.price > 0) {
          response += `关于 ${stock.name} 的指数纳入可能性：\n\n`;
          
          // 根据市值判断
          const marketCapBillions = stock.marketCap / 100000000 / 1.03; // 转换为亿港元
          if (marketCapBillions >= 300) {
            response += `✅ 总市值约${marketCapBillions.toFixed(0)}亿港元，符合MSCI纳入的基本条件\n`;
            response += `✅ 建议关注恒生综合指数成分股的纳入时间窗口\n`;
            response += `✅ 做好流动性准备，确保日均成交额达标\n\n`;
          } else if (marketCapBillions >= 50) {
            response += `⚠️ 总市值约${marketCapBillions.toFixed(0)}亿港元，可能需要等待一段时间\n`;
            response += `💡 建议提升股票流动性，增加机构投资者关注\n`;
            response += `💡 关注港股通资格的获取，这对流动性有很大帮助\n\n`;
          } else {
            response += `⏳ 当前市值较小，短期内纳入大型指数的可能性较低\n`;
            response += `💡 建议先专注于提升公司业绩和市值\n\n`;
          }
          
          if (stock.stockConnectStatus === '已纳入') {
            response += `🎉 该股票已纳入港股通，可关注未来MSCI/富时罗素的纳入机会\n\n`;
        }
      });
    }
  } else if (expert.id === 'health-check') {
    response += `【港股通入通可行性分析】\n\n`;
    if (stockData.length > 0) {
      stockData.forEach(stock => {
        response += `${stock.name} 入通分析：\n`;
        const marketCapBillions = stock.marketCap / 100000000 / 1.03;
        
        if (marketCapBillions >= 50) {
          response += `✅ 市值条件：满足（${marketCapBillions.toFixed(0)}亿港元）\n`;
        } else {
          response += `❌ 市值条件：需提升（当前${marketCapBillions.toFixed(0)}亿港元，需50亿港元以上）\n`;
        }
        
        if (stock.stockConnectStatus === '已纳入') {
          response += `🎉 港股通状态：已纳入\n`;
        } else if (stock.stockConnectStatus === '待纳入') {
          response += `⏳ 港股通状态：待纳入\n`;
        } else {
          response += `📋 港股通状态：待评估\n`;
        }
        response += '\n';
      });
    }
  } else {
    response += `${expert.description}\n\n`;
    response += `请问您想了解哪方面的详细信息？`;
  }
  
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, message, history, companyName, projectContent } = body;
    
    if (!message || !expertId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const expert = (expertsConfig as any).experts?.find((e: any) => e.id === expertId);
    if (!expert) {
      return NextResponse.json({ error: '专家不存在' }, { status: 404 });
    }

    console.log('处理消息:', message);
    
    // 提取股票代码
    const stockCodes = extractStockCodes(message);
    let stockDataResults: any[] = [];
    
    if (stockCodes.length > 0) {
      const uniqueCodes = [...new Set(stockCodes)].slice(0, 3);
      const stockDataPromises = uniqueCodes.map(code => getStockDataFromAPI(code));
      const stockResults = await Promise.all(stockDataPromises);
      stockDataResults = stockResults.filter(s => s !== null);
    }
    
    let aiResponse = '';
    
    // 只有在API已配置时才调用Azure OpenAI
    if (isAzureConfigured) {
      let stockInfoContext = '';
      
      if (stockDataResults.length > 0) {
        stockInfoContext = `\n\n【股票数据查询结果 - 必须严格使用以下信息】\n`;
        stockDataResults.forEach(stock => {
          const priceInfo = stock.price > 0 
            ? `当前价: ${stock.price}港元, 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%)`
            : '当前价格: 暂无实时数据';
          
          let marketCapDisplay = '暂无数据';
          if (stock.floatMarketCapText) {
            marketCapDisplay = stock.floatMarketCapText;
          } else if (stock.marketCapText) {
            marketCapDisplay = stock.marketCapText;
          } else if (stock.marketCap && stock.marketCap > 0) {
            marketCapDisplay = (stock.marketCap / 100000000).toFixed(2) + '亿港元';
          }
          
          const connectStatus = stock.stockConnectStatus 
            ? `\n港股通状态: ${stock.stockConnectStatus} ${stock.connectType ? '(' + stock.connectType + ')' : ''}\n恒生综合指数类型: ${stock.hsciType || '未知'}\n纳入时间: ${stock.inclusionDate || '未知'}`
            : '';
            
          stockInfoContext += `股票代码: ${stock.code}
公司名称: ${stock.name}
英文名称: ${stock.nameEn}
所属行业: ${stock.industry}
${priceInfo}
流动市值: ${marketCapDisplay}${connectStatus}
---
`;
        });
        
        stockInfoContext += `【强制规则】\n1. 上述公司名称是唯一正确答案！\n2. 回答中必须包含上述股票代码和名称！\n`;
      }

      let systemPrompt = expert.systemPrompt;
      if (stockInfoContext) {
        systemPrompt += stockInfoContext;
      }
      
      systemPrompt += `\n\n【关键警告】\n1. 禁止根据记忆猜测！必须使用查询结果中的名称！\n2. 严禁编造公司名称！\n\n【专家身份】\n你是 ${expert.name}。${expert.description || ''}\n请用专业的口吻回答用户的问题。`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      if (history && Array.isArray(history)) {
        const recentHistory = history.slice(-10);
        recentHistory.forEach((msg: any) => {
          messages.push({ role: msg.role, content: msg.content });
        });
      }

      messages.push({ role: 'user', content: message });

      try {
        aiResponse = await callAzureOpenAIWithFunctions(
          messages,
          [],
          expert.temperature,
          expert.maxTokens
        );
      } catch (aiError: any) {
        console.error('AI调用失败:', aiError.message);
      }
    }
    
    // 如果AI没有返回响应（未配置API或调用失败），使用备用回复
    if (!aiResponse || aiResponse.trim() === '') {
      aiResponse = generateFallbackResponse(message, stockDataResults, expert);
    }

    // 返回给前端的完整股票数据
    const responseData: any = {
      expert: expert.name,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      detectedStocks: stockDataResults.map((stock: any) => ({
        code: stock.code,
        name: stock.name,
        nameEn: stock.nameEn,
        industry: stock.industry,
        price: stock.price || 0,
        change: stock.change || 0,
        changePct: stock.changePct || 0,
        marketCap: stock.marketCap || 0,
        marketCapText: stock.marketCapText || null,
        floatMarketCapText: stock.floatMarketCapText || null,
        turnover: stock.turnover || 0,
        source: stock.source,
        stockConnectStatus: stock.stockConnectStatus || null,
        connectType: stock.connectType || null,
        hsciType: stock.hsciType || null,
        inclusionDate: stock.inclusionDate || null
      }))
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('处理请求失败:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}
