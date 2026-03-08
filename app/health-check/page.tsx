'use client';

import { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Shield,
  DollarSign,
  Building
} from 'lucide-react';

interface HealthCheckResult {
  overallScore: number;
  summary: string;
  details: {
    财务指标: { status: string; score: number; issues: string[]; details: string };
    股权架构: { status: string; score: number; issues: string[]; details: string };
    合规要求: { status: string; score: number; issues: string[]; details: string };
    市值达标: { status: string; score: number; issues: string[]; details: string };
  };
  recommendations: { priority: string; category: string; suggestion: string }[];
}

export default function HealthCheckPage() {
  const [companyName, setCompanyName] = useState('');
  const [stockCode, setStockCode] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [revenue, setRevenue] = useState('');
  const [profit, setProfit] = useState('');
  const [cashFlow, setCashFlow] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      setError('请输入公司名称');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          stockCode,
          marketCap: marketCap ? parseFloat(marketCap) : undefined,
          revenue: revenue ? parseFloat(revenue) : undefined,
          profit: profit ? parseFloat(profit) : undefined,
          cashFlow: cashFlow ? parseFloat(cashFlow) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '体检分析失败，请稍后重试');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'fail':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'fail':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="/" className="text-white flex items-center text-sm mb-4 hover:text-primary-200">
            <ArrowLeft size={16} className="mr-1" />
            返回首页
          </a>
          <h1 className="text-2xl font-bold text-white">港股通体检</h1>
          <p className="text-primary-100 text-sm mt-1">输入公司信息，AI专家为您进行入通可行性分析</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">公司基本信息</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公司名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例如：美团"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                股票代码（选填）
              </label>
              <input
                type="text"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                placeholder="例如：3690.HK"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                市值（亿港元，选填）
              </label>
              <input
                type="number"
                value={marketCap}
                onChange={(e) => setMarketCap(e.target.value)}
                placeholder="例如：5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年收入（亿港元，选填）
              </label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="例如：50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年利润（亿港元，选填）
              </label>
              <input
                type="number"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                placeholder="例如：10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                三年累计现金流（亿港元，选填）
              </label>
              <input
                type="number"
                value={cashFlow}
                onChange={(e) => setCashFlow(e.target.value)}
                placeholder="例如：5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  AI分析中，请稍候...
                </>
              ) : (
                <>
                  <Send className="mr-2" size={20} />
                  开始港股通体检
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            {/* Score */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4">
                <span className="text-3xl font-bold text-white">{result.overallScore}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">体检得分</h2>
              <p className="text-gray-600 mt-2">{result.summary}</p>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-800">详细分析</h3>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <TrendingUp className="text-primary-600 mr-2" size={20} />
                    <span className="font-medium">财务指标</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(result.details.财务指标.status)}
                    <span className="ml-2 font-bold">{result.details.财务指标.score}分</span>
                  </div>
                </div>
                {result.details.财务指标.details && (
                  <p className="text-sm text-gray-600 mt-2">{result.details.财务指标.details}</p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Building className="text-primary-600 mr-2" size={20} />
                    <span className="font-medium">股权架构</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(result.details.股权架构.status)}
                    <span className="ml-2 font-bold">{result.details.股权架构.score}分</span>
                  </div>
                </div>
                {result.details.股权架构.details && (
                  <p className="text-sm text-gray-600 mt-2">{result.details.股权架构.details}</p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Shield className="text-primary-600 mr-2" size={20} />
                    <span className="font-medium">合规要求</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(result.details.合规要求.status)}
                    <span className="ml-2 font-bold">{result.details.合规要求.score}分</span>
                  </div>
                </div>
                {result.details.合规要求.details && (
                  <p className="text-sm text-gray-600 mt-2">{result.details.合规要求.details}</p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <DollarSign className="text-primary-600 mr-2" size={20} />
                    <span className="font-medium">市值达标</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(result.details.市值达标.status)}
                    <span className="ml-2 font-bold">{result.details.市值达标.score}分</span>
                  </div>
                </div>
                {result.details.市值达标.details && (
                  <p className="text-sm text-gray-600 mt-2">{result.details.市值达标.details}</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">改进建议</h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority === 'high' ? '高' : rec.priority === 'medium' ? '中' : '低'}
                        </span>
                        <span className="ml-2 font-medium text-gray-700">{rec.category}</span>
                      </div>
                      <p className="text-sm text-gray-600">{rec.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-center py-4 mb-8">
          <p className="text-gray-500 text-sm">本服务仅供参考，不构成投资建议。投资有风险，入市需谨慎。</p>
        </div>
      </div>
    </div>
  );
}
