/**
 * Prompt自动优化器
 */

import { supabaseAdmin } from './supabase';
import { feedbackCollector } from './feedback-collector';
import { caseLearner } from './case-learner';

export interface OptimizationResult {
  expertId: string; newPrompt: string; version: string; changes: any[]; confidence: number;
}

export class PromptOptimizer {

  async optimizePrompt(expertId: string): Promise<OptimizationResult | null> {
    try {
      const currentPrompt = await this.getCurrentPrompt(expertId);
      if (!currentPrompt) return null;
      const feedback = await feedbackCollector.getFeedbackSummary(expertId);
      const insights = await caseLearner.getLearningInsights(expertId, 20);
      const suggestions = this.generateSuggestions(feedback, insights);
      const { newPrompt, changes } = this.applyOptimizations(currentPrompt.prompt, suggestions);
      const version = this.bumpVersion(currentPrompt.version);
      await this.saveOptimizationResult(expertId, newPrompt, version, changes);
      return { expertId, newPrompt, version, changes, confidence: suggestions.length > 0 ? 0.7 : 0.5 };
    } catch (error) { console.error('优化Prompt失败:', error); return null; }
  }

  private async getCurrentPrompt(expertId: string): Promise<{ prompt: string; version: string } | null> {
    try {
      const res = await supabaseAdmin.from('experts').select('system_prompt, version').eq('id', expertId);
      const data = res.data;
      if (!data || data.length === 0) return null;
      return { prompt: data[0].system_prompt || '', version: data[0].version || '1.0.0' };
    } catch (error) { return null; }
  }

  private generateSuggestions(feedback: any, insights: any[]): string[] {
    const suggestions: string[] = [];
    if (feedback?.commonComplaints) feedback.commonComplaints.forEach((c: string) => suggestions.push(`改进: ${c}`));
    if (feedback?.topSuggestions) feedback.topSuggestions.forEach((s: string) => suggestions.push(`补充: ${s}`));
    insights.slice(0, 5).forEach((i: any) => suggestions.push(i.insight));
    return suggestions;
  }

  private applyOptimizations(prompt: string, suggestions: string[]): { newPrompt: string; changes: any[] } {
    let newPrompt = prompt;
    const changes: any[] = [];
    suggestions.slice(0, 3).forEach((s, i) => { newPrompt += `\n\n【优化${i + 1}】${s}`; changes.push({ type: 'added', content: s }); });
    return { newPrompt, changes };
  }

  private bumpVersion(currentVersion: string): string {
    const [major, minor] = currentVersion.split('.').map(Number);
    return `${major}.${minor + 1}.0`;
  }

  private async saveOptimizationResult(expertId: string, newPrompt: string, version: string, changes: any[]): Promise<void> {
    try {
      await supabaseAdmin.from('expert_prompt_history').insert({ expert_id: expertId, prompt_content: newPrompt, version, changes, created_at: new Date().toISOString() });
      await supabaseAdmin.from('experts').update({ system_prompt: newPrompt, version, last_updated: new Date().toISOString() }).eq('id', expertId);
    } catch (error) { console.error('保存优化结果失败:', error); }
  }

  async getPromptHistory(expertId: string, limit: number = 10): Promise<any[]> {
    try {
      const res = await supabaseAdmin.from('expert_prompt_history').select('*').eq('expert_id', expertId).order('created_at', { ascending: false }).limit(limit);
      return res.data || [];
    } catch (error) { return []; }
  }

  async rollbackToVersion(expertId: string, version: string): Promise<boolean> {
    try {
      const res = await supabaseAdmin.from('expert_prompt_history').select('prompt_content').eq('expert_id', expertId).eq('version', version);
      const data = res.data;
      if (!data || data.length === 0) return false;
      await supabaseAdmin.from('experts').update({ system_prompt: data[0].prompt_content, last_updated: new Date().toISOString() }).eq('id', expertId);
      return true;
    } catch (error) { return false; }
  }

  async optimizeAllExperts(): Promise<Record<string, OptimizationResult>> {
    const expertsToOptimize = await feedbackCollector.getExpertsNeedingOptimization();
    const results: Record<string, OptimizationResult> = {};
    for (const expertId of expertsToOptimize) {
      const result = await this.optimizePrompt(expertId);
      if (result) results[expertId] = result;
    }
    return results;
  }

  async generateOptimizationReport(expertId: string): Promise<string> {
    const feedback = await feedbackCollector.getFeedbackSummary(expertId);
    const insights = await caseLearner.getLearningInsights(expertId, 10);
    const status = await caseLearner.getLearningStatus(expertId);
    let report = `# ${expertId} 优化报告\n\n## 当前状态\n`;
    report += `- 总反馈数: ${feedback?.totalFeedback || 0}\n`;
    report += `- 正面率: ${((feedback?.positiveRate || 0) * 100).toFixed(1)}%\n`;
    report += `- 趋势: ${feedback?.recentTrends || 'unknown'}\n\n`;
    report += `## 学习情况\n`;
    report += `- 学习案例数: ${status.totalCases}\n`;
    report += `- 成功案例: ${status.successCases}\n`;
    report += `- 热门关键词: ${status.topKeywords.join(', ') || '无'}\n`;
    return report;
  }
}

export const promptOptimizer = new PromptOptimizer();
