/**
 * 用户反馈收集系统
 */

import { supabaseAdmin } from './supabase';

export interface FeedbackInput {
  expertId: string;
  interactionId: string;
  userId?: string;
  rating: 'thumbs_up' | 'thumbs_down' | 'neutral';
  feedback?: string;
  improvementSuggestion?: string;
  context?: { question: string; response: string; stockCode?: string; timestamp: string; };
}

export class FeedbackCollector {
  
  async submitFeedback(input: FeedbackInput): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
    try {
      const rating = this.normalizeRating(input.rating);
      const res = await supabaseAdmin.from('expert_feedback').insert({
        expert_id: input.expertId, interaction_id: input.interactionId, user_id: input.userId,
        rating: rating, feedback: input.feedback, improvement_suggestion: input.improvementSuggestion,
        question_context: input.context?.question, response_context: input.context?.response,
        stock_code: input.context?.stockCode, created_at: new Date().toISOString()
      });
      await this.updateExpertStats(input.expertId);
      return { success: true, feedbackId: res.data?.[0]?.id };
    } catch (error: any) { return { success: false, error: error.message }; }
  }

  private normalizeRating(rating: string): string {
    const mapping: Record<string, string> = { 'thumbs_up': 'positive', 'thumbs_down': 'negative', 'neutral': 'neutral' };
    return mapping[rating] || 'neutral';
  }

  private async updateExpertStats(expertId: string): Promise<void> {
    try {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const res = await supabaseAdmin.from('expert_feedback').select('rating')
        .eq('expert_id', expertId).gte('created_at', weekAgo.toISOString());
      const data = res.data;
      if (!data) return;
      const total = data.length, positive = data.filter((f: any) => f.rating === 'positive').length;
      await supabaseAdmin.from('experts').update({ feedback_count: total, positive_rate: total > 0 ? positive / total : 0, last_feedback_at: new Date().toISOString() }).eq('id', expertId);
    } catch (e) { console.error('更新专家统计失败:', e); }
  }

  async getFeedbackSummary(expertId: string): Promise<{ expertId: string; totalFeedback: number; positiveRate: number; recentTrends: string; topSuggestions: string[]; commonComplaints: string[]; } | null> {
    try {
      const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
      const res = await supabaseAdmin.from('expert_feedback').select('rating, improvement_suggestion, feedback, created_at')
        .eq('expert_id', expertId).gte('created_at', monthAgo.toISOString()).order('created_at', { ascending: false });
      const data = res.data;
      if (!data) return null;
      const totalFeedback = data.length;
      const positiveCount = data.filter((f: any) => f.rating === 'positive').length;
      const positiveRate = totalFeedback > 0 ? positiveCount / totalFeedback : 0;
      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const recent = data.filter((f: any) => new Date(f.created_at) >= twoWeeksAgo);
      const older = data.filter((f: any) => new Date(f.created_at) < twoWeeksAgo);
      const recentRate = recent.length > 0 ? recent.filter((f: any) => f.rating === 'positive').length / recent.length : 0;
      const olderRate = older.length > 0 ? older.filter((f: any) => f.rating === 'positive').length / older.length : 0;
      let trends = 'stable';
      if (recentRate - olderRate > 0.1) trends = 'improving';
      else if (olderRate - recentRate > 0.1) trends = 'declining';
      const suggestions = data.filter((f: any) => f.improvement_suggestion).map((f: any) => f.improvement_suggestion);
      const complaints = data.filter((f: any) => f.rating === 'negative' && f.feedback).map((f: any) => f.feedback);
      return { expertId, totalFeedback, positiveRate, recentTrends: trends, topSuggestions: this.mostCommon(suggestions, 5), commonComplaints: this.mostCommon(complaints, 5) };
    } catch (error) { console.error('获取反馈汇总失败:', error); return null; }
  }

  private mostCommon(items: string[], n: number): string[] {
    const freq: Record<string, number> = {};
    items.forEach(item => { freq[item] = (freq[item] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([item]) => item);
  }

  async getExpertsNeedingOptimization(): Promise<string[]> {
    try {
      const res = await supabaseAdmin.from('experts').select('id, positive_rate, feedback_count').gte('feedback_count', 10);
      const data = res.data;
      if (!data) return [];
      return data.filter((e: any) => e.positive_rate < 0.7).map((e: any) => e.id);
    } catch (error) { console.error('获取需要优化的专家失败:', error); return []; }
  }

  async getAllExpertsFeedbackStatus(): Promise<Record<string, any>> {
    try {
      const res = await supabaseAdmin.from('experts').select('id');
      const data = res.data;
      if (!data) return {};
      const statuses: Record<string, any> = {};
      for (const expert of data) {
        const summary = await this.getFeedbackSummary(expert.id);
        if (summary) statuses[expert.id] = summary;
      }
      return statuses;
    } catch (error) { console.error('获取所有专家反馈状态失败:', error); return {}; }
  }
}

export const feedbackCollector = new FeedbackCollector();
