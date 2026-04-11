'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode.react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'monthly' | 'yearly';
  planName: string;
  amount: number;
  onSuccess: () => void;
}

type PaymentStatus = 'idle' | 'loading' | 'pending' | 'success' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  planType,
  planName,
  amount,
  onSuccess
}: PaymentModalProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [orderId, setOrderId] = useState<string>('');
  const [codeUrl, setCodeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  // 开始支付流程
  const startPayment = async () => {
    setStatus('loading');
    setError('');
    
    try {
      // 获取用户ID（实际应用中应从登录状态获取）
      const userId = localStorage.getItem('userId') || `guest_${Date.now()}`;
      
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType,
          userId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrderId(data.orderId);
        setCodeUrl(data.codeUrl || '');
        setStatus('pending');
        
        // 开始轮询订单状态
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/payment/order-status?orderId=${data.orderId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.order?.status === 'paid') {
              clearInterval(interval);
              setStatus('success');
              onSuccess();
              
              // 2秒后关闭
              setTimeout(() => {
                onClose();
              }, 2000);
            }
          } catch (err) {
            console.error('检查订单状态失败:', err);
          }
        }, 2000);
        
        setCheckInterval(interval);
      } else {
        setError(data.error || '创建订单失败');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请重试');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="bg-primary-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">开通{planName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-6">
          {status === 'idle' && (
            <>
              {/* 订单信息 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">套餐</span>
                  <span className="font-medium">{planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">金额</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ¥{(amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* 支付说明 */}
              <div className="text-sm text-gray-500 mb-6">
                <p className="mb-2">• 支付成功后立即开通会员特权</p>
                <p>• 付费后7天内可申请无理由退款</p>
              </div>
              
              {/* 支付按钮 */}
              <button
                onClick={startPayment}
                className="w-full btn-gradient text-white py-4 rounded-xl font-medium flex items-center justify-center"
              >
                <Wallet size={20} className="mr-2" />
                微信支付
              </button>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center py-12">
              <Loader2 size={48} className="animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-gray-600">正在创建订单...</p>
            </div>
          )}
          
          {status === 'pending' && (
            <div className="text-center">
              {/* 二维码 */}
              {codeUrl && (
                <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block mb-4">
                  <QRCode 
                    value={codeUrl}
                    size={200}
                    level="M"
                    includeMargin
                  />
                </div>
              )}
              
              <p className="text-gray-600 mb-2">请使用微信扫描二维码支付</p>
              <p className="text-2xl font-bold text-primary-600 mb-4">
                ¥{(amount / 100).toFixed(2)}
              </p>
              
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin mr-2" />
                等待支付中...
              </div>
              
              <p className="text-xs text-gray-400 mt-4">
                订单号: {orderId}
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-12">
              <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
              <p className="text-xl font-semibold text-gray-900 mb-2">支付成功！</p>
              <p className="text-gray-500">正在开通会员特权...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-12">
              <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
              <p className="text-xl font-semibold text-gray-900 mb-2">支付失败</p>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                重试
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
