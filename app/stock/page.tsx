'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface StockData {
  code: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  marketCap: number;
  marketCapText: string | null;
  floatMarketCap: number;
  floatMarketCapText: string | null;
  pe: number;
  timestamp: string;
}

export default function StockQueryPage() {
  const [stockCode, setStockCode] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<StockData[]>([]);

  // 常用港股代码示例
  const popularStocks = [
    { code: '00700.hk', name: '腾讯控股' },
    { code: '09988.hk', name: '阿里巴巴-SW' },
    { code: '02659.hk', name: '新程运通' },
    { code: '00981.hk', name: '中芯国际' },
    { code: '03690.hk', name: '美团-W' },
    { code: '01810.hk', name: '小米集团-W' },
  ];

  const queryStock = async (code: string) => {
    if (!code.trim()) {
      setError('请输入股票代码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/stock?code=${encodeURIComponent(code)}`);
      const result = await response.json();

      if (result.success) {
        setStockData(result.data);
        // 添加到历史记录
        setHistory(prev => {
          const newHistory = [result.data, ...prev.filter(s => s.code !== result.data.code)];
          return newHistory.slice(0, 10); // 保留最近10条
        });
      } else {
        setError(result.error || result.message || '查询失败');
        setStockData(null);
      }
    } catch (err: any) {
      setError('网络错误，请稍后重试');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryStock(stockCode);
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(decimals) + '亿';
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(decimals) + '万';
    }
    return num.toFixed(decimals);
  };

  const formatVolume = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">港股实时行情查询</h1>
              <p className="text-purple-300 text-sm mt-1">Stock Data Query</p>
            </div>
            <a 
              href="/experts" 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              返回专家列表
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 免责声明 */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-medium mb-1">数据免责声明</p>
              <p>本页面数据仅供参考，不构成任何投资建议。实际交易请以港交所官方披露为准。</p>
              <p className="mt-1 text-xs text-amber-300/70">
                数据来源：腾讯财经 | 官方核实渠道：https://www.hkexnews.hk
              </p>
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                placeholder="输入港股代码 (如: 00700, 00700.hk, 700)"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  查询中...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  查询
                </>
              )}
            </button>
          </form>

          {/* 热门股票 */}
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">热门股票：</p>
            <div className="flex flex-wrap gap-2">
              {popularStocks.map((stock) => (
                <button
                  key={stock.code}
                  onClick={() => {
                    setStockCode(stock.code);
                    queryStock(stock.code);
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                >
                  {stock.name} ({stock.code})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-red-300">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 股票数据展示 */}
        {stockData && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
            {/* 股票基本信息 */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">{stockData.name}</h2>
                <p className="text-gray-400 mt-1">{stockData.code.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">
                  ${stockData.price.toFixed(2)}
                </div>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  stockData.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stockData.change >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="text-xl font-medium">
                    {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} 
                    ({stockData.changePct >= 0 ? '+' : ''}{stockData.changePct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 关键指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">开盘价</p>
                <p className="text-white text-xl font-semibold mt-1">${stockData.open.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">昨收价</p>
                <p className="text-white text-xl font-semibold mt-1">${stockData.prevClose.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">最高价</p>
                <p className="text-green-400 text-xl font-semibold mt-1">${stockData.high.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">最低价</p>
                <p className="text-red-400 text-xl font-semibold mt-1">${stockData.low.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">成交量</p>
                <p className="text-white text-xl font-semibold mt-1">{formatVolume(stockData.volume)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">成交额</p>
                <p className="text-white text-xl font-semibold mt-1">${formatNumber(stockData.amount)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">总市值</p>
                <p className="text-white text-xl font-semibold mt-1">{stockData.marketCapText || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">流通市值</p>
                <p className="text-white text-xl font-semibold mt-1">{stockData.floatMarketCapText || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">市盈率</p>
                <p className="text-white text-xl font-semibold mt-1">{stockData.pe > 0 ? stockData.pe.toFixed(2) : 'N/A'}</p>
              </div>
            </div>

            {/* 更新时间 */}
            <div className="mt-4 text-right text-sm text-gray-400">
              数据更新时间：{new Date(stockData.timestamp).toLocaleString('zh-CN')}
            </div>

            {/* 快捷操作 */}
            <div className="mt-6 flex gap-4">
              <a
                href={`/chat?expert=index-inclusion&stock=${stockData.code}`}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-lg transition-colors"
              >
                咨询指数纳入规划
              </a>
              <a
                href={`/chat?expert=stock-connect-planning&stock=${stockData.code}`}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-center rounded-lg transition-colors"
              >
                咨询港股通规划
              </a>
              <a
                href={`/chat?expert=valuation&stock=${stockData.code}`}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg transition-colors"
              >
                咨询估值分析
              </a>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">查询历史</h3>
            <div className="space-y-2">
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setStockData(item)}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-gray-400 text-sm">{item.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white">${item.price.toFixed(2)}</span>
                    <span className={item.changePct >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 bg-white/5 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-2">使用说明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>支持多种格式输入：00700.hk、00700、hk00700</li>
                <li>点击热门股票可快速查询</li>
                <li>查询后可直接咨询相关专家进行深入分析</li>
                <li>数据延迟约15分钟，实际交易请以交易所为准</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
