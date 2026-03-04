'use client';

import { useState } from 'react';
import { Search, FileText, Activity, CreditCard, User, Menu, X, ChevronRight, TrendingUp, TrendingDown, Star, Clock, CheckCircle, AlertCircle, Users, Sparkles } from 'lucide-react';

// 模拟数据
const FEATURED_IPOS = [
  { id: 1, name: '美团', code: '3690.HK', date: '2024-02-02', price: '98.9', status: '已上市' },
  { id: 2, name: '小米', code: '1810.HK', date: '2018-07-09', price: '17.0', status: '已上市' },
  { id: 3, name: '阿里健康', code: '241.HK', date: '2024-02-06', price: '5.8', status: '已上市' },
];

export default function Home() {
  const [stockCode, setStockCode] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'health' | 'ipo' | 'profile'>('home');

  const handleSearch = () => {
    if (stockCode.trim()) {
      // 跳转到体检页面
      window.location.href = `/health-check?code=${stockCode}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-950">
      {/* 顶部导航 */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-xl font-bold text-primary-900">港股智通</span>
          </div>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-primary-900 font-medium">首页</a>
            <a href="#health" className="text-gray-600 hover:text-primary-900">港股通体检</a>
            <a href="#ipo" className="text-gray-600 hover:text-primary-900">招股书分析</a>
            <button className="flex items-center space-x-1 text-primary-900 font-medium">
              <User size={18} />
              <span>我的</span>
            </button>
          </nav>
        </div>

        {/* 移动端导航菜单 */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <nav className="flex flex-col p-4 space-y-3">
              <a href="#home" className="text-primary-900 font-medium py-2">首页</a>
              <a href="#health" className="text-gray-600 py-2">港股通体检</a>
              <a href="#ipo" className="text-gray-600 py-2">招股书分析</a>
              <button className="flex items-center space-x-2 text-primary-900 font-medium py-2">
                <User size={18} />
                <span>我的</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 首页部分 */}
        <section id="home" className="mb-16">
          {/* 欢迎语 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              您的港股IPO专家智囊团
            </h1>
            <p className="text-primary-100 text-lg">
              专为内地企业家打造的港股上市一站式服务平台
            </p>
          </div>

          {/* 搜索框 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <label className="block text-gray-700 font-medium mb-3">
              输入股票代码或公司名称，立即体检
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                placeholder="如：00700（腾讯控股）"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="btn-gradient text-white px-8 py-3 rounded-xl font-medium flex items-center space-x-2 hover:opacity-90 transition"
              >
                <Search size={20} />
                <span>体检</span>
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              支持港股代码（如00700、9988）或公司名称搜索
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 港股通体检 */}
            <div id="health" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition cursor-pointer" onClick={() => window.location.href = '/health-check'}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-gold-500 rounded-xl flex items-center justify-center">
                  <Activity className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">港股通体检</h3>
                  <p className="text-primary-100 text-sm">AI智能分析入通可行性</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  股权架构分析
                </li>
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  财务指标评估
                </li>
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  合规风险提示
                </li>
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  改进方案建议
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-gold-400 font-medium">限时优惠：¥49.9</span>
                <button className="text-white flex items-center space-x-1 hover:text-gold-400 transition">
                  <span>立即体验</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 招股书分析 */}
            <div id="ipo" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition cursor-pointer" onClick={() => window.location.href = '/ipo-analysis'}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center">
                  <FileText className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">招股书分析</h3>
                  <p className="text-primary-100 text-sm">AI解读招股书核心要点</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  商业模式解读
                </li>
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  保荐人记录
                </li>
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  基石投资者分析
                </li>
                <li className="flex items-center text-primary-50 text-sm">
                  <CheckCircle size={16} className="text-gold-400 mr-2" />
                  风险因素评估
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-gold-400 font-medium">限时优惠：¥29.9</span>
                <button className="text-white flex items-center space-x-1 hover:text-gold-400 transition">
                  <span>立即体验</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 热门IPO */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">热门IPO</h2>
            <button className="text-primary-100 text-sm hover:text-white">查看全部 →</button>
          </div>
          
          <div className="space-y-3">
            {FEATURED_IPOS.map((ipo) => (
              <div key={ipo.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between hover:bg-white/20 transition cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-gold-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{ipo.name}</h4>
                    <p className="text-primary-100 text-sm">{ipo.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">HK${ipo.price}</p>
                  <p className="text-primary-100 text-xs">{ipo.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 会员权益 */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">开通会员 尊享特权</h2>
            <p className="text-gold-100 mb-6">无限次体检、招股书分析、专业客服</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-gold-600 px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition">
                月卡 ¥199/月
              </button>
              <button className="bg-primary-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-800 transition">
                年卡 ¥1999/年（省¥590）
              </button>
            </div>
          </div>
        </section>

        {/* 专家团队入口 */}
        <section className="mb-16">
          <div 
            className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 cursor-pointer hover:from-primary-700 hover:to-primary-900 transition"
            onClick={() => window.location.href = '/experts'}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Users className="text-white" size={32} />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-white mb-2">港股IPO专家团队</h2>
                  <p className="text-primary-100">5位顶尖专家，为您提供全方位咨询服务</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Sparkles className="text-gold-400" size={16} />
                    <span className="text-gold-300 text-sm">港股通体检 · 招股书分析 · 上市规划 · 合规审查 · 估值定价</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-white" size={32} />
            </div>
          </div>
        </section>

        {/* 底部Tab栏（移动端） */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
          <div className="flex justify-around py-2">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'home' ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <Search size={20} />
              <span className="text-xs mt-1">首页</span>
            </button>
            <button 
              onClick={() => setActiveTab('health')}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'health' ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <Activity size={20} />
              <span className="text-xs mt-1">体检</span>
            </button>
            <button 
              onClick={() => setActiveTab('ipo')}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'ipo' ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <FileText size={20} />
              <span className="text-xs mt-1">IPO</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-2 px-4 ${activeTab === 'profile' ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <User size={20} />
              <span className="text-xs mt-1">我的</span>
            </button>
          </div>
        </div>

        {/* 底部padding */}
        <div className="h-24 md:hidden"></div>
      </main>

      {/* 底部 */}
      <footer className="bg-primary-950 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm">
            © 2024 港股智通（HK-Elite Insight）保留所有权利
          </p>
          <p className="text-primary-300 text-xs mt-2">
            本服务由香港持牌证券公司提供 · 投资有风险，入市需谨慎
          </p>
        </div>
      </footer>
    </div>
  );
}
