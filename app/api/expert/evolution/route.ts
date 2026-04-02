/**
 * 专家进化API路由
 * 提供自我学习、自我进化的API接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { feedbackCollector } from '@/app/lib/feedback-collector';
import { caseLearner } from '@/app/lib/case-learner';
import { promptOptimizer } from '@/app/lib/prompt-optimizer';
import { ruleChangeTracker } from '@/app/lib/rule-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const expertId = searchParams.get('expertId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (action) {
      case 'status':
        if (!expertId) {
          // 获取所有专家状态
          const statuses = await feedbackCollector.getAllExpertsFeedbackStatus();
          return NextResponse.json({ success: true, data: statuses });
        }
        // 获取单个专家状态
        const learningStatus = await caseLearner.getLearningStatus(expertId);
        return NextResponse.json({ success: true, data: { learning: learningStatus } });

      case 'rules':
        const history = await ruleChangeTracker.getRuleUpdateHistory(
          category as any,
          limit
        );
        return NextResponse.json({ success: true, data: history });

      case 'insights':
        if (!expertId) {
          return NextResponse.json({ success: false, error: '缺少expertId' }, { status: 400 });
        }
        const insights = await caseLearner.getLearningInsights(expertId, limit);
        return NextResponse.json({ success: true, data: insights });

      case 'history':
        if (!expertId) {
          return NextResponse.json({ success: false, error: '缺少expertId' }, { status: 400 });
        }
        const promptHistory = await promptOptimizer.getPromptHistory(expertId, limit);
        return NextResponse.json({ success: true, data: promptHistory });

      case 'report':
        if (!expertId) {
          return NextResponse.json({ success: false, error: '缺少expertId' }, { status: 400 });
        }
        const report = await promptOptimizer.generateOptimizationReport(expertId);
        return NextResponse.json({ success: true, data: { report } });

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'feedback':
        const { expertId, interactionId, userId, rating, feedback, improvementSuggestion, context } = body;
        if (!expertId || !interactionId || !rating) {
          return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
        }
        const result = await feedbackCollector.submitFeedback({
          expertId, interactionId, userId, rating, feedback, improvementSuggestion, context
        });
        return NextResponse.json(result);

      case 'optimize':
        if (!body.expertId) {
          return NextResponse.json({ success: false, error: '缺少expertId' }, { status: 400 });
        }
        const optResult = await promptOptimizer.optimizePrompt(body.expertId);
        if (!optResult) {
          return NextResponse.json({ success: false, error: '优化失败' }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          data: {
            version: optResult.version,
            changesCount: optResult.changes.length,
            confidence: optResult.confidence
          }
        });

      case 'optimize-all':
        const allResults = await promptOptimizer.optimizeAllExperts();
        const summary = Object.entries(allResults).map(([eid, r]) => ({
          expertId: eid, version: r.version, changesCount: r.changes.length
        }));
        return NextResponse.json({ success: true, data: { optimizedCount: summary.length, details: summary } });

      case 'check-rules':
        const updates = await ruleChangeTracker.checkAllRules();
        return NextResponse.json({
          success: true,
          data: {
            newUpdatesCount: updates.length,
            updates: updates.map(u => ({
              category: u.ruleCategory, title: u.title,
              impact: u.impactLevel, affectedExperts: u.affectedExperts
            }))
          }
        });

      case 'learn-case':
        await caseLearner.learnFromIpoCase(body);
        return NextResponse.json({ success: true, message: '案例学习成功' });

      case 'rollback':
        if (!body.expertId || !body.version) {
          return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
        }
        const success = await promptOptimizer.rollbackToVersion(body.expertId, body.version);
        return NextResponse.json({ success, message: success ? '回滚成功' : '回滚失败' });

      default:
        return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
