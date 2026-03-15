'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, MessageCircle, 
  Calendar, Download, RefreshCw, ChevronLeft,
  PieChart, Activity, ArrowUp, ArrowDown
} from 'lucide-react';

interface QuestionStats {
  total: number;
  byExpert: Record<string, number>;
  byWeek: Record<string, number>;
  byDate: Record<string, number>;
}

interface Question {
  id: string;
  expertId: string;
  expertName: string;
  question: string;
  answer: string;
  timestamp: string;
  date: string;
  week: string;
  userId: string;
}

const expertNames: Record<string, string> = {
  'health-check': '港股通体检专家',
  'ipo-analysis': '招股书分析专家',
  'listing-path': '上市路径规划专家',
  'compliance': '合规审查专家',
  'valuation': '估值定价专家',
  'index-inclusion': '指数纳入规划专家',
  'stock-connect-planning': '入港股通规划专家',
};

const expertColors: Record<string, string> = {
  'health-check': 'bg-amber-500',
  'ipo-analysis': 'bg-blue-500',
  'listing-path': 'bg-indigo-500',
  'compliance': 'bg-green-500',
  'valuation': 'bg-purple-500',
  'index-inclusion': 'bg-cyan-500',
  'stock-connect-planning': 'bg-pink-500',
};

export default function QuestionsAnalyticsPage() {
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 计算日期范围
      const now = new Date();
      let startDate = '';
      
      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      params.append('limit', '100');

      const response = await fetch(`/api/user-questions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  // 获取热门问题（按专家）
  const getTopExperts = () => {
    if (!stats?.byExpert) return [];
    return Object.entries(stats.byExpert)
      .sort(([, a], [, b]) => b - a)
      .map(([id, count]) => ({
        id,
        name: expertNames[id] || id,
        count,
        color: expertColors[id] || 'bg-gray-500'
      }));
  };

  // 获取最近趋势
  const getTrend = () => {
    if (!stats?.byDate) return { trend: 0, data: [] };
    
    const dates = Object.keys(stats.byDate).sort().slice(-7);
    const values = dates.map(d => stats.byDate[d]);
    
    if (values.length < 2) return { trend: 0, data: values };
    
    const recent = values.slice(-3).reduce((a, b) => a + b, 0);
    const previous = values.slice(-6, -3).reduce((a, b) => a + b, 0);
    
    const trend = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    return { trend, data: values };
  };

  const trend = getTrend();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-950">
      {/* 头部 */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center text-primary-900 hover:text-primary-600 transition"
            >
              <ChevronLeft size={20} />
              <span>返回</span>
            </button>
            <div className="ml-4 flex items-center">
              <BarChart3 className="text-primary-600 mr-2" size={24} />
              <h1 className="text-xl font-bold text-primary-900">用户咨询分析</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="week">最近一周</option>
              <option value="month">最近一个月</option>
              <option value="all">全部</option>
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center text-gray-600 hover:text-primary-600"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="animate-spin mx-auto text-white" size={40} />
            <p className="text-gray-400 mt-4">加载中...</p>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* 总咨询量 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">总咨询量</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <MessageCircle className="text-blue-400" size={24} />
                  </div>
                </div>
              </div>

              {/* 今日咨询 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">今日咨询</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats?.byDate?.[new Date().toISOString().split('T')[0]] || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="text-green-400" size={24} />
                  </div>
                </div>
              </div>

              {/* 趋势 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">周环比</p>
                    <p className={`text-3xl font-bold mt-1 ${trend.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trend.trend >= 0 ? '+' : ''}{trend.trend.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${trend.trend >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-xl flex items-center justify-center`}>
                    {trend.trend >= 0 ? (
                      <ArrowUp className="text-green-400" size={24} />
                    ) : (
                      <ArrowDown className="text-red-400" size={24} />
                    )}
                  </div>
                </div>
              </div>

              {/* 活跃专家 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">活跃专家</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {Object.keys(stats?.byExpert || {}).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Users className="text-purple-400" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* 专家咨询分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 饼图 - 专家分布 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <PieChart className="mr-2" size={20} />
                  专家咨询分布
                </h3>
                <div className="space-y-3">
                  {getTopExperts().map((expert, index) => (
                    <div key={expert.id} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${expert.color} mr-3`} />
                      <span className="text-gray-300 flex-1">{expert.name}</span>
                      <span className="text-white font-bold">{expert.count}</span>
                      <span className="text-gray-500 ml-2">
                        ({stats?.total ? ((expert.count / stats.total) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  ))}
                  {getTopExperts().length === 0 && (
                    <p className="text-gray-500 text-center py-8">暂无数据</p>
                  )}
                </div>
              </div>

              {/* 条形图 - 按日期 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  日咨询趋势
                </h3>
                <div className="flex items-end justify-between h-40 gap-2">
                  {Object.entries(stats?.byDate || {})
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-7)
                    .map(([date, count]) => {
                      const maxCount = Math.max(...Object.values(stats?.byDate || {}), 1);
                      const height = (count / maxCount) * 100;
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-500 hover:to-blue-300"
                            style={{ height: `${height}%`, minHeight: count > 0 ? '8px' : '0' }}
                          />
                          <span className="text-gray-500 text-xs mt-2">
                            {date.slice(5)}
                          </span>
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      );
                    })}
                </div>
                {Object.keys(stats?.byDate || {}).length === 0 && (
                  <p className="text-gray-500 text-center py-8">暂无数据</p>
                )}
              </div>
            </div>

            {/* 最近咨询列表 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-bold mb-4 flex items-center">
                <MessageCircle className="mr-2" size={20} />
                最近咨询
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questions.slice(0, 20).map((q) => (
                  <div 
                    key={q.id} 
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded text-xs text-white ${expertColors[q.expertId] || 'bg-gray-500'}`}>
                          {expertNames[q.expertId] || q.expertId}
                        </span>
                        <span className="text-gray-500 text-xs ml-3">
                          {q.date} {q.timestamp.split('T')[1]?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {q.question}
                    </p>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-gray-500 text-center py-8">暂无咨询记录</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
