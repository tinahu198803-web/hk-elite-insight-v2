/**
 * 专家Agent自我进化引擎
 */

import { supabaseAdmin } from './supabase';

export interface ExpertEvolution {
  expertId: string;
  version: string;
  learningCycle: number;
  status: 'learning' | 'optimizing' | 'stable';
  lastUpdate: string;
  metrics: EvolutionMetrics;
}

export interface EvolutionMetrics {
  totalInteractions: number;
  positiveFeedback: number;
  negativeFeedback: number;
  knowledgeGaps: string[];
  successfulCases: number;
  improvementAreas: string[];
}

export class ExpertEvolutionEngine {
  private expertId: string;
  private evolutionData: ExpertEvolution;
  
  constructor(expertId: string) {
    this.expertId = expertId;
    this.evolutionData = this.initEvolutionData();
  }

  private initEvolutionData(): ExpertEvolution {
    return {
      expertId: this.expertId,
      version: '1.0.0',
      learningCycle: 0,
      status: 'stable',
      lastUpdate: new Date().toISOString(),
      metrics: { totalInteractions: 0, positiveFeedback: 0, negativeFeedback: 0, knowledgeGaps: [], successfulCases: 0, improvementAreas: [] }
    };
  }

  async collectFeedback(feedback: { expertId: string; interactionId: string; rating: string; feedback?: string; improvementSuggestion?: string }): Promise<void> {
    const rating = feedback.rating === 'positive' ? 'positive' : feedback.rating === 'negative' ? 'negative' : 'neutral';
    try {
      await supabaseAdmin.from('expert_feedback').insert({
        expert_id: feedback.expertId, interaction_id: feedback.interactionId, rating,
        feedback: feedback.feedback, improvement_suggestion: feedback.improvementSuggestion, created_at: new Date().toISOString()
      });
    } catch (e) { console.error('保存反馈失败:', e); }
    this.evolutionData.metrics.totalInteractions++;
    if (feedback.rating === 'positive') this.evolutionData.metrics.positiveFeedback++;
    else if (feedback.rating === 'negative') this.evolutionData.metrics.negativeFeedback++;
  }

  getEvolutionStatus(): ExpertEvolution { return this.evolutionData; }

  async persistEvolutionData(): Promise<void> {
    try {
      // 先尝试更新，如果不存在再插入
      await supabaseAdmin.from('expert_evolution').update({
        version: this.evolutionData.version, learning_cycle: this.evolutionData.learningCycle,
        status: this.evolutionData.status, last_update: new Date().toISOString(), metrics: this.evolutionData.metrics
      }).eq('expert_id', this.evolutionData.expertId);
    } catch (e) {
      // 更新失败则插入
      try {
        await supabaseAdmin.from('expert_evolution').insert({
          expert_id: this.evolutionData.expertId, version: this.evolutionData.version,
          learning_cycle: this.evolutionData.learningCycle, status: this.evolutionData.status,
          last_update: new Date().toISOString(), metrics: this.evolutionData.metrics
        });
      } catch (e2) { console.error('持久化进化数据失败:', e2); }
    }
  }

  async learnFromMarketData(newData: any): Promise<void> {
    const insights = this.analyzeMarketData(newData);
    try {
      await supabaseAdmin.from('expert_learned_cases').insert({
        expert_id: this.expertId, case_type: 'learning', content: JSON.stringify(newData),
        keywords: [], insights, source: 'market_data', created_at: new Date().toISOString(), used_count: 0
      });
    } catch (e) { console.error('学习市场数据失败:', e); }
    this.evolutionData.learningCycle++;
    await this.persistEvolutionData();
  }

  private analyzeMarketData(data: any): string[] {
    const insights: string[] = [];
    if (data.marketCap) insights.push(`市值: ${data.marketCap}`);
    if (data.indexChanges) insights.push(`指数变动: ${JSON.stringify(data.indexChanges)}`);
    if (data.ruleUpdates) insights.push(`规则更新: ${data.ruleUpdates}`);
    return insights;
  }

  async optimizePrompt(): Promise<string> {
    this.evolutionData.status = 'optimizing';
    this.evolutionData.learningCycle++;
    const [major, minor] = this.evolutionData.version.split('.').map(Number);
    this.evolutionData.version = `${major}.${minor + 1}.0`;
    await this.persistEvolutionData();
    return this.evolutionData.version;
  }
}

export function createEvolutionEngine(expertId: string): ExpertEvolutionEngine {
  return new ExpertEvolutionEngine(expertId);
}
