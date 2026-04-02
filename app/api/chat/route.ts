// 简化版chat API - 完善的错误处理和fallback机制
import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';
import stocksConfig from '../../config/hk-stocks.json';
import stockConnectKnowledge from '../../config/stock-connect-knowledge.json';

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

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

// 从Supabase获取港股通数据（带缓存）
let stockConnectCache: Map<string, any> = new Map();
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

async function getStockConnectInfoFromDB(stockCode: string): Promise<any> {
  const normalizedCode = stockCode.toLowerCase().replace('.hk', '').replace(/^hk/, '').replace(/^0+/, '');
  
  // 检查缓存
  if (cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    const cached = stockConnectCache.get(normalizedCode);
    if (cached) return cached;
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/hk_stock_connect?stock_code=eq.${normalizedCode}&status=eq.active&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        next: { revalidate: 300 }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const record = {
          stockConnectStatus: data[0].connect_type === '南向' ? '已入通' : '未入通',
          connectType: data[0].connect_type || '',
          hsciType: data[0].hsci_type || '',
          inclusionDate: data[0].inclusion_date || '',
          notes: data[0].notes || ''
        };
        stockConnectCache.set(normalizedCode, record);
        cacheTime = Date.now();
        return record;
      }
    }
  } catch (error) {
    console.error('Supabase查询失败:', error);
  }
  
  return null;
}

// 本地备用数据
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

// 异步获取港股通信息（优先数据库，备用本地）
async function getStockConnectInfoAsync(stockCode: string): Promise<any> {
  // 1. 优先从数据库获取
  const dbInfo = await getStockConnectInfoFromDB(stockCode);
  if (dbInfo) return dbInfo;
  
  // 2. 备用本地数据
  return getStockConnectInfo(stockCode);
}

// Azure OpenAI 配置
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

// 构建完整的API URL
function getAzureOpenAIUrl(): string {
  const baseUrl = AZURE_OPENAI_ENDPOINT.replace(/\/$/, '');
  return `${baseUrl}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`;
}

// 检查API是否已配置
const isAzureConfigured = Boolean(AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY);

console.log('=== Azure OpenAI 配置检查 ===');
console.log('ENDPOINT:', AZURE_OPENAI_ENDPOINT ? '已设置' : '未设置');
console.log('API_KEY:', AZURE_OPENAI_API_KEY ? '已设置' : '未设置');
console.log('DEPLOYMENT:', AZURE_OPENAI_DEPLOYMENT);
console.log('isAzureConfigured:', isAzureConfigured);
console.log('=== 配置检查完成 ===');

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
  
  try {
    const internalUrl = `/api/stock?code=${normalizedCode}`;
    const internalResponse = await fetch(internalUrl, {
      next: { revalidate: 0 }
    });
    
    if (internalResponse.ok) {
      const internalData = await internalResponse.json();
      if (internalData.success) {
        const localInfo = getLocalStockInfo(stockCode);
        // 异步获取港股通信息（优先数据库）
        const connectInfo = await getStockConnectInfoAsync(stockCode);
        
        // ⚠️ 修复：优先使用本地名称，本地名称更准确
        const finalName = localInfo?.name || internalData.name || normalizedCode;
        
        return {
          code: internalData.code?.toUpperCase() || normalizedCode.toUpperCase(),
          name: finalName,
          nameEn: localInfo?.nameEn || internalData.nameEn || '',
          industry: localInfo?.industry || internalData.industry || '未知',
          price: internalData.price || 0,
          change: internalData.change || 0,
          changePct: typeof internalData.changePct === 'string' 
            ? parseFloat(internalData.changePct) 
            : (internalData.changePct || 0),
          volume: internalData.volume || 0,
          marketCap: internalData.marketCap || 0,
          marketCapText: internalData.marketCapText || null,
          floatMarketCapText: internalData.floatMarketCapText || null,
          source: internalData.source || 'internal',
          stockConnectStatus: connectInfo?.stockConnectStatus || null,
          connectType: connectInfo?.connectType || null,
          hsciType: connectInfo?.hsciType || null,
          inclusionDate: connectInfo?.inclusionDate || null,
          notes: connectInfo?.notes || null
        };
      }
    }
  } catch (error) {
    console.log('内部API调用失败:', error);
  }
  
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
      marketCap: 0,
      marketCapText: null,
      floatMarketCapText: null,
      source: 'local',
      stockConnectStatus: connectInfo?.stockConnectStatus || null,
      connectType: connectInfo?.connectType || null,
      hsciType: connectInfo?.hsciType || null,
      inclusionDate: connectInfo?.inclusionDate || null
    };
  }
  
  return null;
}

