// 股票数据测试页面
import { NextResponse } from 'next/server';

export async function GET() {
  const testResults: any = { timestamp: new Date().toISOString(), tests: [] };
  
  // 测试东方财富API
  try {
    const res = await fetch('https://push2.eastmoney.com/api/qt/stock/get?secid=116.02659&fields=f43,f57,f58,f107,f116,f117', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });
    const data = await res.json();
    testResults.tests.push({
      source: '东方财富API',
      status: data.data ? '成功' : '失败',
      data: data.data || null
    });
  } catch (e: any) {
    testResults.tests.push({ source: '东方财富API', status: '错误', error: e.message });
  }
  
  // 测试腾讯API
  try {
    const res = await fetch('https://qt.gtimg.cn/q=hk02659', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://gu.qq.com' },
      cache: 'no-store'
    });
    const text = await res.text();
    const match = text.match(/="([^"]+)"/);
    testResults.tests.push({
      source: '腾讯API',
      status: match ? '成功' : '失败',
      raw: text.substring(0, 100)
    });
  } catch (e: any) {
    testResults.tests.push({ source: '腾讯API', status: '错误', error: e.message });
  }
  
  return NextResponse.json(testResults);
}
