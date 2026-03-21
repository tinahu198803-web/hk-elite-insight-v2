// 简化版chat API - 只使用内部/stock API获取数据
// 注意：完整功能在/stock API中实现

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
    let stockInfoContext = '';
    
    if (stockCodes.length > 0) {
      const uniqueCodes = [...new Set(stockCodes)].slice(0, 3);
      const stockDataPromises = uniqueCodes.map(code => getStockDataFromAPI(code));
      const stockResults = await Promise.all(stockDataPromises);
      stockDataResults = stockResults.filter(s => s !== null);
      
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

    let aiResponse = '';
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

    if (!aiResponse || aiResponse.trim() === '') {
      aiResponse = `您好！我是${expert.name}。请问有什么可以帮您？`;
    }

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
        marketCapText: stock.floatMarketCapText || stock.marketCapText || null,
        source: stock.source
      }))
    };

    if (stockDataResults.length > 0) {
      const aiText = aiResponse || '';
      const aiSaysNoData = aiText.includes('没有此股票') || 
        aiText.includes('数据库中没有') ||
        aiText.includes('无法查询') ||
        aiText.length < 10;
      
      if (aiSaysNoData && stockDataResults.length > 0) {
        const stockCards = stockDataResults.map((stock: any) => {
          const priceText = stock.price > 0 
            ? `当前价格: ${stock.price}港元\n涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%)\n流动市值: ${stock.floatMarketCapText || stock.marketCapText || '暂无数据'}`
            : `当前价格: 暂无实时数据\n流动市值: ${stock.floatMarketCapText || stock.marketCapText || '暂无数据'}`;
          return `【股票信息】\n股票代码: ${stock.code}\n公司名称: ${stock.name}\n英文名称: ${stock.nameEn}\n所属行业: ${stock.industry}\n${priceText}`;
        }).join('\n\n');
        
        responseData.response = `您好！根据查询结果为您整理以下信息：\n\n${stockCards}\n\n如需更详细的分析，请告诉我具体想了解哪方面的信息。`;
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('处理请求失败:', error);
    return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
  }
}
