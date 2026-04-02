'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Send, Bot, User, Sparkles, RefreshCw, Copy, Check
} from 'lucide-react';

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  detectedStocks?: StockInfo[];
}

// 股票信息类型
interface StockInfo {
  code: string;
  name: string;
  nameEn: string;
  industry: string;
  price: number;
  change: number;
  changePct: number;
  marketCap?: number;
  turnover?: number;
}

// 专家类型
interface Expert {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  price: number;
  features?: string[];
}

// 图标映射
const iconMap: Record<string, React.ComponentType<any>> = {
  Activity: ({ className }: { className?: string }) => <Bot className={className} />,
  FileText: ({ className }: { className?: string }) => <Bot className={className} />,
  Map: ({ className }: { className?: string }) => <Bot className={className} />,
  Shield: ({ className }: { className?: string }) => <Bot className={className} />,
  TrendingUp: ({ className }: { className?: string }) => <Bot className={className} />,
  Globe: ({ className }: { className?: string }) => <Bot className={className} />,
  Route: ({ className }: { className?: string }) => <Bot className={className} />,
};

// 颜色映射
const colorMap: Record<string, { bg: string; border: string; text: string; gradient: string; button: string }> = {
  gold: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    gradient: 'from-amber-500/20 to-amber-600/10',
    button: 'from-amber-500 to-amber-600'
  },
  primary: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/30',
    text: 'text-primary-400',
    gradient: 'from-primary-500/20 to-primary-600/10',
    button: 'from-primary-500 to-primary-600'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/10',
    button: 'from-blue-500 to-blue-600'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    gradient: 'from-green-500/20 to-green-600/10',
    button: 'from-green-500 to-green-600'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-600/10',
    button: 'from-purple-500 to-purple-600'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-indigo-600/10',
    button: 'from-indigo-500 to-indigo-600'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    button: 'from-cyan-500 to-cyan-600'
  },
};

export default function ChatPage() {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [projectContent, setProjectContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 从URL获取专家ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expertId = params.get('expert');
    if (expertId) {
      fetchExpertDetail(expertId);
    }
  }, []);

  // 加载专家详情
  const fetchExpertDetail = async (expertId: string) => {
    try {
      const response = await fetch('/api/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertId })
      });
      const result = await response.json();
      if (result.success) {
        setExpert(result.data);
        // 添加欢迎消息
        addWelcomeMessage(result.data);
      }
    } catch (error) {
      console.error('加载专家详情失败:', error);
    }
  };

  // 添加欢迎消息
  const addWelcomeMessage = (expertData: Expert) => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是${expertData.name}。

${expertData.description}

我可以为您提供以下服务：
${expertData.features?.map(f => `• ${f}`).join('\n')}

