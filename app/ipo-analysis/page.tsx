'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, TrendingUp, Users, AlertTriangle, Download, Star, Clock, CheckCircle, Loader2, ChevronDown, ChevronUp, Share2 } from 'lucide-react';

// IPO数据
const IPO_LIST = [
  { id: 1, name: '美的集团', code: '0030.HK', date: '2024-02-20', status: '申购中', price: '54.8', minQty: 100, industry: '家电制造' },
  { id: 2, name: '地平线机器人', code: '9660.HK', date: '2024-02-15', status: '已上市', price: '4.1', minQty: 500, industry: '自动驾驶' },
  { id: 3, name: '麦士克', code: '2024-02-12', status: '待上市', price: '待定', minQty: 200, industry: '食品饮料' },
  { id: 4, name: '七云牛', code: '2024-02-08', status: '已上市', price: '15.6', minQty: 200, industry: '云计算' },
  { id: 5, name: '蚂蚁集团', code: '6688.HK', date: '2024-03', status: '待上市', price: '待定', minQty: 50, industry: '金融科技' },
];

type AnalysisData = {
  companyName: string;
  ipoDate: string;
  issuePrice: string;
  analysis: {
    商业模式: { summary: string; keyPoints: string[] };
    保荐人记录: { summary: string; sponsors: string[]; historicalPerformance: string };
    基石投资者: { summary: string; investors: { name: string; amount: string; lockup: string }[] };
    风险因素: { summary: string; risks: string[] };
  };
  recommendation: { score: number; summary: string };
};

export default function IPOAnalysisPage() {
  const [searchCode, setSearchCode] = useState('');
  const [selectedIPO, setSelectedIPO] = useState<typeof IPO_LIST[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    商业模式: true,
    保荐人记录: true,
    基石投资者: true,
    风险因素: true
  });

  // 选择公司时自动获取分析
  useEffect(() => {
    if (selectedIPO) {
      handleGetAnalysis(selectedIPO);
    }
  }, [selectedIPO]);

  const handleGetAnalysis = async (ipo: typeof IPO_LIST[0]) => {
    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/ipo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: ipo.name, companyCode: ipo.code })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        setError(data.error || '获取分析失败');
      }
    } catch (err: any) {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '申购中': return 'bg-green-100 text-green-700';
      case '已上市': return 'bg-blue-100 text-blue-700';
      case '待上市': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="/" className="text-white flex items-center text-sm mb-4">
            ← 返回首页
          </a>
          <h1 className="text-2xl font-bold text-white">招股书分析</h1>
          <p className="text-primary-100 text-sm mt-1">AI智能解读招股书核心要点</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* IPO列表 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">近期IPO</h2>
          </div>
          
          <div className="divide-y">
            {IPO_LIST.map((ipo) => (
              <div 
                key={ipo.id}
                className={`px-6 py-4 flex items-center justify-between cursor-pointer transition ${
                  selectedIPO?.id === ipo.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedIPO(ipo)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{ipo.name}</h3>
                    <p className="text-sm text-gray-500">{ipo.code} · {ipo.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ipo.status)}`}>
                    {ipo.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {ipo.price === '待定' ? '待定' : `HK$${ipo.price}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
</div>

        {/* 分析结果 */}
        {selectedIPO && (
          <div className="mb-24">
            {/* 加载状态 */}
            {isLoading && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Loader2 className="animate-spin w-12 h-12 text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600">AI正在分析招股书...</p>
              </div>
            )}

            {/* 分析报告 */}
            {!isLoading && analysis && (
              <>
                {/* 推荐评分 */}
                <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl shadow-xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-200 text-sm">AI推荐评分</p>
                      <div className="flex items-baseline mt-1">
                        <span className={`text-5xl font-bold ${getScoreColor(analysis.recommendation.score)}`}>
                          {analysis.recommendation.score}
                        </span>
                        <span className="text-2xl text-primary-200">/10</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center text-sm">
                        <Download size={16} className="mr-2" />
                        下载
                      </button>
                      <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center text-sm">
                        <Share2 size={16} className="mr-2" />
                        分享
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-primary-100">{analysis.recommendation.summary}</p>
                </div>

                {/* 详细分析 */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">详细分析</h2>
                  </div>

                  {/* 商业模式 */}
                  <div className="border-b">
                    <button
                      onClick={() => toggleSection('商业模式')}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-primary-600" size={20} />
                        <span className="font-medium">商业模式</span>
                      </div>
                      {expandedSections['商业模式'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections['商业模式'] && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 text-sm mb-3">{analysis.analysis.商业模式.summary}</p>
                        <div className="space-y-2">
                          {analysis.analysis.商业模式.keyPoints.map((point, idx) => (
                            <div key={idx} className="flex items-start text-sm">
                              <CheckCircle size={14} className="text-green-500 mr-2 mt-0.5" />
                              <span className="text-gray-700">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 保荐人记录 */}
                  <div className="border-b">
                    <button
                      onClick={() => toggleSection('保荐人记录')}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="text-gold-500" size={20} />
                        <span className="font-medium">保荐人记录</span>
                      </div>
                      {expandedSections['保荐人记录'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections['保荐人记录'] && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 text-sm mb-3">{analysis.analysis.保荐人记录.summary}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {analysis.analysis.保荐人记录.sponsors.map((sponsor, idx) => (
                            <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs">
                              {sponsor}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">
                          <strong>历史表现：</strong>{analysis.analysis.保荐人记录.historicalPerformance}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 基石投资者 */}
                  <div className="border-b">
                    <button
                      onClick={() => toggleSection('基石投资者')}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="text-purple-600" size={20} />
                        <span className="font-medium">基石投资者</span>
                      </div>
                      {expandedSections['基石投资者'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections['基石投资者'] && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 text-sm mb-3">{analysis.analysis.基石投资者.summary}</p>
                        <div className="space-y-2">
                          {analysis.analysis.基石投资者.investors.map((investor, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm">
                              <span className="font-medium">{investor.name}</span>
                              <div className="text-right">
                                <span className="text-gray-600 mr-2">{investor.amount}</span>
                                <span className="text-xs text-gray-400">锁{investor.lockup}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 风险因素 */}
                  <div>
                    <button
                      onClick={() => toggleSection('风险因素')}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={20} />
                        <span className="font-medium">风险因素</span>
                      </div>
                      {expandedSections['风险因素'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedSections['风险因素'] && (
                      <div className="px-6 pb-4">
<p className="text-gray-600 text-sm mb-3">{analysis.analysis.风险因素.summary}</p>
                        <div className="space-y-2">
                          {analysis.analysis.风险因素.risks.map((risk, idx) => (
                            <div key={idx} className="flex items-start text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                              <AlertTriangle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                              {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="text-center text-gray-500 text-sm mb-6">
                  <Clock size={14} className="inline mr-1" />
                  报告生成时间：{new Date().toLocaleString('zh-CN')}
                  {analysis.isMock && <span className="ml-2 text-yellow-600">（演示模式）</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* 无选择时的提示 */}
        {!selectedIPO && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-24">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">选择一家公司查看分析</h3>
            <p className="text-gray-500">点击上方列表中的公司，查看AI生成的招股书分析报告</p>
          </div>
        )}
      </div>
    </div>
  );
}
