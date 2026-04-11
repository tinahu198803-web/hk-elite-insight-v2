/**
 * 查询订单状态API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ success: false, error: '订单ID不能为空' }, { status: 400 });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/payment_orders?order_id=eq.${orderId}&select=*&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.length > 0) {
        const order = data[0];
        return NextResponse.json({
          success: true,
          order: {
            orderId: order.order_id,
            status: order.status,
            planType: order.plan_type,
            amount: order.amount,
            createdAt: order.created_at,
            paidAt: order.paid_at
          }
        });
      } else {
        return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('查询订单状态失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
