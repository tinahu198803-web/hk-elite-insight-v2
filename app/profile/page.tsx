'use client';

import { useState } from 'react';
import { User, CreditCard, FileText, Settings, LogOut, ChevronRight, Star, Clock, CheckCircle, X } from 'lucide-react';

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 模拟用户数据
  const userData = {
    name: '张三',
    phone: '138****8888',
    memberType: 'free', // free, monthly, yearly
    memberExpiry: null,
    remainingQueries: 5,
  };

  const menuItems = [
    { icon: CreditCard, label: '会员中心', href: '#', badge: null },
    { icon: FileText, label: '我的订单', href: '#', badge: null },
    { icon: Clock, label: '历史记录', href: '#', badge: null },
    { icon: Settings, label: '设置', href: '#', badge: null },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-12">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-white">个人中心</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">登录后享受更多服务</h2>
            <p className="text-gray-500 mb-6">港股通体检、招股书分析、会员特权</p>
            
            <button className="w-full btn-gradient text-white py-4 rounded-xl font-medium mb-4">
              微信授权登录
            </button>
            
            <button className="w-full border border-primary-600 text-primary-600 py-4 rounded-xl font-medium">
              手机号登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-primary-900 to-primary-950 pb-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white">个人中心</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{userData.name}</h2>
                <p className="text-gray-500 text-sm">{userData.phone}</p>
              </div>
            </div>
            <button className="text-gray-400">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* 会员状态 */}
        <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Star size={24} />
              <span className="font-semibold">会员状态</span>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
              {userData.memberType === 'free' ? '免费用户' : '正式会员'}
            </span>
          </div>
          
          {userData.memberType === 'free' ? (
            <div>
              <p className="text-gold-100 text-sm mb-4">剩余免费次数：{userData.remainingQueries}次/天</p>
              <button className="w-full bg-white text-gold-600 py-3 rounded-xl font-medium">
                开通会员
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gold-100 text-sm mb-4">有效期至：{userData.memberExpiry}</p>
              <button className="w-full bg-white/20 py-3 rounded-xl font-medium border border-white/30">
                续费会员
              </button>
            </div>
          )}
        </div>

        {/* 功能菜单 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex items-center space-x-4">
                <item.icon size={20} className="text-gray-400" />
                <span className="text-gray-900">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <button className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-center text-red-500 mb-24">
          <LogOut size={20} className="mr-2" />
          退出登录
        </button>
      </div>
    </div>
  );
}
