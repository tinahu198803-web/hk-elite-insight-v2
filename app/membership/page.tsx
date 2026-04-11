'use client';

import { useState } from 'react';
import { Check, X, Star, Crown } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

export default function MembershipPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      type: 'monthly' as const,
      name: '月度会员',
      price: 28,
      yearlyPrice: 28,
      description: '一杯咖啡的AI专家',
      features: [
        { text: '无限次AI问答', included: true },
        { text: '港股通体检无限次', included: true },
        { text: '招股书完整分析', included: true },
        { text: '最新IPO日历', included: true },
        { text: '完整分析报告', included: true },
        { text: '无限次深度查询', included: true },
        { text: '优先客服支持', included: false },
      ],
      cta: '立即开通',
      popular: false,
    },
    {
      type: 'yearly' as const,
      name: '年度会员',
      price: 88,
      yearlyPrice: 88,
      description: '一杯咖啡·月均不到8元',
      features: [
        { text: '无限次AI问答', included: true },
        { text: '港股通体检无限次', included: true },
        { text: '招股书完整分析', included: true },
        { text: '最新IPO日历', included: true },
        { text: '完整分析报告', included: true },
        { text: '无限次深度查询', included: true },
        { text: '优先客服支持', included: true },
      ],
      cta: '立即开通',
      popular: true,
    },
  ];

  const getCurrentPlan = (planType: 'monthly' | 'yearly') => {
    const plan = plans.find(p => p.type === planType);
    return plan ? {
      type: plan.type,
      name: plan.name,
      amount: billingCycle === 'yearly' ? plan.yearlyPrice * 100 : plan.price * 100
    } : null;
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setSelectedPlan(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 支付成功提示 */}
      {paymentSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center">
          <Check size={20} className="mr-2" />
          支付成功！会员已开通
        </div>
      )}

      <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="/" className="text-white flex items-center text-sm mb-4">
            ← 返回首页
          </a>
          <h1 className="text-2xl font-bold text-white text-center">AI投资专家</h1>
          <p className="text-primary-100 text-sm mt-1 text-center">一杯咖啡，解决资本市场难题</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* 切换周期 */}
        <div className="bg-white rounded-2xl shadow-lg p-2 flex items-center justify-center mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-3 rounded-xl font-medium transition ${
              billingCycle === 'monthly'
                ? 'bg-primary-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            月卡
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-3 rounded-xl font-medium transition ${
              billingCycle === 'yearly'
                ? 'bg-primary-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            年卡
            <span className="ml-2 text-xs bg-gold-500 text-white px-2 py-0.5 rounded-full">省40%</span>
          </button>
        </div>

        {/* 套餐卡片 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          {/* 免费版 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">免费版</h3>
              <p className="text-gray-500 text-sm">适合体验用户</p>
            </div>

            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-gray-900">免费</span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-sm">
                <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700">每日5次AI问答</span>
              </li>
              <li className="flex items-center text-sm">
                <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700">港股通体检概览</span>
              </li>
              <li className="flex items-center text-sm">
                <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700">招股书摘要预览</span>
              </li>
              <li className="flex items-center text-sm">
                <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700">最新IPO日历</span>
              </li>
              <li className="flex items-center text-sm">
                <X size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                <span className="text-gray-400">完整分析报告</span>
              </li>
              <li className="flex items-center text-sm">
                <X size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                <span className="text-gray-400">无限次深度查询</span>
              </li>
              <li className="flex items-center text-sm">
                <X size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                <span className="text-gray-400">优先客服支持</span>
              </li>
            </ul>

            <button className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium cursor-default">
              当前套餐
            </button>
          </div>

          {/* 付费套餐 */}
          {plans.map((plan) => (
            <div
              key={plan.type}
              className={`bg-white rounded-2xl shadow-lg p-6 relative ${
                plan.popular ? 'ring-2 ring-gold-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-white px-4 py-1 rounded-full text-sm flex items-center">
                  <Crown size={14} className="mr-1" />
                  最超值
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ¥{billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                  {billingCycle === 'yearly' ? '/年' : '/月'}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    {feature.included ? (
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedPlan(plan.type)}
                className={`w-full py-3 rounded-xl font-medium transition ${
                  plan.popular
                    ? 'btn-gradient text-white'
                    : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">常见问题</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">一杯咖啡能做什么？</h4>
              <p className="text-gray-500 text-sm">每月28元（一杯咖啡的价格），获得无限次AI投顾服务，比真人咨询便宜99%。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">会员可以退款吗？</h4>
              <p className="text-gray-500 text-sm">付费会员在开通后7天内可申请无理由退款，超过7天不支持退款。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">年卡更划算？</h4>
              <p className="text-gray-500 text-sm">年卡仅需880元，平均每天不到2.5元，比月卡省60%。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">年卡可以叠加时长吗？</h4>
              <p className="text-gray-500 text-sm">可以！再次购买自动叠加有效期，让您的专家服务不中断。</p>
            </div>
          </div>
        </div>

        {/* 底部padding */}
        <div className="h-12"></div>
      </div>

      {/* 支付弹窗 */}
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          planType={selectedPlan}
          planName={plans.find(p => p.type === selectedPlan)?.name || ''}
          amount={getCurrentPlan(selectedPlan)?.amount || 0}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
