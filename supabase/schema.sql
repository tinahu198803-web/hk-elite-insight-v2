-- =====================================================
-- 港股IPO专家Agent数据库Schema
-- 用于存储指数成分股和港股通名单
-- =====================================================

-- 1. 港股通名单表
CREATE TABLE IF NOT EXISTS hk_stock_connect (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(10) NOT NULL UNIQUE,
    stock_name VARCHAR(100) NOT NULL,
    stock_name_en VARCHAR(100),
    industry VARCHAR(50),
    connect_type VARCHAR(20), -- '南向' or '北向'
    hsci_type VARCHAR(20), -- '大型股', '中型股', '小型股'
    inclusion_date DATE,
    removal_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'removed'
    source VARCHAR(50), -- 'sse', 'szse', 'manual'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 恒生指数成分股表
CREATE TABLE IF NOT EXISTS hsi_constituents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    stock_name_en VARCHAR(100),
    industry VARCHAR(50),
    index_type VARCHAR(20) DEFAULT 'HSI', -- 'HSI', 'HSCEI', 'HSTECH'
    weight DECIMAL(6,3), -- 指数权重百分比
    constituent_date DATE,
    removal_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MSCI指数成分股表
CREATE TABLE IF NOT EXISTS msci_constituents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    stock_name_en VARCHAR(100),
    index_name VARCHAR(50) DEFAULT 'MSCI China', -- 'MSCI China', 'MSCI China A'
    sector VARCHAR(50),
    weight DECIMAL(6,3),
    review_date DATE, -- MSCI评审日期
    effective_date DATE, -- 生效日期
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FTSE罗素指数成分股表
CREATE TABLE IF NOT EXISTS ftse_constituents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    stock_name_en VARCHAR(100),
    index_name VARCHAR(50), -- 'FTSE China 50', 'FTSE HK 50'
    weight DECIMAL(6,3),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 数据更新日志表
CREATE TABLE IF NOT EXISTS data_update_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(50) NOT NULL, -- 'hk_connect', 'hsi', 'msci', 'ftse'
    update_status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. 索引
CREATE INDEX IF NOT EXISTS idx_hk_stock_connect_code ON hk_stock_connect(stock_code);
CREATE INDEX IF NOT EXISTS idx_hk_stock_connect_status ON hk_stock_connect(status);
CREATE INDEX IF NOT EXISTS idx_hsi_code ON hsi_constituents(stock_code);
CREATE INDEX IF NOT EXISTS idx_hsi_status ON hsi_constituents(status);
CREATE INDEX IF NOT EXISTS idx_msci_code ON msci_constituents(stock_code);
CREATE INDEX IF NOT EXISTS idx_ftse_code ON ftse_constituents(stock_code);

-- =====================================================
-- 初始数据：已知的港股通股票（2025年3月最新）
-- =====================================================

INSERT INTO hk_stock_connect (stock_code, stock_name, stock_name_en, industry, connect_type, hsci_type, inclusion_date, status, source, notes)
VALUES 
    ('02659', '宝济药业-B', 'Baoji Pharma', '生物医药', '南向', '小型股', '2025-03-09', 'active', 'sse', '2024年12月上市，2025年3月9日纳入港股通'),
    ('02575', '轩竹生物', 'Xuanzhu Biotech', '生物医药', '南向', '小型股', '2025-03-09', 'active', 'sse', '2025年3月9日上市，上市当日纳入'),
    ('02655', '果下科技', 'Guoxia Technology', '科技', '南向', '小型股', '2025-03', 'active', 'sse', '2025年3月纳入'),
    ('00700', '腾讯控股', 'Tencent Holdings', '互联网', '南向', '大型股', NULL, 'active', 'manual', '上市即入通，恒生指数成分股'),
    ('09988', '阿里巴巴-SW', 'Alibaba Group', '互联网', '南向', '大型股', '2019-11', 'active', 'manual', '恒生指数成分股'),
    ('03690', '美团-W', 'Meituan', '消费', '南向', '大型股', '2018-09', 'active', 'manual', '恒生指数成分股'),
    ('01810', '小米集团-W', 'Xiaomi Group', '科技', '南向', '大型股', '2019-09', 'active', 'manual', '恒生指数成分股'),
    ('09618', '京东集团-SW', 'JD.com', '互联网', '南向', '大型股', '2020-06', 'active', 'manual', '恒生指数成分股'),
    ('09909', '网易-S', 'NetEase', '互联网', '南向', '大型股', '2020-06', 'active', 'manual', '恒生指数成分股'),
    ('09961', '百度集团-SW', 'Baidu', '互联网', '南向', '大型股', '2021-03', 'active', 'manual', '恒生指数成分股'),
    ('02318', '中国平安', 'Ping An', '保险', '南向', '大型股', NULL, 'active', 'manual', '上市即入通，恒生指数成分股'),
    ('00941', '中国移动', 'China Mobile', '电讯', '南向', '大型股', NULL, 'active', 'manual', '上市即入通，恒生指数成分股'),
    ('00939', '建设银行', 'CCB', '银行', '南向', '大型股', NULL, 'active', 'manual', '上市即入通，恒生指数成分股'),
    ('02628', '中国人寿', 'China Life', '保险', '南向', '大型股', NULL, 'active', 'manual', '上市即入通'),
    ('03968', '招商银行', 'CMB', '银行', '南向', '中型股', NULL, 'active', 'manual', '恒生指数成分股'),
    ('06030', '中信证券', 'CITIC Securities', '金融', '南向', '中型股', NULL, 'active', 'manual', ''),
    ('02382', '舜宇光学', 'Sunny Optical', '科技', '南向', '中型股', '2018-09', 'active', 'manual', ''),
    ('06690', '海尔智家', 'Haier Smart Home', '家电', '南向', '中型股', '2018-12', 'active', 'manual', ''),
    ('06808', '京东健康', 'JD Health', '医疗健康', '南向', '中型股', '2020-12', 'active', 'manual', ''),
    ('02899', '紫金矿业', 'Zijin Mining', '矿业', '南向', '中型股', '2020-12', 'active', 'manual', ''),
    ('00291', '华润啤酒', 'CR Beer', '消费', '南向', '中型股', NULL, 'active', 'manual', ''),
    ('03888', '海底捞', 'Haidilao', '消费', '南向', '中型股', '2018-09', 'active', 'manual', ''),
    ('09688', '友邦保险', 'AIA', '保险', '南向', '大型股', NULL, 'active', 'manual', '恒生指数成分股'),
    ('01877', '百济神州', 'BeiGene', '生物医药', '南向', '中型股', '2018-03', 'active', 'manual', ''),
    ('02269', '药明生物', 'WuXi Biologics', '生物医药', '南向', '中型股', '2017-06', 'active', 'manual', ''),
    ('09888', '小鹏汽车-W', 'XPeng', '新能源汽车', '南向', '中型股', '2021-07', 'active', 'manual', ''),
    ('09881', '理想汽车-W', 'Li Auto', '新能源汽车', '南向', '中型股', '2024-03', 'active', 'manual', '')
ON CONFLICT (stock_code) DO UPDATE SET
    updated_at = NOW(),
    notes = EXCLUDED.notes,
    inclusion_date = COALESCE(EXCLUDED.inclusion_date, hk_stock_connect.inclusion_date);

-- =====================================================
-- 恒生指数成分股初始数据
-- =====================================================

INSERT INTO hsi_constituents (stock_code, stock_name, stock_name_en, industry, index_type, weight, status)
VALUES 
    ('00700', '腾讯控股', 'Tencent Holdings', '互联网', 'HSI', 8.5, 'active'),
    ('09988', '阿里巴巴', 'Alibaba Group', '互联网', 'HSI', 8.0, 'active'),
    ('03690', '美团', 'Meituan', '消费', 'HSI', 4.5, 'active'),
    ('01810', '小米集团', 'Xiaomi Group', '科技', 'HSI', 3.5, 'active'),
    ('00941', '中国移动', 'China Mobile', '电讯', 'HSI', 3.5, 'active'),
    ('00939', '建设银行', 'CCB', '银行', 'HSI', 3.0, 'active'),
    ('09688', '友邦保险', 'AIA', '保险', 'HSI', 3.0, 'active'),
    ('02382', '舜宇光学', 'Sunny Optical', '科技', 'HSI', 2.5, 'active'),
    ('09618', '京东集团', 'JD.com', '互联网', 'HSI', 2.5, 'active'),
    ('09909', '网易', 'NetEase', '互联网', 'HSI', 2.5, 'active'),
    ('02628', '中国人寿', 'China Life', '保险', 'HSI', 2.5, 'active'),
    ('02318', '中国平安', 'Ping An', '保险', 'HSI', 2.5, 'active'),
    ('03888', '海底捞', 'Haidilao', '消费', 'HSI', 2.0, 'active'),
    ('06690', '海尔智家', 'Haier Smart Home', '家电', 'HSI', 2.0, 'active'),
    ('00101', '长和', 'CKH Holdings', '综合', 'HSI', 2.0, 'active'),
    ('09961', '百度集团', 'Baidu', '互联网', 'HSI', 2.0, 'active')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 创建更新记录的函数
-- =====================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE OR REPLACE TRIGGER update_hk_stock_connect_timestamp
    BEFORE UPDATE ON hk_stock_connect
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER update_hsi_timestamp
    BEFORE UPDATE ON hsi_constituents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER update_msci_timestamp
    BEFORE UPDATE ON msci_constituents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE TRIGGER update_ftse_timestamp
    BEFORE UPDATE ON ftse_constituents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