请告诉我您的具体问题或需求，我将竭诚为您服务。`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !expert) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // 构建历史消息
      const history = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: expert.id,
          message: inputMessage,
          history,
          companyName,
          projectContent
        })
      });

      const result = await response.json();
      console.log('API响应:', JSON.stringify(result, null, 2));

      if (result.success && result.data?.response) {
        // AI调用成功
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.response,
          timestamp: new Date(),
          detectedStocks: result.data?.detectedStocks || []
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // AI调用失败，显示错误信息
        const errorInfo = result.data?.error || result.data?.response || 'AI服务暂时不可用';
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ AI服务暂时不可用\n\n${errorInfo}\n\n请稍后重试，或检查Azure OpenAI配置。`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('请求错误:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ 网络请求失败\n\n${error.message}\n\n请检查网络连接后重试。`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 复制消息
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 重新开始
  const handleRestart = () => {
    if (expert) {
      setMessages([]);
      setTimeout(() => addWelcomeMessage(expert), 100);
    }
  };

  const colors = expert ? (colorMap[expert.color] || colorMap.primary) : colorMap.primary;
  const IconComponent = expert ? (iconMap[expert.icon] || Bot) : Bot;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 to-primary-950 flex flex-col">
      {/* 头部导航 */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => window.location.href = '/experts'}
              className="flex items-center text-primary-900 hover:text-primary-600 transition"
            >
              <ChevronLeft size={20} />
              <span>返回</span>
            </button>
          </div>
          
          {expert && (
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${colors.bg} ${colors.border} border-2 rounded-xl flex items-center justify-center`}>
                <IconComponent className={colors.text} size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-900">{expert.name}</h1>
                <p className="text-xs text-gray-500">在线</p>
              </div>
            </div>
          )}

          <button 
            onClick={handleRestart}
            className="flex items-center text-gray-500 hover:text-primary-600 transition"
            title="重新开始"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* 头像 */}
                <div className={`
                  w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                  ${message.role === 'user' 
                    ? 'bg-primary-500 ml-3' 
                    : `${colors.bg} ${colors.border} border-2 mr-3`
                  }
                `}>
                  {message.role === 'user' ? (
                    <User className="text-white" size={20} />
                  ) : (
                    <IconComponent className={colors.text} size={20} />
                  )}
                </div>

                {/* 消息内容 */}
                <div className={`
                  relative rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-white/10 text-white rounded-bl-md border border-white/10'
                  }
                `}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    {message.content.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-1 last:mb-0">{line || <br />}</p>
                    ))}
                  </div>

                  {/* 股票信息卡片 */}
                  {message.role === 'assistant' && message.detectedStocks && message.detectedStocks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-xs text-gray-400 mb-2">识别到的股票：</div>
                      <div className="space-y-2">
                        {message.detectedStocks.map((stock, idx) => (
                          <div key={idx} className="bg-white/10 rounded-lg p-3 border border-white/10">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-bold text-white text-lg">{stock.name}</div>
                                <div className="text-xs text-gray-400">{stock.nameEn}</div>
                                <div className="text-xs text-gray-500 mt-1">{stock.industry}</div>
                                {stock.marketCap && stock.marketCap > 0 && (
                                  <div className="text-xs text-blue-300 mt-2">
                                    流动市值: {(stock.marketCap / 100000000).toFixed(2)}亿港元
                                  </div>
                                )}
                                {stock.turnover && stock.turnover > 0 && (
                                  <div className="text-xs text-gray-400">
                                    成交量: {(stock.turnover / 1000000).toFixed(2)}万股
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-gray-300">{stock.code}</div>
                                <div className="text-xl font-bold text-white mt-1">
                                  {stock.price > 0 ? `${stock.price}港元` : '暂无'}
                                </div>
                                {stock.price > 0 && (
                                  <div className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePct}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 复制按钮 */}
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                      title="复制"
                    >
                      {copiedId === message.id ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-gray-400" />
                      )}
</button>
                  )}

                  <div className={`
                    text-xs mt-2 ${message.role === 'user' ? 'text-primary-100' : 'text-gray-400'}
                  `}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 加载中 */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex">
                <div className={`w-10 h-10 ${colors.bg} ${colors.border} border-2 rounded-full flex items-center justify-center mr-3`}>
                  <IconComponent className={colors.text} size={20} />
                </div>
                <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 border border-white/10">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-primary-950 to-primary-900 p-4">
        <div className="max-w-3xl mx-auto">
          {/* 公司和项目输入行 */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="公司名称（选填）"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={projectContent}
              onChange={(e) => setProjectContent(e.target.value)}
              placeholder="项目/内容（选填）"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
              placeholder="输入您的问题..."
              disabled={loading}
              className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none placeholder-gray-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              className={`
                p-3 rounded-xl transition
                ${inputMessage.trim() && !loading
                  ? `bg-gradient-to-r ${colors.button} text-white hover:opacity-90`
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-gray-500 text-xs mt-2">
            <Sparkles className="inline w-3 h-3 mr-1" />
            AI生成的答案仅供参考，不构成投资建议
          </p>
        </div>
      </div>
    </div>
  );
}
