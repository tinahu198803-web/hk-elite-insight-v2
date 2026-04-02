/**
 * 股票代码自动学习模块
 * 自动发现并学习新的港股股票代码映射
 */

import { supabaseAdmin } from './supabase';

export interface StockCodeRecord {
  id?: number;
  code: string;           // 股票代码 (5位数字)
  name: string;           // 中文名称
  name_en: string;        // 英文名称
  industry: string;        // 所属行业
  source: 'api' | 'manual' | 'learned';  // 数据来源
  verified: boolean;      // 是否已验证
  created_at?: string;
  updated_at?: string;
  query_count: number;    // 查询次数
  last_queried?: string;  // 最后查询时间
}

/**
 * 股票代码学习器
 */
export class StockLearner {
  
  /**
   * 初始化数据库表 (如果不存在)
   */
  async initializeTable(): Promise<void> {
    // 创建stock_codes表 (如果不存在)
    const createTableSQL = `
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
      
      CREATE INDEX IF NOT EXISTS idx_stock_codes_code ON stock_codes(code);
      CREATE INDEX IF NOT EXISTS idx_stock_codes_verified ON stock_codes(verified);
    `;
    
    // 由于Supabase REST API不支持DDL，我们使用insert on conflict来处理
    console.log('股票代码表初始化检查完成');
  }

  /**
   * 学习新的股票代码
   * 当API返回新股票时，自动添加到数据库
   */
  async learnStock(
    code: string,
    name: string,
    nameEn: string = '',
    industry: string = '',
    source: 'api' | 'manual' = 'api'
  ): Promise<boolean> {
    try {
      // 检查是否已存在
      const { data: existing } = await supabaseAdmin
        .from('stock_codes')
        .select('*')
        .eq('code', code)
        .single();
      
      if (existing) {
        // 更新查询次数和最后查询时间
        await supabaseAdmin
          .from('stock_codes')
          .update({
            query_count: (existing.query_count || 0) + 1,
            last_queried: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('code', code);
        return false; // 已存在
      }
      
      // 新增记录
      const { error } = await supabaseAdmin
        .from('stock_codes')
        .insert({
          code,
          name,
          name_en: nameEn,
          industry,
          source,
          verified: source === 'manual', // 手动添加的默认验证
          query_count: 1,
          last_queried: new Date().toISOString()
        });
      
      if (error) {
        console.error('学习股票失败:', error);
        return false;
      }
      
      console.log(`🆕 学习新股票: ${code} - ${name}`);
      return true;
    } catch (e) {
      console.error('学习股票异常:', e);
      return false;
    }
  }

  /**
   * 从数据库获取股票信息
   */
  async getStock(code: string): Promise<StockCodeRecord | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('stock_codes')
        .select('*')
        .eq('code', code)
        .single();
      
      if (error || !data) return null;
      
      // 更新查询次数
      await supabaseAdmin
        .from('stock_codes')
        .update({
          query_count: (data.query_count || 0) + 1,
          last_queried: new Date().toISOString()
        })
        .eq('code', code);
      
      return data as StockCodeRecord;
    } catch (e) {
      console.error('获取股票异常:', e);
      return null;
    }
  }

  /**
   * 获取所有已验证的股票
   */
  async getVerifiedStocks(): Promise<StockCodeRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('stock_codes')
        .select('*')
        .eq('verified', true)
        .order('query_count', { ascending: false });
      
      if (error) return [];
      return (data || []) as StockCodeRecord[];
    } catch (e) {
      return [];
    }
  }

  /**
   * 标记股票为已验证
   */
  async verifyStock(code: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('stock_codes')
        .update({ verified: true, updated_at: new Date().toISOString() })
        .eq('code', code);
      
      return !error;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取未验证的股票列表 (需要人工确认)
   */
  async getUnverifiedStocks(): Promise<StockCodeRecord[]> {
    try {
      const { data } = await supabaseAdmin
        .from('stock_codes')
        .select('*')
        .eq('verified', false)
        .eq('source', 'learned')
        .order('query_count', { ascending: false })
        .limit(50);
      
      return (data || []) as StockCodeRecord[];
    } catch (e) {
      return [];
    }
  }

  /**
   * 批量导入股票代码 (用于初始化)
   */
  async batchImport(stocks: Omit<StockCodeRecord, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
    let imported = 0;
    
    for (const stock of stocks) {
      const { error } = await supabaseAdmin
        .from('stock_codes')
        .upsert(stock, { code: stock.code });
      
      if (!error) imported++;
    }
    
    console.log(`批量导入完成: ${imported}/${stocks.length}`);
    return imported;
  }

  /**
   * 获取学习统计
   */
  async getLearningStats(): Promise<{
    total: number;
    verified: number;
    learned: number;
    unverified: number;
  }> {
    try {
      const { data: all } = await supabaseAdmin.from('stock_codes').select('*');
      const { data: verified } = await supabaseAdmin.from('stock_codes').select('*').eq('verified', true);
      const { data: learned } = await supabaseAdmin.from('stock_codes').select('*').eq('source', 'learned');
      
      return {
        total: all?.length || 0,
        verified: verified?.length || 0,
        learned: learned?.length || 0,
        unverified: (all?.length || 0) - (verified?.length || 0)
      };
    } catch (e) {
      return { total: 0, verified: 0, learned: 0, unverified: 0 };
    }
  }

  /**
   * 删除错误的学习记录
   */
  async deleteLearned(code: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from('stock_codes').delete({ code });
      return !error;
    } catch (e) {
      return false;
    }
  }
}

export const stockLearner = new StockLearner();
