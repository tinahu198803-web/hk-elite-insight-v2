'use client';

import { useState, useEffect } from 'react';
import { Users, ChevronRight, Sparkles, Activity, FileText, Map, Shield, TrendingUp, Globe, Route } from 'lucide-react';

// 专家列表（8个）
const EXPERTS = [
  { id: 'health-check', name: '港股通体检专家', icon: 'Activity', desc: '入通可行性评估' },
  { id: 'ipo-analysis', name: '招股书分析专家', icon: 'FileText', desc: '招股书核心解读' },
  { id: 'listing-path', name: '上市路径规划', icon: 'Map', desc: '量身定制方案' },
  { id: 'compliance', name: '合规审查专家', icon: 'Shield', desc: '风险全面排查' },
  { id: 'valuation', name: '估值定价专家', icon: 'TrendingUp', desc: '专业估值分析' },
  { id: 'index-inclusion', name: '指数纳入规划', icon: 'Globe', desc: 'MSCI/富时纳入' },
  { id: 'stock-connect', name: '入港股通规划', icon: 'Route', desc: '港股通纳入策略' },
  { id: 'market-cap', name: '市值维护专家', icon: 'TrendingUp', desc: '流动性管理' },
];

const iconComponents: Record<string, any> = {
  Activity, FileText, Map, Shield, TrendingUp, Globe, Route
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExpertClick = (expertId: string) => {
    window.location.href = `/chat?expert=${expertId}`;
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
            <span className="text-xl font-bold text-primary-900">港股IPO专家</span>
          </div>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <span>✕</span> : <span>☰</span>}
          </button>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-primary-900 font-medium">首页</a>
            <a href="/experts" className="text-gray-600 hover:text-primary-900">专家团队</a>
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 欢迎语 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            港股IPO专家智囊团
          </h1>
          <p className="text-primary-100 text-lg">
            8位顶尖专家 · 专为内地企业家打造
          </p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <Sparkles className="text-gold-400" size={20} />
            <span className="text-gold-300">港股通体检 · 招股书分析 · 上市规划 · 合规审查 · 估值定价</span>
          </div>
        </div>

        {/* 专家卡片网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {EXPERTS.map((expert, index) => {
            const IconComponent = iconComponents[expert.icon] || Activity;
            const colors = [
              'from-amber-500 to-amber-600',
              'from-blue-500 to-blue-600',
              'from-green-500 to-green-600',
              'from-purple-500 to-purple-600',
              'from-pink-500 to-pink-600',
              'from-indigo-500 to-indigo-600',
              'from-cyan-500 to-cyan-600',
              'from-orange-500 to-orange-600',
            ][index];
            
            return (
              <div
                key={expert.id}
                onClick={() => handleExpertClick(expert.id)}
                className={`
                  bg-white/10 backdrop-blur-sm border border-white/20 
                  rounded-2xl p-6 cursor-pointer transition-all duration-300
                  hover:scale-105 hover:bg-white/20 hover:border-white/30
                `}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${colors} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                  <IconComponent className="text-white" size={28} />
                </div>
                <h3 className="text-white font-bold text-center mb-1">{expert.name}</h3>
                <p className="text-primary-200 text-xs text-center">{expert.desc}</p>
              </div>
            );
          })}
        </div>

        {/* 查看全部专家 */}
        <div className="text-center">
          <button 
            onClick={() => window.location.href = '/experts'}
            className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl transition"
          >
            <Users size={20} />
            <span>查看完整专家介绍</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </main>

      {/* 底部 */}
      <footer className="bg-primary-950 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm">
            © 2026 港股IPO专家系统保留所有权利
          </p>
          <p className="text-primary-300 text-xs mt-2">
            投资有风险，入市需谨慎
          </p>
        </div>
      </footer>
    </div>
  );
}
