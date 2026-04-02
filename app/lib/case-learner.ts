/**
 * 案例自动学习模块
 */

import { supabaseAdmin } from './supabase';

export interface IpoCase {
  stockCode: string;
  companyName: string;
  listingDate: string;
  issuePrice: number;
  listingPrice: number;
  marketCap: number;
  industry: string;
  listingType: 'main_board' | 'gem';
  fundraising: number;
  outcome: 'success' | 'failure' | 'partial';
}

export interface LearningInsight {
  expertId: string;
  insight: string;
  source: string;
  confidence: number;
  applied: boolean;
  createdAt: string;
}

export class CaseLearner {

  async learnFromIpoCase(ipoCase: IpoCase): Promise<void> {
    try {
      const successFactors = this.extractSuccessFactors(ipoCase);
      const insights = this.generateInsights(ipoCase, successFactors);
      await this.storeIpoCase(ipoCase, successFactors);
      await this.distributeToExperts(ipoCase, insights);
      console.log(`学习IPO案例: ${ipoCase.companyName} (${ipoCase.stockCode})`);
    } catch (error) {
      console.error('学习IPO案例失败:', error);
    }
  }

  private extractSuccessFactors(ipoCase: IpoCase): string[] {
    const factors: string[] = [];
    if (ipoCase.listingPrice > ipoCase.issuePrice) factors.push('IPO定价合理，存在上涨空间');
    if (ipoCase.marketCap > 10000000000) factors.push('市值规模较大，流动性好');
    if (ipoCase.fundraising > 1000000000) factors.push('募资规模适中，投资者认可度高');
    factors.push(`行业: ${ipoCase.industry}`);
    factors.push(`上市结果: ${ipoCase.outcome === 'success' ? '成功' : '表现不佳'}`);
    return factors;
  }

  private generateInsights(ipoCase: IpoCase, factors: string[]): string[] {
    const insights: string[] = [];
    factors.forEach(factor => insights.push(`${ipoCase.companyName}: ${factor}`));
    insights.push(`[${ipoCase.industry}]行业IPO特点分析`);
    const priceChange = ((ipoCase.listingPrice - ipoCase.issuePrice) / ipoCase.issuePrice * 100).toFixed(2);
    insights.push(`定价策略: 发行价${ipoCase.issuePrice}元，首日收盘${ipoCase.listingPrice}元，涨幅${priceChange}%`);
    return insights;
  }

  private async storeIpoCase(ipoCase: IpoCase, factors: string[]): Promise<void> {
    try {
      await supabaseAdmin.from('ipo_learned_cases').insert({
        stock_code: ipoCase.stockCode, company_name: ipoCase.companyName, listing_date: ipoCase.listingDate,
        issue_price: ipoCase.issuePrice, listing_price: ipoCase.listingPrice, market_cap: ipoCase.marketCap,
        industry: ipoCase.industry, listing_type: ipoCase.listingType, fundraising: ipoCase.fundraising,
        outcome: ipoCase.outcome, success_factors: factors, created_at: new Date().toISOString()
      });
    } catch (e) { console.error('存储IPO案例失败:', e); }
  }

  private async distributeToExperts(ipoCase: IpoCase, insights: string[]): Promise<void> {
    const relevantExperts = this.identifyRelevantExperts(ipoCase);
    for (const expertId of relevantExperts) {
      for (const insight of insights) {
        try {
          await supabaseAdmin.from('expert_learned_cases').insert({
            expert_id: expertId, case_type: ipoCase.outcome === 'success' ? 'success' : 'learning',
            content: JSON.stringify(ipoCase), keywords: [ipoCase.industry, ipoCase.listingType],
            insights: [insight], source: 'market_data', created_at: new Date().toISOString(), used_count: 0
          });
        } catch (e) { console.error('分发案例失败:', e); }
      }
    }
  }

  private identifyRelevantExperts(ipoCase: IpoCase): string[] {
    const experts: string[] = ['ipo-analysis', 'valuation'];
    if (ipoCase.outcome === 'success') experts.push('index-inclusion', 'stock-connect-planning');
    if (ipoCase.marketCap > 5000000000) experts.push('market-cap-maintenance');
    return experts;
  }

  async learnFromMarketData(data: { indexChanges?: any[]; ruleUpdates?: any[]; marketTrends?: any[] }): Promise<void> {
    if (data.indexChanges) {
      for (const change of data.indexChanges) {
        try {
          await supabaseAdmin.from('expert_learned_cases').insert({
            expert_id: 'index-inclusion', case_type: 'learning', content: JSON.stringify(change),
            keywords: [change.indexName, change.action], insights: [`指数变动: ${change.indexName}被${change.action}`],
            source: 'market_data', created_at: new Date().toISOString(), used_count: 0
          });
        } catch (e) { console.error('学习指数变动失败:', e); }
      }
    }
  }

  async getLearningInsights(expertId: string, limit: number = 10): Promise<LearningInsight[]> {
    try {
      const res = await supabaseAdmin.from('expert_learned_cases')
        .select('*').eq('expert_id', expertId).eq('case_type', 'success')
        .order('created_at', { ascending: false }).limit(limit);
      const data = res.data;
      if (!data) return [];
      return data.map((row: any) => ({
        expertId: row.expert_id, insight: row.insights?.[0] || row.content,
        source: row.source, confidence: row.used_count > 5 ? 0.9 : 0.6, applied: false, createdAt: row.created_at
      }));
    } catch (error) { console.error('获取学习洞察失败:', error); return []; }
  }

  async getLearningStatus(expertId: string): Promise<{ totalCases: number; successCases: number; lastLearnedAt: string; topKeywords: string[] }> {
    try {
      const res = await supabaseAdmin.from('expert_learned_cases')
        .select('case_type, keywords, created_at').eq('expert_id', expertId)
        .order('created_at', { ascending: false }).limit(100);
      const data = res.data;
      if (!data) return { totalCases: 0, successCases: 0, lastLearnedAt: '', topKeywords: [] };
      const keywordCount: Record<string, number> = {};
      data.forEach((c: any) => { (c.keywords || []).forEach((kw: string) => { keywordCount[kw] = (keywordCount[kw] || 0) + 1; }); });
      const topKeywords = Object.entries(keywordCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([kw]) => kw);
      return { totalCases: data.length, successCases: data.filter((c: any) => c.case_type === 'success').length, lastLearnedAt: data[0]?.created_at || '', topKeywords };
    } catch (error) { console.error('获取学习状态失败:', error); return { totalCases: 0, successCases: 0, lastLearnedAt: '', topKeywords: [] }; }
  }
}

export const caseLearner = new CaseLearner();
