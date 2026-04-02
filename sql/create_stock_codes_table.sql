-- 创建股票代码表
CREATE TABLE IF NOT EXISTS stock_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(5) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(200),
  industry VARCHAR(50),
  source VARCHAR(20) DEFAULT 'learned',
  verified BOOLEAN DEFAULT false,
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_queried TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stock_codes_code ON stock_codes(code);
CREATE INDEX IF NOT EXISTS idx_stock_codes_verified ON stock_codes(verified);

-- 插入初始数据
INSERT INTO stock_codes (code, name, name_en, industry, source, verified) VALUES
('00700', '腾讯控股', 'Tencent Holdings', '互联网', 'manual', true),
('09988', '阿里巴巴-SW', 'Alibaba Group', '互联网', 'manual', true),
('03690', '美团-W', 'Meituan', '互联网', 'manual', true),
('01810', '小米集团-W', 'Xiaomi Group', '互联网', 'manual', true),
('02418', '京东集团-SW', 'JD.com', '互联网', 'manual', true),
('09618', '百度集团-SW', 'Baidu', '互联网', 'manual', true),
('09633', '京东健康', 'JD Health', '互联网医疗', 'manual', true),
('02559', '快手-W', 'Kuaishou', '互联网', 'manual', true),
('09999', '网易-S', 'NetEase', '互联网', 'manual', true),
('06699', '创梦天地', 'iDreamSky', '互联网', 'manual', true),
('09868', '小鹏汽车-W', 'XPeng', '新能源汽车', 'manual', true),
('09881', '理想汽车-W', 'Li Auto', '新能源汽车', 'manual', true),
('01765', '比亚迪股份', 'BYD', '新能源汽车', 'manual', true),
('02333', '长城汽车', 'Great Wall Motor', '汽车', 'manual', true),
('00175', '吉利汽车', 'Geely', '汽车', 'manual', true),
('01877', '百济神州', 'BeiGene', '生物医药', 'manual', true),
('02269', '药明生物', 'WuXi Biologics', '生物医药', 'manual', true),
('02575', '轩竹生物', 'Xuanzhu Biotech', '生物医药', 'manual', true),
('02659', '宝济药业-B', 'BAO PHARMA-B', '生物医药', 'manual', true),
('02655', '果下科技', 'Guoxia Tech', '科技', 'manual', true),
('09989', '翰森制药', 'Hansoh Pharmaceutical', '医药', 'manual', true),
('01801', '信达生物', 'Innovent', '生物医药', 'manual', true),
('01548', '金斯瑞生物科技', 'GenScript', '生物医药', 'manual', true),
('06186', '康宁杰瑞', 'Alphamab Oncology', '生物医药', 'manual', true),
('09939', '康方生物', 'Akeso', '生物医药', 'manual', true),
('02569', '再鼎医药', 'Zai Lab', '生物医药', 'manual', true),
('06030', '中信证券', 'CITIC Securities', '金融', 'manual', true),
('06837', '海通证券', 'Haitong Securities', '金融', 'manual', true),
('03908', '中金公司', 'CICC', '金融', 'manual', true),
('06099', '招商证券', 'China Merchants Securities', '金融', 'manual', true),
('02318', '中国平安', 'Ping An', '保险', 'manual', true),
('02313', '申洲国际', 'Shenzhou', '纺织', 'manual', true),
('00981', '中芯国际', 'SMIC', '半导体', 'manual', true),
('06098', '碧桂园服务', 'Country Garden Services', '房地产', 'manual', true),
('06060', '贝壳-W', 'KE Holdings', '互联网', 'manual', true),
('02691', '京东物流', 'JD Logistics', '物流', 'manual', true)
ON CONFLICT (code) DO NOTHING;
