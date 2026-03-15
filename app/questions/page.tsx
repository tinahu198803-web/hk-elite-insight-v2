'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, BarChart3, Users, MessageCircle, Calendar, 
  Download, RefreshCw, Search, Filter, Eye, TrendingUp
} from 'lucide-react';

// 问题记录类型
interface QuestionRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  expertId: string;
  expertName: string;
  question: string;
  answer: string;
  sessionId: string;
  timestamp: string;
  date: string;
  week: string;
  month: string;
}

// 统计数据类型
interface Stats {
  total: number;
  byExpert: Record<string, number>;
  byWeek: Record<string, number>;
  byDate: Record<string, number>;
}

export default function QuestionsDashboard() {
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRecord | null>(null);
  const [filterExpert, setFilterExpert] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user-questions?limit=500');
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤问题
  const filteredQuestions = questions.filter(q => {
    if (filterExpert && q.expertId !== filterExpert) return false;
    if (searchKeyword && !q.question.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  });

  // 导出CSV
  const exportCSV = () => {
    const headers = ['日期', '时间', '专家', '用户ID', '问题', '答案'];
    const rows = filteredQuestions.map(q => [
      q.date,
      new Date(q.timestamp).toLocaleTimeString(),
      q.expertName,
      q.userId,
      q.question.replace(/"/g, '""'),
      q.answer ? q.answer.replace(/"/g, '""') : ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `用户问题_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // 生成周报
  const generateReport = async () => {
    try {
      const res = await fetch('/api/weekly-report', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`周报生成成功！\n周次: ${data.report?.week}\n问题数: ${data.report?.overview?.totalQuestions}\n用户数: ${data.report?.overview?.uniqueUsers}`);
      }
    } catch (error) {
      console.error('生成周报失败:', error);
    }
  };

  // 专家颜色映射
  const expertColors: Record<string, string> = {
    'health-check': 'bg-amber-500',
    'ipo-analysis': 'bg-blue-500',
    'listing-path': 'bg-indigo-500',
    'compliance': 'bg-green-500',
    'valuation': 'bg-purple-500',
    'index-inclusion': 'bg-cyan-500',
    'stock-connect-planning': 'bg-pink-500',
  };

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
              <h1 className="text-xl font-bold text-primary-900">用户问题分析后台</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateReport}
              className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
            >
              <TrendingUp size={16} className="mr-1" />
              生成周报
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              <Download size={16} className="mr-1" />
              导出CSV
            </button>
            <button
              onClick={loadData}
              className="flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">总问题数</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <MessageCircle className="text-primary-400" size={32} />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">本周问题</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.byDate[Object.keys(stats.byDate).pop() || ''] || 0}
                  </p>
                </div>
                <Calendar className="text-amber-400" size={32} />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">活跃专家</p>
                  <p className="text-2xl font-bold text-white">{Object.keys(stats.byExpert).length}</p>
                </div>
                <Users className="text-green-400" size={32} />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">热门专家</p>
                  <p className="text-lg font-bold text-white">
                    {Object.entries(stats.byExpert).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
                  </p>
                </div>
                <Filter className="text-purple-400" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* 筛选栏 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索问题关键词..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={filterExpert}
              onChange={(e) => setFilterExpert(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
            >
              <option value="">全部专家</option>
              <option value="health-check">港股通体检专家</option>
              <option value="ipo-analysis">招股书分析专家</option>
              <option value="listing-path">上市路径规划专家</option>
              <option value="compliance">合规审查专家</option>
              <option value="valuation">估值定价专家</option>
              <option value="index-inclusion">指数纳入规划专家</option>
              <option value="stock-connect-planning">入港股通规划专家</option>
            </select>
          </div>
        </div>

        {/* 问题列表 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
              加载中...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              暂无问题记录
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredQuestions.slice(0, 100).map((q) => (
                <div 
                  key={q.id} 
                  className="p-4 hover:bg-white/5 cursor-pointer transition"
                  onClick={() => setSelectedQuestion(q)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${expertColors[q.expertId] || 'bg-gray-500'}`}>
                          {q.expertName}
                        </span>
                        <span className="text-gray-400 text-xs">{q.date} {new Date(q.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-white text-sm line-clamp-2">{q.question}</p>
                      {q.userEmail && (
                        <p className="text-gray-500 text-xs mt-1">用户: {q.userEmail}</p>
                      )}
                    </div>
                    <Eye className="text-gray-400 flex-shrink-0" size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {filteredQuestions.length > 100 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              显示前100条，共{filteredQuestions.length}条
            </div>
          )}
        </div>
      </div>

      {/* 问题详情弹窗 */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="p-4 border-b border-white/20 flex items-center justify-between sticky top-0 bg-primary-900">
              <div>
                <span className={`px-2 py-0.5 rounded text-xs text-white ${expertColors[selectedQuestion.expertId] || 'bg-gray-500'}`}>
                  {selectedQuestion.expertName}
                </span>
                <p className="text-gray-400 text-xs mt-1">{selectedQuestion.date} {new Date(selectedQuestion.timestamp).toLocaleTimeString()}</p>
              </div>
              <button 
                onClick={() => setSelectedQuestion(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-gray-400 text-sm mb-1">用户问题</h3>
                <p className="text-white">{selectedQuestion.question}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm mb-1">AI回答</h3>
                <p className="text-white text-sm whitespace-pre-wrap">{selectedQuestion.answer}</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs">
                  用户ID: {selectedQuestion.userId} | 
                  邮箱: {selectedQuestion.userEmail || '-'} | 
                  姓名: {selectedQuestion.userName || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
