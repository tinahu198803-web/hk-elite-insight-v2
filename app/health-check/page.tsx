export default function HealthCheckPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="/" className="text-white flex items-center text-sm mb-4">
            ← 返回首页
          </a>
          <h1 className="text-2xl font-bold text-white">港股通体检</h1>
          <p className="text-primary-100 text-sm mt-1">输入公司信息，AI专家为您进行入通可行性分析</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">功能即将上线</h2>
          <p className="text-gray-600 mb-4">
            港股通体检功能正在紧张开发中，敬请期待！
          </p>
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-primary-800 text-sm">
              <strong>功能亮点：</strong>
            </p>
            <ul className="text-primary-700 text-sm mt-2 space-y-1">
              <li>✓ AI智能分析公司财务数据</li>
              <li>✓ 股权架构评估</li>
              <li>✓ 合规风险提示</li>
              <li>✓ 个性化改进建议</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center py-8 mb-24">
          <p className="text-gray-500">请关注公众号获取最新上线通知</p>
        </div>
      </div>
    </div>
  );
}
