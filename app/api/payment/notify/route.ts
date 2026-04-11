/**
 * 微信支付回调通知处理
 */
import { NextRequest, NextResponse } from 'next/server';

// 纯JavaScript实现的MD5函数（兼容Edge Runtime）
function md5(str: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function binlMD5(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (len % 32);
    x[((len + 64) >>> 9 << 4) + 14] = len;
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }
  function binl2rstr(input: number[]): string {
    let output = '';
    for (let i = 0; i < input.length * 32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
    }
    return output;
  }
  function rstr2binl(input: string): number[] {
    const output: number[] = [];
    output[(input.length >> 2) - 1] = undefined;
    for (let i = 0; i < output.length; i++) output[i] = 0;
    for (let i = 0; i < input.length * 8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return output;
  }
  function rstrMD5(s: string): string {
    return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
  }
  function rstr2hex(input: string): string {
    const hexTab = '0123456789abcdef';
    let output = '';
    for (let i = 0; i < input.length; i++) {
      const x = input.charCodeAt(i);
      output += hexTab.charAt((x >>> 4) & 0x0F) + hexTab.charAt(x & 0x0F);
    }
    return output;
  }
  return rstr2hex(rstrMD5(str));
}

const WECHAT_APIKEY = process.env.WECHAT_APIKEY || '';

/**
 * 解析XML响应
 */
function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)><!\[CDATA\[([^\]]*)\]\]><\/\1>|<(\w+)>([^<]*)<\/\3>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const key = match[1] || match[3];
    const value = match[2] || match[4];
    result[key] = value;
  }
  return result;
}

/**
 * 验证微信支付签名
 */
function verifySignature(params: Record<string, string>): boolean {
  const { sign, ...rest } = params;
  const sortedKeys = Object.keys(rest).sort();
  const signStr = sortedKeys.map(key => `${key}=${rest[key]}`).join('&') + `&key=${WECHAT_APIKEY}`;
  const calculatedSign = md5(signStr).toUpperCase();
  return calculatedSign === sign;
}

/**
 * 更新订单状态
 */
async function updateOrderStatus(orderId: string, status: string, transactionId?: string) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (transactionId) {
    updateData.transaction_id = transactionId;
  }

  // 如果支付成功，更新会员信息
  if (status === 'paid') {
    const order = await getOrderById(orderId);
    if (order) {
      await activateMembership(order.user_id, order.plan_type, transactionId);
    }
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/payment_orders?order_id=eq.${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(updateData)
  });

  return response.ok;
}

/**
 * 获取订单信息
 */
async function getOrderById(orderId: string): Promise<any> {
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
    return data && data.length > 0 ? data[0] : null;
  }
  return null;
}

/**
 * 激活会员
 */
async function activateMembership(userId: string, planType: string, transactionId?: string) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  // 计算会员到期时间
  const days = planType === 'yearly' ? 365 : 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  // 查询现有会员信息
  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/user_memberships?user_id=eq.${userId}&select=*&limit=1`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );

  let membershipData: any;

  if (existingResponse.ok) {
    const existing = await existingResponse.json();

    if (existing && existing.length > 0) {
      // 更新现有会员
      const existingExpiry = new Date(existing[0].expiry_date);
      const newExpiry = new Date();

      // 如果现有会员未过期，累计加时间
      if (existingExpiry > newExpiry) {
        existingExpiry.setDate(existingExpiry.getDate() + days);
      } else {
        // 从当前时间开始计算
        existingExpiry.setDate(existingExpiry.getDate() + days);
      }

      membershipData = {
        membership_type: planType === 'yearly' ? 'yearly' : 'monthly',
        expiry_date: existingExpiry.toISOString(),
        updated_at: new Date().toISOString()
      };

      await fetch(
        `${supabaseUrl}/rest/v1/user_memberships?user_id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify(membershipData)
        }
      );
    } else {
      // 创建新会员记录
      membershipData = {
        user_id: userId,
        membership_type: planType === 'yearly' ? 'yearly' : 'monthly',
        expiry_date: expiryDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await fetch(`${supabaseUrl}/rest/v1/user_memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(membershipData)
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const xmlBody = await request.text();
    const params = parseXml(xmlBody);

    console.log('收到微信支付回调:', params);

    // 验证签名
    if (!verifySignature(params)) {
      console.error('签名验证失败');
      return new NextResponse(buildResponseXml('FAIL', '签名验证失败'), {
        status: 400,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // 处理支付结果
    if (params.return_code === 'SUCCESS') {
      const orderId = params.out_trade_no;
      const transactionId = params.transaction_id;
      const totalFee = parseInt(params.total_fee, 10);

      // 验证订单金额
      const order = await getOrderById(orderId);
      if (!order) {
        console.error('订单不存在', orderId);
        return new NextResponse(buildResponseXml('FAIL', '订单不存在'), {
          status: 400,
          headers: { 'Content-Type': 'text/xml' }
        });
      }

      if (order.amount !== totalFee) {
        console.error('订单金额不匹配', order.amount, totalFee);
        return new NextResponse(buildResponseXml('FAIL', '订单金额不匹配'), {
          status: 400,
          headers: { 'Content-Type': 'text/xml' }
        });
      }

      // 检查订单状态，避免重复处理
      if (order.status === 'paid') {
        console.log('订单已处理', orderId);
        return new NextResponse(buildResponseXml('SUCCESS', 'OK'), {
          headers: { 'Content-Type': 'text/xml' }
        });
      }

      // 更新订单状态
      await updateOrderStatus(orderId, 'paid', transactionId);

      console.log('支付成功:', orderId, transactionId);

      // 返回成功响应
      return new NextResponse(buildResponseXml('SUCCESS', 'OK'), {
        headers: { 'Content-Type': 'text/xml' }
      });
    } else {
      console.error('支付失败:', params.return_msg);
      return new NextResponse(buildResponseXml('FAIL', params.return_msg), {
        status: 400,
        headers: { 'Content-Type': 'text/xml' }
      });
    }
  } catch (error: any) {
    console.error('处理微信支付回调失败:', error);
    return new NextResponse(buildResponseXml('FAIL', error.message), {
      status: 500,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

/**
 * 构建XML响应
 */
function buildResponseXml(code: string, message: string): string {
  return `<xml><return_code><![CDATA[${code}]]></return_code><return_msg><![CDATA[${message}]]></return_msg></xml>`;
}
