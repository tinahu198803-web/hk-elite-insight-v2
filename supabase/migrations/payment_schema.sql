-- 支付相关数据表
-- 创建时间: 2026-04-09

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
  user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
  plan_type VARCHAR(20) NOT NULL COMMENT '套餐类型: monthly, yearly',
  amount INTEGER NOT NULL COMMENT '金额(分)',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending, paid, cancelled, refunded',
  code_url TEXT COMMENT '微信支付二维码链接',
  prepay_id VARCHAR(100) COMMENT '微信预支付ID',
  transaction_id VARCHAR(100) COMMENT '微信交易单号',
  open_id VARCHAR(100) COMMENT '用户微信OpenID',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE COMMENT '支付时间'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

-- 用户会员表
CREATE TABLE IF NOT EXISTS user_memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE NOT NULL COMMENT '用户ID',
  membership_type VARCHAR(20) NOT NULL COMMENT '会员类型: monthly, yearly',
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL COMMENT '到期时间',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_renew BOOLEAN DEFAULT FALSE COMMENT '是否自动续费'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_expiry ON user_memberships(expiry_date);

-- 支付日志表（用于调试和对账）
CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL COMMENT '事件类型: created, paid, refunded, cancelled',
  request_data JSONB COMMENT '请求数据',
  response_data JSONB COMMENT '响应数据',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);

-- 用户表（扩展）
-- 注意：如果已有用户表，只需添加以下字段
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(100);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS wechat_unionid VARCHAR(100);

-- RLS策略 (Row Level Security)
-- 启用RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- 支付订单策略 - 用户只能查看自己的订单
CREATE POLICY "Users can view own orders" ON payment_orders
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can manage orders" ON payment_orders
  FOR ALL USING (true);

-- 会员策略
CREATE POLICY "Users can view own membership" ON user_memberships
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can manage memberships" ON user_memberships
  FOR ALL USING (true);

-- 日志策略 - 只有服务角色可以写入
CREATE POLICY "Service role can manage logs" ON payment_logs
  FOR ALL USING (true);

-- 触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 注释说明
COMMENT ON TABLE payment_orders IS '支付订单表';
COMMENT ON TABLE user_memberships IS '用户会员表';
COMMENT ON TABLE payment_logs IS '支付日志表';
