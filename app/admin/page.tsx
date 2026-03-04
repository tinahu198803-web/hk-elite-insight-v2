'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Save, Copy, Check, RefreshCw, ChevronLeft, 
  Activity, FileText, Map, Shield, TrendingUp, Eye, EyeOff, Globe, Route
} from 'lucide-react';

// 专家类型定义
interface Expert {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  price: number;
  features: string[];
  isActive: boolean;
  version: string;
  lastUpdated: string;
}

// 图标映射
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
const colorMap: Record<string, { bg: string; border: string; text: string; button: string }> = {
  gold: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-400', button: 'bg-amber-500' },
  primary: { bg: 'bg-primary-500', border: 'border-primary-500', text: 'text-primary-400', button: 'bg-primary-500' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', button: 'bg-blue-500' },
  green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', button: 'bg-green-500' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400', button: 'bg-purple-500' },
  indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-400', button: 'bg-indigo-500' },
  cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-400', button: 'bg-cyan-500' },
};

export default function AdminPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedTemperature, setEditedTemperature] = useState(0.7);
  const [editedMaxTokens, setEditedMaxTokens] = useState(2000);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [saved, setSaved] = useState(false);

  // 加载专家配置
  useEffect(() => {
    // 从JSON文件导入模拟数据
    setExperts([
      {
        id: 'health-check',
        name: '港股通体检专家',
        icon: 'Activity',
        description: 'AI智能分析入通可行性，评估港股上市条件',
        color: 'gold',
        systemPrompt: `你是一位拥有20年经验的港股IPO上市专家，专精于港股通准入条件和香港联交所上市规则。你的名字叫"港股通体检专家"。

## 你的职责
根据用户提供的公司信息，进行港股通入通可行性体检，并给出专业的改进建议。

## 港股通准入条件（必须严格遵守）

### 主板上市条件（满足其一即可）：
1. 盈利测试：最近一年盈利≥3500万港元，前两年累计盈利≥4500万港元，前三年累计盈利≥8000万港元
2. 市值收益测试：市值≥40亿港元，最近一年收益≥5亿港元
3. 市值收益现金流测试：市值≥20亿港元，最近一年收益≥5亿港元，最近三年累计现金流≥1亿港元

### 港股通纳入条件：
- 必须在香港主板或创业板上市
- 市值不低于50亿港元
- 需被纳入恒生综合大型股/中型股指数

## 输出格式
请按照以下JSON格式输出体检结果...`,
        temperature: 0.7,
        maxTokens: 2000,
        price: 49.9,
        features: ['股权架构分析', '财务指标评估', '合规风险提示', '改进方案建议'],
        isActive: true,
        version: '1.0.0',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'ipo-analysis',
        name: '招股书分析专家',
        icon: 'FileText',
        description: 'AI解读招股书核心要点，剖析投资价值与风险',
        color: 'primary',
        systemPrompt: `你是香港IPO市场的专业分析师，擅长解读招股书。你的名字叫"招股书分析专家"。

## 你的职责
根据用户提供的招股书内容或问题，进行专业分析，帮助投资者理解公司价值和风险。

## 核心分析维度
1. 商业模式解读
2. 保荐人记录
3. 基石投资者分析
4. 风险因素评估
5. 估值分析...`,
        temperature: 0.7,
        maxTokens: 2000,
        price: 29.9,
        features: ['商业模式解读', '保荐人记录', '基石投资者分析', '风险因素评估'],
        isActive: true,
        version: '1.0.0',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'listing-path',
        name: '上市路径规划专家',
        icon: 'Map',
        description: '量身定制上市方案，规划最佳路径',
        color: 'blue',
        systemPrompt: `你是香港上市路径规划专家，拥有15年辅导企业香港上市的经验。你的名字叫"上市路径规划专家"。`,
        temperature: 0.7,
        maxTokens: 2000,
        price: 99.9,
        features: ['架构设计建议', '时间线规划', '费用估算', '节点把控'],
        isActive: true,
        version: '1.0.0',
lastUpdated: '2024-01-01'
      },
      {
        id: 'compliance',
        name: '合规审查专家',
        icon: 'Shield',
        description: '全面排查合规风险，确保上市顺利进行',
        color: 'green',
        systemPrompt: `你是香港上市合规审查专家，专精于香港联交所上市规则和证券法规。你的名字叫"合规审查专家"。`,
        temperature: 0.7,
        maxTokens: 2000,
        price: 79.9,
        features: ['法律合规检查', '监管要求匹配', '风险预警', '整改建议'],
        isActive: true,
        version: '1.0.0',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'valuation',
        name: '估值定价专家',
        icon: 'TrendingUp',
        description: '专业估值分析，提供定价策略参考',
        color: 'purple',
        systemPrompt: `你是香港上市估值定价专家，精通各种估值方法和市场分析。你的名字叫"估值定价专家"。`,
        temperature: 0.7,
        maxTokens: 2000,
        price: 89.9,
        features: ['市值分析', '估值模型', '定价区间', '同业对比'],
        isActive: true,
        version: '1.0.0',
        lastUpdated: '2024-01-01'
      }
    ]);
  }, []);

  // 选择专家编辑
  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setEditedPrompt(expert.systemPrompt);
    setEditedPrice(expert.price.toString());
    setEditedTemperature(expert.temperature);
    setEditedMaxTokens(expert.maxTokens);
    setSaved(false);
  };

  // 复制配置到剪贴板
  const handleCopyConfig = () => {
    const configJson = JSON.stringify(experts, null, 2);
    navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 生成修改后的JSON
  const generateModifiedJson = () => {
    const updatedExperts = experts.map(e => {
      if (e.id === selectedExpert?.id) {
        return {
          ...e,
          systemPrompt: editedPrompt,
          price: parseFloat(editedPrice) || e.price,
          temperature: editedTemperature,
          maxTokens: editedMaxTokens,
          lastUpdated: new Date().toISOString().split('T')[0],
          version: (parseFloat(e.version) + 0.1).toFixed(1)
        };
      }
      return e;
    });

    return JSON.stringify({ experts: updatedExperts, settings: { defaultExpert: 'health-check', maxConversationHistory: 10, enableStreaming: true } }, null, 2);
  };

  // 保存修改
  const handleSave = () => {
    setSaved(true);
    alert('修改已保存到内存中。请点击"导出配置"按钮，将JSON配置复制到剪贴板，然后手动更新到GitHub的experts.json文件中。');
  };

  const colors = selectedExpert ? (colorMap[selectedExpert.color] || colorMap.primary) : colorMap.primary;
  const IconComponent = selectedExpert ? (iconMap[selectedExpert.icon] || Activity) : Activity;

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
              <Settings className="text-primary-600 mr-2" size={24} />
              <h1 className="text-xl font-bold text-primary-900">专家配置管理</h1>
            </div>
          </div>
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center text-gray-600 hover:text-primary-600"
          >
            {showJson ? <EyeOff size={20} /> : <Eye size={20} />}
            <span className="ml-1">{showJson ? '隐藏' : '预览'}JSON</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* 左侧：专家列表 */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <h2 className="text-white font-bold mb-4">专家列表</h2>
            <div className="space-y-2">
              {experts.map((expert) => {
                const ItemIcon = iconMap[expert.icon] || Activity;
                const itemColors = colorMap[expert.color] || colorMap.primary;
                const isSelected = selectedExpert?.id === expert.id;

                return (
                  <button
                    key={expert.id}
                    onClick={() => handleSelectExpert(expert)}
                    className={`
                      w-full p-3 rounded-xl flex items-center space-x-3 transition
                      ${isSelected 
                        ? 'bg-white/20 border border-white/30' 
                        : 'hover:bg-white/10'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 ${itemColors.bg} rounded-lg flex items-center justify-center`}>
                      <ItemIcon className="text-white" size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium text-sm">{expert.name}</p>
                      <p className="text-gray-400 text-xs">v{expert.version}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 中间：编辑区 */}
        <div className="flex-1">
          {selectedExpert ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              {/* 专家信息 */}
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mr-4`}>
                  <IconComponent className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">{selectedExpert.name}</h2>
                  <p className="text-gray-400 text-sm">编辑Prompt和参数</p>
                </div>
              </div>

              {/* 价格设置 */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">服务价格 (¥)</label>
                <input
                  type="number"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>

              {/* 参数设置 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Temperature (0-1)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editedTemperature}
                    onChange={(e) => setEditedTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-gray-400 text-xs mt-1">当前值: {editedTemperature}</p>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={editedMaxTokens}
                    onChange={(e) => setEditedMaxTokens(parseInt(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  />
                </div>
              </div>

              {/* Prompt编辑 */}
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">
                  System Prompt 
                  <span className="text-gray-500 ml-2">（修改AI专家的行为指令）</span>
                </label>
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={20}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-sm"
                  placeholder="在这里输入专家的System Prompt..."
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className={`flex-1 ${colors.button} text-white py-3 rounded-xl font-medium flex items-center justify-center hover:opacity-90 transition`}
                >
                  <Save size={20} className="mr-2" />
                  保存修改 {saved && <Check size={16} className="ml-2 text-green-300" />}
                </button>
              </div>

              {/* 提示 */}
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-blue-300 text-sm">
                  <strong>使用说明：</strong>
                </p>
                <ul className="text-blue-200 text-xs mt-2 space-y-1">
                  <li>1. 修改Prompt内容来调整AI专家的回答风格和专业方向</li>
                  <li>2. 点击"保存修改"保存到当前会话</li>
                  <li>3. 点击右侧"导出配置"获取完整JSON</li>
                  <li>4. 将JSON内容更新到 GitHub 的 app/config/experts.json 文件中</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-center py-20">
              <p className="text-gray-400">请从左侧选择一个专家进行编辑</p>
            </div>
          )}
        </div>

        {/* 右侧：预览/导出 */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 sticky top-24">
            <h2 className="text-white font-bold mb-4">配置导出</h2>
            
            {showJson ? (
              <div className="mb-4">
                <textarea
                  readOnly
                  value={selectedExpert ? generateModifiedJson() : ''}
                  rows={20}
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-3 py-2 text-green-400 font-mono text-xs"
                />
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-gray-300 text-sm mb-2">当前配置预览</h3>
                {selectedExpert ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">专家ID:</span>
                      <span className="text-white">{selectedExpert.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">价格:</span>
                      <span className="text-gold-400">¥{editedPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Temperature:</span>
                      <span className="text-white">{editedTemperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Tokens:</span>
                      <span className="text-white">{editedMaxTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">版本:</span>
                      <span className="text-white">v{selectedExpert.version}</span>
</div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-xs mb-2">Prompt长度:</p>
                      <p className="text-white">{editedPrompt.length} 字符</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">请先选择一个专家</p>
                )}
              </div>
            )}

            <button
              onClick={handleCopyConfig}
              disabled={!selectedExpert}
              className={`
                w-full py-3 rounded-xl font-medium flex items-center justify-center transition
                ${selectedExpert 
                  ? 'bg-gold-500 hover:bg-gold-600 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {copied ? <Check size={20} className="mr-2" /> : <Copy size={20} className="mr-2" />}
              {copied ? '已复制!' : '复制完整配置'}
            </button>

            {copied && (
              <p className="text-green-400 text-xs mt-2 text-center">
                配置已复制到剪贴板，请粘贴到 experts.json 文件中
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
