// 股票API诊断端点 - 用于测试各数据源是否正常
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '02659';
  
  const results: any = { code, timestamp: new Date().toISOString(), sources: {} };
  
  // 1. 测试腾讯财经API
  try {
    const codeNum = code.replace(/\D/g, '').padStart(5, '0');
    const url = `https://qt.gtimg.cn/q=hk${codeNum}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://gu.qq.com'
      },
      cache: 'no-store'
    });
    
    const text = await res.text();
    results.sources.tencent = {
      status: res.status,
      ok: res.ok,
      textLength: text.length,
      textPreview: text.substring(0, 200),
      parsed: null as any
    };
    
    if (res.ok && text.includes('="')) {
      const match = text.match(/="([^"]+)"/);
      if (match) {
        const parts = match[1].split('~');
        results.sources.tencent.parsed = {
          partsCount: parts.length,
          name: parts[1] || '',
          price: parts[3] || 'N/A',
          prevClose: parts[4] || 'N/A',
          volume: parts[6] || 'N/A',
          marketCap: parts[45] || 'N/A'
        };
      }
    }
  } catch (e: any) {
    results.sources.tencent = { error: e.message };
  }
  
  // 2. 测试Yahoo Finance API
  try {
    const codeNum = code.replace(/\D/g, '').padStart(5, '0');
    const symbol = `${codeNum}.HK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });
    
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    
    results.sources.yahoo = {
      status: res.status,
      ok: res.ok,
      data: meta ? {
        symbol: meta.symbol,
        price: meta.regularMarketPrice,
        prevClose: meta.previousClose,
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap
      } : null
    };
  } catch (e: any) {
    results.sources.yahoo = { error: e.message };
  }
  
  // 3. 测试东方财富API
  try {
    const codeNum = code.replace(/\D/g, '').padStart(5, '0');
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${codeNum}&fields=f43,f57,f58,f107,f47,f48`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com'
      },
      cache: 'no-store'
    });
    
    const data = await res.json();
    results.sources.eastmoney = {
      status: res.status,
      ok: res.ok,
      data: data?.data || null
    };
  } catch (e: any) {
    results.sources.eastmoney = { error: e.message };
  }
  
  return NextResponse.json(results);
}