async function callAzureOpenAI(messages: any[], temperature: number = 0.7, maxTokens: number = 2000): Promise<string> {
  const apiUrl = getAzureOpenAIUrl();
  const finalMaxTokens = Math.max(maxTokens, 4000);
  
  console.log('=== Azure OpenAI API 调用开始 ===');
  console.log('URL:', apiUrl);
  console.log('Deployment:', AZURE_OPENAI_DEPLOYMENT);
  console.log('API_KEY前5位:', AZURE_OPENAI_API_KEY.substring(0, 5));
  console.log('API_KEY后5位:', AZURE_OPENAI_API_KEY.substring(AZURE_OPENAI_API_KEY.length - 5));
  console.log('API_KEY长度:', AZURE_OPENAI_API_KEY.length);
  console.log('Temperature:', temperature);
  console.log('MaxTokens:', finalMaxTokens);
  console.log('Messages count:', messages.length);
  
  const response = await fetch(apiUrl, {
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
  
  console.log('API响应状态:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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

function generateStockCardText(stock: any): string {
  const priceText = stock.price > 0 
    ? `当前价格: ${stock.price}港元\n涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%)`
    : `当前价格: 暂无实时数据`;
  
  const marketCapText = stock.floatMarketCapText || stock.marketCapText || '暂无数据';
  
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
流动市值: ${marketCapText}${connectInfo}`;
}

function generateExpertResponse(message: string, stockData: any[], expert: any): string {
  let response = `您好！我是${expert.name}。\n\n`;
  
  // 添加股票信息
  if (stockData.length > 0) {
    response += `根据您的查询，为您整理以下股票信息：\n\n`;
    
    stockData.forEach(stock => {
      response += generateStockCardText(stock) + '\n\n';
    });
    
    // 根据专家类型添加专业分析
    if (expert.id === 'index-inclusion') {
      response += `【指数纳入分析】\n\n`;
      stockData.forEach(stock => {
        const marketCapBillions = stock.marketCap / 100000000 / 1.03;
        
        response += `关于 ${stock.name} 的指数纳入可能性：\n`;
        
        if (marketCapBillions >= 300) {
          response += `✅ 总市值约${marketCapBillions.toFixed(0)}亿港元，符合MSCI纳入的基本条件\n`;
          response += `✅ 建议关注恒生综合指数成分股的纳入时间窗口\n`;
          response += `✅ 做好流动性准备，确保日均成交额达标\n\n`;
        } else if (marketCapBillions >= 50) {
          response += `⚠️ 总市值约${marketCapBillions.toFixed(0)}亿港元，可能需要等待一段时间\n`;
          response += `💡 建议提升股票流动性，增加机构投资者关注\n`;
          response += `💡 关注港股通资格的获取\n\n`;
        } else {
          response += `⏳ 当前市值较小，短期内纳入大型指数的可能性较低\n`;
          response += `💡 建议先专注于提升公司业绩和市值\n\n`;
        }
      });
    } else if (expert.id === 'health-check') {
      response += `【港股通入通可行性分析】\n\n`;
      stockData.forEach(stock => {
        const marketCapBillions = stock.marketCap / 100000000 / 1.03;
        
        response += `${stock.name} 入通分析：\n`;
        response += marketCapBillions >= 50 
          ? `✅ 市值条件：满足（${marketCapBillions.toFixed(0)}亿港元）\n`
          : `❌ 市值条件：需提升（当前${marketCapBillions.toFixed(0)}亿港元，需50亿港元以上）\n`;
        
        if (stock.stockConnectStatus === '已纳入') {
          response += `🎉 港股通状态：已纳入\n`;
        } else {
          response += `📋 港股通状态：待评估\n`;
        }
        response += '\n';
      });
    }
  }
  
  response += `请问您想了解哪方面的详细信息？`;
  
  return response;
}

// GET 端点用于诊断
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diagnose = searchParams.get('diagnose');
  
  if (diagnose === '1') {
    // 诊断模式 - 2024-03-25 强制刷新
    const keyFirst5 = AZURE_OPENAI_API_KEY?.substring(0, 5) || '';
    const keyLast5 = AZURE_OPENAI_API_KEY?.substring(AZURE_OPENAI_API_KEY.length - 5) || '';
    const expectedFirst5 = '4rNnn';
    const expectedLast5 = 'uHW1';
    const isKeyCorrect = keyFirst5 === expectedFirst5 && keyLast5 === expectedLast5;
    
    return NextResponse.json({
      diagnose: true,
      timestamp: new Date().toISOString(),
      endpoint: AZURE_OPENAI_ENDPOINT || '未设置',
      apiKeyFirst5: keyFirst5,
      apiKeyLast5: keyLast5,
      apiKeyLength: AZURE_OPENAI_API_KEY?.length || 0,
      expectedFirst5: expectedFirst5,
      expectedLast5: expectedLast5,
      isKeyCorrect: isKeyCorrect,
      deployment: AZURE_OPENAI_DEPLOYMENT,
      isConfigured: isAzureConfigured,
      buildUrl: getAzureOpenAIUrl()
    });
  }
  
  return NextResponse.json({ message: 'Chat API - Use POST method' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId, message, history } = body;
    
    console.log('收到请求:', { expertId, message: message?.substring(0, 50) });
    console.log('Azure配置状态:', { isAzureConfigured, endpoint: AZURE_OPENAI_ENDPOINT ? '已设置' : '未设置' });
    
    if (!message || !expertId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const expert = (expertsConfig as any).experts?.find((e: any) => e.id === expertId);
    if (!expert) {
      return NextResponse.json({ error: '专家不存在' }, { status: 404 });
    }

    // 提取股票代码
    const stockCodes = extractStockCodes(message);
    let stockDataResults: any[] = [];
    
    if (stockCodes.length > 0) {
      const uniqueCodes = [...new Set(stockCodes)].slice(0, 3);
      const stockDataPromises = uniqueCodes.map(code => getStockDataFromAPI(code));
      const stockResults = await Promise.all(stockDataPromises);
      stockDataResults = stockResults.filter(s => s !== null);
      
      console.log('获取到股票数据:', stockDataResults.length, '条');
    }
    
    let aiResponse = '';
    let aiErrorMessage = '';
    
    // 尝试调用Azure OpenAI
    if (isAzureConfigured) {
      try {
        let stockInfoContext = '';
        
        if (stockDataResults.length > 0) {
          stockInfoContext = `\n\n【股票数据查询结果 - 请务必使用以下实时数据】\n`;
          stockDataResults.forEach(stock => {
            const priceInfo = stock.price > 0 
              ? `当前价: ${stock.price}港元, 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change}港元 (${stock.changePct}%)`
              : '当前价格: 暂无实时数据';
            
            let marketCapDisplay = stock.floatMarketCapText || stock.marketCapText || '暂无数据';
            
            // 港股通状态信息
            const connectStatus = stock.stockConnectStatus || '待确认';
            const connectType = stock.connectType || '未明确';
            const hsciType = stock.hsciType || '未纳入';
            const inclusionDate = stock.inclusionDate || '待确认';
            
            stockInfoContext += `★ 股票代码: ${stock.code}
★ 公司名称: ${stock.name}
★ 英文名称: ${stock.nameEn}
★ 所属行业: ${stock.industry}
★ 价格信息: ${priceInfo}
★ 流动市值: ${marketCapDisplay}
★ 港股通状态: ${connectStatus}
★ 港股通类型: ${connectType}
★ 恒生综合指数: ${hsciType}
★ 纳入日期: ${inclusionDate}
---
`;
          });
          // 重要提示
          stockInfoContext += `\n⚠️ 重要提示：上述【港股通状态】和【纳入日期】为最新实时数据，请优先使用这些信息回答用户问题！\n`;
        }

        let systemPrompt = expert.systemPrompt || '';
        if (stockInfoContext) {
          systemPrompt += stockInfoContext;
        }
        
        systemPrompt += `\n\n【专家身份】\n你是 ${expert.name}。${expert.description || ''}\n请用专业的口吻回答用户的问题。`;

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

        aiResponse = await callAzureOpenAI(
          messages,
          expert.temperature || 0.7,
          expert.maxTokens || 2000
        );
        
        console.log('Azure OpenAI响应成功');
      } catch (aiError: any) {
        console.error('AI调用失败:', aiError.message);
        aiErrorMessage = aiError.message;
        // 明确记录错误，不再静默使用fallback
      }
    } else {
      aiErrorMessage = 'Azure OpenAI未正确配置（缺少API密钥或端点）';
      console.log('Azure OpenAI未配置');
    }
    
    // 如果没有AI回复，且有错误，返回错误信息而不是欢迎语
    if (!aiResponse || aiResponse.trim() === '') {
      console.log('AI调用失败，返回错误信息');
      
      const responseData: any = {
        success: false,
        data: {
          expert: expert.name,
          response: aiErrorMessage || 'AI服务暂时不可用，请稍后重试。',
          timestamp: new Date().toISOString(),
          error: aiErrorMessage,
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
            turnover: stock.volume || 0,
            source: stock.source
          }))
        }
      };

      console.log('返回错误响应');
      return NextResponse.json(responseData);
    }

    const responseData: any = {
      success: true,
      data: {
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
          turnover: stock.volume || 0,
          source: stock.source
        }))
      }
    };

    console.log('返回响应成功');
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('处理请求失败:', error);
    return NextResponse.json({ 
      success: false,
      data: {
        error: error.message || '服务器错误',
        response: '抱歉，服务暂时不可用。请稍后重试。'
      }
    }, { status: 500 });
  }
}
