/**
 * 定时进化任务
 * 定期执行自我学习、规则追踪、Prompt优化等任务
 */

import { feedbackCollector } from './feedback-collector';
import { promptOptimizer } from './prompt-optimizer';
import { ruleChangeTracker } from './rule-tracker';
import { caseLearner } from './case-learner';

export interface ScheduledTaskResult {
  taskName: string;
  success: boolean;
  executedAt: string;
  details?: any;
  error?: string;
}

export interface EvolutionSchedule {
  checkRules: string;      // 规则检查频率
  optimizeExperts: string; // 专家优化频率
  learnCases: string;      // 案例学习频率
  generateReports: string; // 报告生成频率
}

// 默认调度配置
export const DEFAULT_SCHEDULE: EvolutionSchedule = {
  checkRules: '0 */6 * * *',        // 每6小时检查一次规则
  optimizeExperts: '0 3 * * *',     // 每天凌晨3点优化专家
  learnCases: '0 */4 * * *',        // 每4小时学习案例
  generateReports: '0 9 * * 1'       // 每周一早上9点生成报告
};

/**
 * 进化调度器
 */
export class EvolutionScheduler {

  /**
   * 执行每日进化流程
   */
  async runDailyEvolution(): Promise<ScheduledTaskResult[]> {
    const results: ScheduledTaskResult[] = [];

    console.log('🚀 开始执行每日进化流程...');

    // 1. 检查规则更新
    results.push(await this.executeCheckRules());

    // 2. 检查并优化专家
    results.push(await this.executeExpertOptimization());

    // 3. 生成进化报告
    results.push(await this.generateDailyReport());

    console.log('✅ 每日进化流程完成');
    console.log(`成功: ${results.filter(r => r.success).length}/${results.length}`);

    return results;
  }

  /**
   * 检查规则更新
   */
  private async executeCheckRules(): Promise<ScheduledTaskResult> {
    const startTime = new Date().toISOString();
    
    try {
      console.log('📋 检查规则更新...');
      const updates = await ruleChangeTracker.checkAllRules();

      return {
        taskName: 'checkRules',
        success: true,
        executedAt: startTime,
        details: {
          newUpdates: updates.length,
          highImpact: updates.filter(u => u.impactLevel === 'high').length
        }
      };

    } catch (error: any) {
      console.error('检查规则更新失败:', error);
      return {
        taskName: 'checkRules',
        success: false,
        executedAt: startTime,
        error: error.message
      };
    }
  }

  /**
   * 执行专家优化
   */
  private async executeExpertOptimization(): Promise<ScheduledTaskResult> {
    const startTime = new Date().toISOString();
    
    try {
      console.log('🔧 优化专家...');
      
      // 获取需要优化的专家
      const expertsToOptimize = await feedbackCollector.getExpertsNeedingOptimization();
      
      const results: Record<string, any> = {};
      
      for (const expertId of expertsToOptimize) {
        const result = await promptOptimizer.optimizePrompt(expertId);
        results[expertId] = result ? {
          success: true,
          version: result.version,
          changes: result.changes.length
        } : { success: false };
      }

      return {
        taskName: 'optimizeExperts',
        success: true,
        executedAt: startTime,
        details: {
          optimizedCount: Object.keys(results).length,
          experts: results
        }
      };

    } catch (error: any) {
      console.error('优化专家失败:', error);
      return {
        taskName: 'optimizeExperts',
        success: false,
        executedAt: startTime,
        error: error.message
      };
    }
  }

  /**
   * 生成每日报告
   */
  private async generateDailyReport(): Promise<ScheduledTaskResult> {
    const startTime = new Date().toISOString();
    
    try {
      console.log('📊 生成每日报告...');
      
      const allStatuses = await feedbackCollector.getAllExpertsFeedbackStatus();
      
      const summary = {
        totalExperts: Object.keys(allStatuses).length,
        expertsNeedingAttention: [] as string[],
        overallPositiveRate: 0,
        recentTrends: {
          improving: 0,
          stable: 0,
          declining: 0
        }
      };

      let totalRate = 0;
      Object.entries(allStatuses).forEach(([expertId, status]) => {
        totalRate += status.positiveRate;
        
        if (status.positiveRate < 0.7) {
          summary.expertsNeedingAttention.push(expertId);
        }
        
        summary.recentTrends[status.recentTrends]++;
      });

      summary.overallPositiveRate = summary.totalExperts > 0 
        ? totalRate / summary.totalExperts 
        : 0;

      return {
        taskName: 'generateReport',
        success: true,
        executedAt: startTime,
        details: summary
      };

    } catch (error: any) {
      console.error('生成报告失败:', error);
      return {
        taskName: 'generateReport',
        success: false,
        executedAt: startTime,
        error: error.message
      };
    }
  }

