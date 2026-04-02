-- 专家Agent自我进化系统 - 数据库表结构
-- 运行此脚本在Supabase SQL编辑器中创建所需表

-- =============================================
-- 1. 专家反馈表
-- =============================================
CREATE TABLE IF NOT EXISTS expert_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id VARCHAR(100) NOT NULL,
  interaction_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  rating VARCHAR(20) NOT NULL CHECK (rating IN ('positive', 'neutral', 'negative')),
  feedback TEXT,
  improvement_suggestion TEXT,
  question_context TEXT,
  response_context TEXT,
  stock_code VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_feedback_expert ON expert_feedback(expert_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON expert_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON expert_feedback(created_at DESC);

-- =============================================
-- 2. 专家进化状态表
-- =============================================
CREATE TABLE IF NOT EXISTS expert_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id VARCHAR(100) UNIQUE NOT NULL,
  version VARCHAR(20) DEFAULT '1.0.0',
  learning_cycle INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'stable' CHECK (status IN ('learning', 'optimizing', 'stable')),
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB DEFAULT '{"totalInteractions": 0, "positiveFeedback": 0, "negativeFeedback": 0, "knowledgeGaps": [], "successfulCases": 0, "improvementAreas": []}'
);

-- =============================================
-- 3. 专家学习案例表
-- =============================================
CREATE TABLE IF NOT EXISTS expert_learned_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id VARCHAR(100) NOT NULL,
  case_type VARCHAR(20) NOT NULL CHECK (case_type IN ('success', 'failure', 'learning')),
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  source VARCHAR(50) NOT NULL CHECK (source IN ('user_feedback', 'market_data', 'rule_update')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_count INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cases_expert ON expert_learned_cases(expert_id);
CREATE INDEX IF NOT EXISTS idx_cases_type ON expert_learned_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_source ON expert_learned_cases(source);
CREATE INDEX IF NOT EXISTS idx_cases_created ON expert_learned_cases(created_at DESC);

-- =============================================
-- 4. Prompt历史表
-- =============================================
CREATE TABLE IF NOT EXISTS expert_prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id VARCHAR(100) NOT NULL,
  prompt_content TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  changes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prompt_history_expert ON expert_prompt_history(expert_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_version ON expert_prompt_history(version);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created ON expert_prompt_history(created_at DESC);

-- =============================================
-- 5. 规则更新表
-- =============================================
CREATE TABLE IF NOT EXISTS rule_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_category VARCHAR(50) NOT NULL CHECK (rule_category IN ('hsi', 'msci', 'ftse', 'stock_connect', 'hkex', 'sec', 'sfc')),
  title VARCHAR(500) NOT NULL,
  content TEXT,
  source VARCHAR(200),
  source_url TEXT,
  effective_date DATE,
  published_date DATE,
  impact_level VARCHAR(10) DEFAULT 'low' CHECK (impact_level IN ('high', 'medium', 'low')),
  affected_experts TEXT[] DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rules_category ON rule_updates(rule_category);
CREATE INDEX IF NOT EXISTS idx_rules_impact ON rule_updates(impact_level);
CREATE INDEX IF NOT EXISTS idx_rules_processed ON rule_updates(processed);
CREATE INDEX IF NOT EXISTS idx_rules_created ON rule_updates(created_at DESC);

-- =============================================
-- 6. IPO学习案例表
-- =============================================
CREATE TABLE IF NOT EXISTS ipo_learned_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code VARCHAR(20) NOT NULL,
  company_name VARCHAR(200),
  listing_date DATE,
  issue_price DECIMAL(15, 4),
  listing_price DECIMAL(15, 4),
  market_cap BIGINT,
  industry VARCHAR(100),
  listing_type VARCHAR(20) CHECK (listing_type IN ('main_board', 'gem')),
  fundraising BIGINT,
  outcome VARCHAR(20) CHECK (outcome IN ('success', 'failure', 'partial')),
  success_factors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ipo_stock ON ipo_learned_cases(stock_code);
CREATE INDEX IF NOT EXISTS idx_ipo_industry ON ipo_learned_cases(industry);
CREATE INDEX IF NOT EXISTS idx_ipo_outcome ON ipo_learned_cases(outcome);
CREATE INDEX IF NOT EXISTS idx_ipo_listing ON ipo_learned_cases(listing_date DESC);

-- =============================================
-- 7. 定时任务记录表
-- =============================================
CREATE TABLE IF NOT EXISTS scheduled_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  details JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_logs_name ON scheduled_task_logs(task_name);
CREATE INDEX IF NOT EXISTS idx_task_logs_type ON scheduled_task_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_task_logs_success ON scheduled_task_logs(success);
CREATE INDEX IF NOT EXISTS idx_task_logs_started ON scheduled_task_logs(started_at DESC);

-- =============================================
-- 8. 专家主表更新（添加新字段）
-- =============================================
ALTER TABLE IF NOT EXISTS experts
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS feedback_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_rate DECIMAL(5, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_feedback_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 触发器：自动更新修改时间
-- =============================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expert_evolution_modtime
    BEFORE UPDATE ON expert_evolution
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_expert_prompt_history_modtime
    BEFORE UPDATE ON expert_prompt_history
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================
-- 视图：专家进化状态汇总
-- =============================================
CREATE OR REPLACE VIEW expert_evolution_summary AS
SELECT 
  e.id,
  e.expert_id,
  e.version,
  e.learning_cycle,
  e.status,
  e.last_update,
  e.metrics,
  ex.feedback_count,
  ex.positive_rate,
  ex.last_feedback_at,
  (
    SELECT COUNT(*) 
    FROM expert_learned_cases lc 
    WHERE lc.expert_id = e.expert_id
  ) as total_learned_cases,
  (
    SELECT COUNT(*) 
    FROM expert_learned_cases lc 
    WHERE lc.expert_id = e.expert_id AND lc.case_type = 'success'
  ) as success_cases
FROM expert_evolution e
LEFT JOIN experts ex ON e.expert_id = ex.id;

-- =============================================
-- 权限设置（如果需要）
-- =============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
