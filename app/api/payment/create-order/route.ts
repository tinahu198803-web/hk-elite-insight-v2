/**
 * 支付订单创建API
 * 支持微信支付Native模式
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

const WECHAT_MCHID = process.env.WECHAT_MCHID || '';
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_APIKEY = process.env.WECHAT_APIKEY || '';
const WECHAT_NOTIFY_URL = process.env.WECHAT_NOTIFY_URL || '';

// 产品价格配置 - 一条鲟鱼的AI专家
const PRICE_CONFIG = {
  monthly: {
    price: 2800, // 元(28元)
    name: '月度会员',
    days: 30
  },
  yearly: {
    price: 88000, // 元(880元)
    name: '年度会员',
    days: 365
  }
};

interface CreateOrderRequest {
  planType: 'monthly' | 'yearly';
  userId: string;
  openId?: string;
}

/**
 * 生成微信支付签名
 */
function generateSignature(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + `&key=${WECHAT_APIKEY}`;
  return md5(signStr).toUpperCase();
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成订单号
 */
function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `UZN${timestamp}${random}`;
}

/**
 * 创建微信支付订单 (Native模式 - 扫码支付)
 */
async function createWechatPayOrder(params: {
  orderId: string;
  amount: number;
  description: string;
  clientIp: string;
}): Promise<{ codeUrl?: string; prepayId?: string; error?: string }> {
  const { orderId, amount, description, clientIp } = params;
  const nonceStr = generateNonceStr();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // 构建统一下单请求参数
  const requestParams: Record<string, string> = {
    appid: WECHAT_APPID,
    mch_id: WECHAT_MCHID,
    nonce_str: nonceStr,
    body: description,
    out_trade_no: orderId,
    total_fee: amount.toString(),
    spbill_create_ip: clientIp,
    notify_url: WECHAT_NOTIFY_URL,
    trade_type: 'NATIVE',
    product_id: orderId
  };

  // 生成签名
  requestParams.sign = generateSignature(requestParams);

  try {
    // 调用微信支付统一下单API
    const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml'
      },
      body: buildXml(requestParams)
    });

    const resultXml = await response.text();
    const result = parseXml(resultXml);

    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      return {
        codeUrl: result.code_url,
        prepayId: result.prepay_id
      };
    } else {
      return {
        error: result.err_code_des || result.return_msg || '微信支付下单失败'
      };
    }
  } catch (error: any) {
    return {
      error: `调用微信支付失败: ${error.message}`
    };
  }
}

/**
 * 构建XML请求数据
 */
function buildXml(params: Record<string, string>): string {
  let xml = '<xml>';
  for (const [key, value] of Object.entries(params)) {
    xml += `<${key}><![CDATA[${value}]]></${key}>`;
  }
  xml += '</xml>';
  return xml;
}

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
 * 生成JSAPI调起支付的签名
 */
function generateJsApiSignature(prepayId: string): { timestamp: string; nonceStr: string; sign: string; package: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const pkg = `prepay_id=${prepayId}`;

  const signParams: Record<string, string> = {
    appId: WECHAT_APPID,
    timeStamp: timestamp,
    nonceStr: nonceStr,
    package: pkg,
    signType: 'MD5'
  };

  signParams.paySign = generateSignature(signParams);

  return {
    timestamp,
    nonceStr,
    sign: signParams.paySign,
    package: pkg
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { planType, userId, openId } = body;

    // 验证参数
    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      return NextResponse.json({ success: false, error: '无效的套餐类型' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: '用户ID不能为空' }, { status: 400 });
    }

    const priceConfig = PRICE_CONFIG[planType];
    const orderId = generateOrderId();
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // 如果有openId，优先使用JSAPI支付
    if (openId) {
      // JSAPI支付逻辑
      const jsapiParams = {
        orderId,
        amount: priceConfig.price,
        description: priceConfig.name,
        clientIp,
        openId
      };

      // 构建JSAPI下单参数
      const nonceStr = generateNonceStr();
      const requestParams: Record<string, string> = {
        appid: WECHAT_APPID,
        mch_id: WECHAT_MCHID,
        nonce_str: nonceStr,
        body: priceConfig.name,
        out_trade_no: orderId,
        total_fee: priceConfig.price.toString(),
        spbill_create_ip: clientIp,
        notify_url: WECHAT_NOTIFY_URL,
        trade_type: 'JSAPI',
        openid: openId
      };

      requestParams.sign = generateSignature(requestParams);

      const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body: buildXml(requestParams)
      });

      const resultXml = await response.text();
      const result = parseXml(resultXml);

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        const jsApiSign = generateJsApiSignature(result.prepay_id);

        // 保存订单到数据库
        await saveOrderToDatabase({
          orderId,
          userId,
          planType,
          amount: priceConfig.price,
          status: 'pending',
          prepayId: result.prepay_id
        });

        return NextResponse.json({
          success: true,
          orderId,
          jsApiParams: {
            ...jsApiSign,
            appId: WECHAT_APPID
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.err_code_des || '微信支付下单失败'
        }, { status: 500 });
      }
    } else {
      // Native支付（扫码支付）
      const payResult = await createWechatPayOrder({
        orderId,
        amount: priceConfig.price,
        description: priceConfig.name,
        clientIp
      });

      if (payResult.error) {
        return NextResponse.json({ success: false, error: payResult.error }, { status: 500 });
      }

      // 保存订单到数据库
      await saveOrderToDatabase({
        orderId,
        userId,
        planType,
        amount: priceConfig.price,
        status: 'pending',
        codeUrl: payResult.codeUrl,
        prepayId: payResult.prepayId
      });

      return NextResponse.json({
        success: true,
        orderId,
        codeUrl: payResult.codeUrl
      });
    }
  } catch (error: any) {
    console.error('创建支付订单失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * 保存订单到数据库
 */
async function saveOrderToDatabase(order: {
  orderId: string;
  userId: string;
  planType: string;
  amount: number;
  status: string;
  codeUrl?: string;
  prepayId?: string;
}) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://atwlxpljfidlaaufeach.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  const response = await fetch(`${supabaseUrl}/rest/v1/payment_orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      order_id: order.orderId,
      user_id: order.userId,
      plan_type: order.planType,
      amount: order.amount,
      status: order.status,
      code_url: order.codeUrl || null,
      prepay_id: order.prepayId || null,
      created_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    console.error('保存订单失败:', await response.text());
  }

  return response.ok;
}
