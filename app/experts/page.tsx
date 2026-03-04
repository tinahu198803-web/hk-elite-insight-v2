'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, FileText, Map, Shield, TrendingUp, 
  ChevronLeft, CheckCircle, Sparkles, Globe, Route
} from 'lucide-react';

// 专家类型定义
interface Expert {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  features: string[];
  price: number;
  version: string;
}

// 图标组件映射
const iconMap: Record<string, React.ComponentType<any>> = {
  Activity,
  FileText,
  Map,
  Shield,
  TrendingUp,
  Globe,
  Route,
};

// 颜色映射
const colorMap: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  gold: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-600/10'
  },
  primary: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/30',
    text: 'text-primary-400',
    gradient: 'from-primary-500/20 to-primary-600/10'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/10'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    gradient: 'from-green-500/20 to-green-600/10'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-600/10'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-indigo-600/10'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-600/10'
  },
};

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载专家列表
  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      const response = await fetch('/api/experts');
      const result = await response.json();
      if (result.success) {
        setExperts(result.data);
        // 默认选择第一个
        if (result.data.length > 0) {
          setSelectedExpert(result.data[0]);
        }
      }
    } catch (error) {
      console.error('加载专家列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
  };

  const handleStartConsultation = () => {
    if (selectedExpert) {
      // 跳转到聊天页面，带上专家ID
      window.location.href = `/chat?expert=${selectedExpert.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>加载专家列表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-950">
      {/* 头部导航 */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center text-primary-900 hover:text-primary-600 transition"
          >
            <ChevronLeft size={20} />
            <span>返回</span>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold text-primary-900 mr-8">
            选择您的专属专家
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">港股IPO专家团队</h1>
          <p className="text-primary-100">选择最适合您的专家，获得专业指导</p>
        </div>

        {/* 专家列表 */}
        <div className="grid md:grid-cols-2 gap-4">
          {experts.map((expert) => {
            const IconComponent = iconMap[expert.icon] || Activity;
            const colors = colorMap[expert.color] || colorMap.primary;
            const isSelected = selectedExpert?.id === expert.id;

            return (
              <div
                key={expert.id}
                onClick={() => handleSelectExpert(expert)}
                className={`
                  relative p-6 rounded-2xl cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? `bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} scale-[1.02]` 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }
                `}
              >
                {/* 选择标记 */}
                {isSelected && (
                  <div className={`absolute top-4 right-4 ${colors.text}`}>
                    <CheckCircle size={24} />
                  </div>
                )}

                {/* 专家图标 */}
                <div className={`
                  w-14 h-14 ${colors.bg} ${colors.border} border-2 rounded-xl 
                  flex items-center justify-center mb-4
                `}>
                  <IconComponent className={colors.text} size={28} />
                </div>

                {/* 专家信息 */}
                <h3 className="text-xl font-bold text-white mb-2">{expert.name}</h3>
                <p className="text-primary-100 text-sm mb-4">{expert.description}</p>

                {/* 功能列表 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {expert.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-white/10 rounded-lg text-xs text-primary-50"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* 价格 */}
                <div className="flex items-center justify-between">
                  <span className={`${colors.text} font-bold text-lg`}>
                    ¥{expert.price}
                  </span>
                  <span className="text-primary-200 text-sm">
                    v{expert.version}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 开始咨询按钮 */}
        {selectedExpert && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-primary-950 to-transparent">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={handleStartConsultation}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white py-4 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition shadow-lg shadow-gold-500/20"
              >
                开始咨询 {selectedExpert.name}
              </button>
            </div>
          </div>
        )}

        {/* 底部padding */}
        <div className="h-24"></div>
      </main>
    </div>
  );
}
