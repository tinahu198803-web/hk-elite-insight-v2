/**
 * 规则变化追踪器
 */

import { supabaseAdmin } from './supabase';

export interface RuleUpdate {
  id: string; ruleCategory: string; title: string; content: string;
  source: string; sourceUrl: string; impactLevel: string; affectedExperts: string[];
  processed: boolean; createdAt: string;
}

const RULE_SOURCES = [
  { name: '恒生指数公司', category: 'hsi', checkInterval: 24 },
  { name: 'MSCI官网', category: 'msci', checkInterval: 24 },
  { name: '富时罗素', category: 'ftse', checkInterval: 24 },
  { name: '港交所', category: 'hkex', checkInterval: 12 },
  { name: '香港证监会', category: 'sec', checkInterval: 24 }
];

async function webSearch(query: string): Promise<any[]> {
  try {
    const BING_API_KEY = process.env.BING_SEARCH_API_KEY;
    if (BING_API_KEY) {
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY } }
      );
      const data = await response.json();
      return (data.webPages?.value || []).map((item: any) => ({ title: item.name, snippet: item.snippet, url: item.url }));
    }
    return [];
  } catch (error) { return []; }
}

export class RuleChangeTracker {

  async checkAllRules(): Promise<RuleUpdate[]> {
    const updates: RuleUpdate[] = [];
    for (const source of RULE_SOURCES) {
      const sourceUpdates = await this.checkSourceRules(source);
      updates.push(...sourceUpdates);
    }
    if (updates.length > 0) {
      await this.saveRuleUpdates(updates);
      await this.notifyAffectedExperts(updates);
    }
    return updates;
  }

  private async checkSourceRules(source: any): Promise<RuleUpdate[]> {
    const updates: RuleUpdate[] = [];
    const queryMap: Record<string, string[]> = {
      'hsi': ['恒生指数 纳入规则 更新'], 'msci': ['MSCI指数 调整'], 'ftse': ['FTSE Russell 指数'],
      'hkex': ['港交所 上市规则 修订'], 'sec': ['证监会 规定 更新']
    };
    const queries = queryMap[source.category] || [];
    for (const query of queries.slice(0, 2)) {
      try {
        const results = await webSearch(`${query} 2024`);
        for (const result of results) {
          const isNew = await this.isNewUpdate(result.title, source.category);
          if (isNew) updates.push(this.createRuleUpdate(result, source));
        }
      } catch (e) { console.error(`搜索${query}失败:`, e); }
    }
    return updates;
  }

  private async isNewUpdate(title: string, category: string): Promise<boolean> {
    try {
      const res = await supabaseAdmin.from('rule_updates').select('id').eq('title', title).eq('rule_category', category);
      const data = res.data;
      return !data || data.length === 0;
    } catch (error) { return true; }
  }

  private createRuleUpdate(result: any, source: any): RuleUpdate {
    const impactLevel = result.title.includes('重大') || result.title.includes('major') ? 'high' : 'medium';
    const expertMap: Record<string, string[]> = {
      'hsi': ['index-inclusion', 'health-check'], 'msci': ['index-inclusion', 'stock-connect-planning'],
      'ftse': ['index-inclusion'], 'hkex': ['compliance', 'listing-path'], 'sec': ['compliance', 'valuation']
    };
    return {
      id: `rule_${Date.now()}`, ruleCategory: source.category, title: result.title, content: result.snippet,
      source: source.name, sourceUrl: result.url, impactLevel, affectedExperts: expertMap[source.category] || [],
      processed: false, createdAt: new Date().toISOString()
    };
  }

  private async saveRuleUpdates(updates: RuleUpdate[]): Promise<void> {
    try {
      for (const u of updates) {
        await supabaseAdmin.from('rule_updates').insert({
          rule_category: u.ruleCategory, title: u.title, content: u.content, source: u.source,
          source_url: u.sourceUrl, impact_level: u.impactLevel, affected_experts: u.affectedExperts,
          processed: false, created_at: u.createdAt
        });
      }
    } catch (e) { console.error('保存规则更新失败:', e); }
  }

  private async notifyAffectedExperts(updates: RuleUpdate[]): Promise<void> {
    for (const update of updates) {
      for (const expertId of update.affectedExperts) {
        try {
          await supabaseAdmin.from('expert_learned_cases').insert({
            expert_id: expertId, case_type: 'learning',
            content: `【规则更新】${update.title}\n\n${update.content}`,
            keywords: [update.ruleCategory, update.impactLevel],
            insights: [`规则更新(${update.impactLevel}): ${update.title}`],
            source: 'rule_update', created_at: new Date().toISOString(), used_count: 0
          });
        } catch (e) { console.error('添加规则到知识库失败:', e); }
      }
    }
  }

  async getUnprocessedUpdates(): Promise<RuleUpdate[]> {
    try {
      const res = await supabaseAdmin.from('rule_updates').select('*').eq('processed', false).order('created_at', { ascending: false });
      const data = res.data;
      if (!data) return [];
      return data.map((row: any) => ({ id: row.id, ruleCategory: row.rule_category, title: row.title, content: row.content, source: row.source, sourceUrl: row.source_url, impactLevel: row.impact_level, affectedExperts: row.affected_experts, processed: row.processed, createdAt: row.created_at }));
    } catch (e) { return []; }
  }

  async markAsProcessed(updateId: string): Promise<void> {
    try { await supabaseAdmin.from('rule_updates').update({ processed: true }).eq('id', updateId); }
    catch (e) { console.error('标记处理失败:', e); }
  }

  async getRuleUpdateHistory(category?: string, limit: number = 50): Promise<RuleUpdate[]> {
    try {
      let query = supabaseAdmin.from('rule_updates').select('*').order('created_at', { ascending: false }).limit(limit);
      if (category) query = query.eq('rule_category', category);
      const res = await query;
      const data = res.data;
      if (!data) return [];
      return data.map((row: any) => ({ id: row.id, ruleCategory: row.rule_category, title: row.title, content: row.content, source: row.source, sourceUrl: row.source_url, impactLevel: row.impact_level, affectedExperts: row.affected_experts, processed: row.processed, createdAt: row.created_at }));
    } catch (e) { return []; }
  }

  async getExpertRelatedUpdates(expertId: string): Promise<RuleUpdate[]> {
    try {
      const res = await supabaseAdmin.from('rule_updates').select('*').contains('affected_experts', [expertId]).order('created_at', { ascending: false }).limit(20);
      const data = res.data;
      if (!data) return [];
      return data.map((row: any) => ({ id: row.id, ruleCategory: row.rule_category, title: row.title, content: row.content, source: row.source, sourceUrl: row.source_url, impactLevel: row.impact_level, affectedExperts: row.affected_experts, processed: row.processed, createdAt: row.created_at }));
    } catch (e) { return []; }
  }
}

export const ruleChangeTracker = new RuleChangeTracker();
