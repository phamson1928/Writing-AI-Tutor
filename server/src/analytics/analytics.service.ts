import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    // 1. Total essays
    const totalEssays = await this.prisma.essay.count();
    const completedEvaluations = await this.prisma.evaluation.count();

    // 2. Sum of words & time spent
    const essays = await this.prisma.essay.findMany({
      select: {
        wordCount: true,
        timeSpentSeconds: true,
        prompt: { select: { taskType: true } },
      },
    });

    const totalWords = essays.reduce((sum, e) => sum + (e.wordCount || 0), 0);
    const totalSeconds = essays.reduce((sum, e) => sum + (e.timeSpentSeconds || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    const task1Count = essays.filter((e) => e.prompt.taskType === 'TASK_1').length;
    const task2Count = essays.filter((e) => e.prompt.taskType === 'TASK_2').length;

    // 3. Evaluations stats
    const evaluations = await this.prisma.evaluation.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        essay: {
          select: {
            id: true,
            createdAt: true,
            prompt: { select: { title: true, taskType: true } },
          },
        },
      },
    });

    let averageBand = 0;
    let bestBand = 0;
    let avgTaTr = 0;
    let avgCc = 0;
    let avgLr = 0;
    let avgGra = 0;

    if (evaluations.length > 0) {
      const sumBand = evaluations.reduce((sum, ev) => sum + ev.overallBand, 0);
      const sumTaTr = evaluations.reduce((sum, ev) => sum + ev.taTrScore, 0);
      const sumCc = evaluations.reduce((sum, ev) => sum + ev.ccScore, 0);
      const sumLr = evaluations.reduce((sum, ev) => sum + ev.lrScore, 0);
      const sumGra = evaluations.reduce((sum, ev) => sum + ev.graScore, 0);

      averageBand = Math.round((sumBand / evaluations.length) * 10) / 10;
      bestBand = Math.max(...evaluations.map((ev) => ev.overallBand));
      avgTaTr = Math.round((sumTaTr / evaluations.length) * 10) / 10;
      avgCc = Math.round((sumCc / evaluations.length) * 10) / 10;
      avgLr = Math.round((sumLr / evaluations.length) * 10) / 10;
      avgGra = Math.round((sumGra / evaluations.length) * 10) / 10;
    }

    // 4. Band progression timeline
    const bandTrend = evaluations.map((ev) => ({
      date: ev.createdAt.toISOString().slice(0, 10),
      essayId: ev.essayId,
      title: ev.essay.prompt.title,
      taskType: ev.essay.prompt.taskType,
      overallBand: ev.overallBand,
      taTrScore: ev.taTrScore,
      ccScore: ev.ccScore,
      lrScore: ev.lrScore,
      graScore: ev.graScore,
    }));

    // 5. Error taxonomy breakdown
    const errors = await this.prisma.errorRecord.findMany({
      select: { errorType: true },
    });
    const errorStats: Record<string, number> = {};
    for (const err of errors) {
      errorStats[err.errorType] = (errorStats[err.errorType] || 0) + 1;
    }
    const sortedErrors = Object.entries(errorStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEssays,
      completedEvaluations,
      totalWords,
      totalMinutes,
      averageBand,
      bestBand,
      criteriaAverages: {
        taTr: avgTaTr,
        cc: avgCc,
        lr: avgLr,
        gra: avgGra,
      },
      taskBreakdown: {
        task1: task1Count,
        task2: task2Count,
      },
      bandTrend,
      topErrors: sortedErrors.slice(0, 5),
    };
  }

  async getBandTrend() {
    const evaluations = await this.prisma.evaluation.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        essay: {
          select: {
            id: true,
            createdAt: true,
            prompt: { select: { title: true, taskType: true } },
          },
        },
      },
    });

    return evaluations.map((ev) => ({
      date: ev.createdAt.toISOString().slice(0, 10),
      essayId: ev.essayId,
      title: ev.essay.prompt.title,
      taskType: ev.essay.prompt.taskType,
      overallBand: ev.overallBand,
      taTrScore: ev.taTrScore,
      ccScore: ev.ccScore,
      lrScore: ev.lrScore,
      graScore: ev.graScore,
    }));
  }
}

