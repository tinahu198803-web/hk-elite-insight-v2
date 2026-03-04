'use client';

import { useState } from 'react';
import { Check, X, Star, Crown } from 'lucide-react';

export default function MembershipPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      name: '免费版',
      price: 0,
      description: '适合体验用户',
      features: [
        { text: '每日5次AI问答', included: true },
        { text: '港股通体检概览', included: true },
        { text: '招股书摘要预览', included: true },
        { text: '最新IPO日历', included: true },
        { text: '完整分析报告', included: false },
        { text: '无限次深度查询', included: false },
        { text: '优先客服支持', included: false },
      ],
      cta: '当前套餐',
      popular: false,
    },
    {
      name: '月度会员',
      price: 199,
      yearlyPrice: 1999,
      description: '适合高频使用者',
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
      name: '年度会员',
      price: 1999,
      yearlyPrice: 1999,
      description: '性价比最高',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="/" className="text-white flex items-center text-sm mb-4">
            ← 返回首页
          </a>
          <h1 className="text-2xl font-bold text-white text-center">会员服务</h1>
          <p className="text-primary-100 text-sm mt-1 text-center">开通会员，尊享全部特权</p>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <div
              key={index}
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
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-gray-900">免费</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-gray-900">
                      ¥{billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                    </span>
                    {billingCycle === 'yearly' && (
                      <span className="text-gray-500 text-sm ml-1">/年</span>
                    )}
                    {billingCycle === 'monthly' && plan.price > 0 && (
                      <span className="text-gray-500 text-sm ml-1">/月</span>
                    )}
                  </>
                )}
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
                className={`w-full py-3 rounded-xl font-medium transition ${
                  plan.price === 0
                    ? 'bg-gray-100 text-gray-600'
                    : plan.popular
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
              <h4 className="font-medium text-gray-800 mb-1">如何开通会员？</h4>
              <p className="text-gray-500 text-sm">点击上方"立即开通"按钮，通过微信支付完成付款即可立即开通。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">会员可以退款吗？</h4>
              <p className="text-gray-500 text-sm">付费会员在开通后7天内可申请无理由退款，超过7天不支持退款。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">年卡和月卡有什么区别？</h4>
              <p className="text-gray-500 text-sm">年卡价格更优惠，相当于每月仅需约166元，比月卡省40%。</p>
            </div>
          </div>
        </div>

        {/* 底部padding */}
        <div className="h-12"></div>
      </div>
    </div>
  );
}
