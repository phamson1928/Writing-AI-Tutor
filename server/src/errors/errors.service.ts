import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ErrorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const allErrors = await this.prisma.errorRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: { essay: { include: { prompt: true } } },
    });

    // Aggregate counts by errorType
    const countsByType: Record<string, number> = {};
    for (const err of allErrors) {
      countsByType[err.errorType] = (countsByType[err.errorType] || 0) + 1;
    }

    const typeStats = Object.entries(countsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalErrors: allErrors.length,
      typeStats,
      recentErrors: allErrors.slice(0, 30),
    };
  }

  async getTopFrequentErrors(limit = 3) {
    const allErrors = await this.prisma.errorRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const countsByType: Record<string, number> = {};
    for (const err of allErrors) {
      countsByType[err.errorType] = (countsByType[err.errorType] || 0) + 1;
    }

    return Object.entries(countsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async createManualError(data: {
    essayId: string;
    errorType: string;
    originalSnippet: string;
    correctedSnippet: string;
    explanationVi: string;
  }) {
    return this.prisma.errorRecord.create({
      data: {
        essayId: data.essayId,
        errorType: data.errorType,
        originalSnippet: data.originalSnippet,
        correctedSnippet: data.correctedSnippet,
        explanationVi: data.explanationVi,
      },
    });
  }

  async deleteError(id: string) {
    const existing = await this.prisma.errorRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Error with ID ${id} not found`);
    }
    return this.prisma.errorRecord.delete({ where: { id } });
  }
}