  /**
   * 执行每小时轻量任务
   */
  async runHourlyTasks(): Promise<ScheduledTaskResult[]> {
    const results: ScheduledTaskResult[] = [];

    console.log('⏰ 执行每小时轻量任务...');

    // 1. 检查是否有未处理的规则更新
    results.push(await this.checkUnprocessedRules());

    console.log('⏰ 每小时任务完成');

    return results;
  }

  /**
   * 检查未处理的规则
   */
  private async checkUnprocessedRules(): Promise<ScheduledTaskResult> {
    const startTime = new Date().toISOString();
    
    try {
      const unprocessed = await ruleChangeTracker.getUnprocessedUpdates();

      // 自动处理低影响更新
      const autoProcessed = unprocessed.filter(u => u.impactLevel === 'low');
      for (const update of autoProcessed) {
        await ruleChangeTracker.markAsProcessed(update.id);
      }

      return {
        taskName: 'checkUnprocessedRules',
        success: true,
        executedAt: startTime,
        details: {
          unprocessedCount: unprocessed.length,
          autoProcessedCount: autoProcessed.length,
          pendingManualReview: unprocessed.length - autoProcessed.length
        }
      };

    } catch (error: any) {
      return {
        taskName: 'checkUnprocessedRules',
        success: false,
        executedAt: startTime,
        error: error.message
      };
    }
  }

  /**
   * 执行每周进化总结
   */
  async runWeeklySummary(): Promise<ScheduledTaskResult> {
    const startTime = new Date().toISOString();
    
    try {
      console.log('📈 生成每周总结...');
      
      const allStatuses = await feedbackCollector.getAllExpertsFeedbackStatus();
      const ruleHistory = await ruleChangeTracker.getRuleUpdateHistory(undefined, 100);
      
      const weeklyStats = {
        period: 'last_7_days',
        feedbackStats: {
          total: 0,
          positive: 0,
          negative: 0,
          rate: 0
        },
        ruleUpdates: {
          total: ruleHistory.filter(r => {
            const date = new Date(r.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          }).length,
          byCategory: {} as Record<string, number>
        },
        expertProgress: allStatuses
      };

      // 统计反馈
      Object.values(allStatuses).forEach(status => {
        weeklyStats.feedbackStats.total += status.totalFeedback;
        weeklyStats.feedbackStats.positive += Math.floor(status.totalFeedback * status.positiveRate);
        weeklyStats.feedbackStats.negative += Math.floor(status.totalFeedback * (1 - status.positiveRate));
      });
      
      weeklyStats.feedbackStats.rate = weeklyStats.feedbackStats.total > 0
        ? weeklyStats.feedbackStats.positive / weeklyStats.feedbackStats.total
        : 0;

      return {
        taskName: 'weeklySummary',
        success: true,
        executedAt: startTime,
        details: weeklyStats
      };

    } catch (error: any) {
      return {
        taskName: 'weeklySummary',
        success: false,
        executedAt: startTime,
        error: error.message
      };
    }
  }

  /**
   * 获取调度状态
   */
  async getScheduleStatus(): Promise<{
    lastRun: string | null;
    nextRun: string;
    activeTasks: string[];
  }> {
    // 这里可以从数据库获取实际的上次运行时间和计划
    return {
      lastRun: null,
      nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6小时后
      activeTasks: ['checkRules', 'optimizeExperts', 'learnCases', 'generateReport']
    };
  }
}

// 导出单例
export const evolutionScheduler = new EvolutionScheduler();

// CLI执行入口
if (require.main === module) {
  const scheduler = new EvolutionScheduler();
  const mode = process.argv[2] || 'daily';

  if (mode === 'daily') {
    scheduler.runDailyEvolution().then(results => {
      console.log('\n执行结果:');
      results.forEach(r => {
        console.log(`- ${r.taskName}: ${r.success ? '✅' : '❌'} ${r.success ? JSON.stringify(r.details) : r.error}`);
      });
    });
  } else if (mode === 'hourly') {
    scheduler.runHourlyTasks().then(results => {
      console.log('\n执行结果:');
      results.forEach(r => {
        console.log(`- ${r.taskName}: ${r.success ? '✅' : '❌'} ${r.success ? JSON.stringify(r.details) : r.error}`);
      });
    });
  } else if (mode === 'weekly') {
    scheduler.runWeeklySummary().then(result => {
      console.log('\n执行结果:');
      console.log(`- ${result.taskName}: ${result.success ? '✅' : '❌'}`);
      console.log(JSON.stringify(result.details, null, 2));
    });
  }
}
