import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function countWords(str: string): number {
  if (!str) return 0;
  // Clean markdown / HTML tags if any, then split by whitespace
  const clean = str.replace(/<[^>]*>/g, ' ').replace(/[#*_`]/g, '');
  const matches = clean.match(/\b[a-zA-Z0-9'-]+\b/g);
  return matches ? matches.length : 0;
}

@Injectable()
export class EssaysService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(filters?: { status?: string; taskType?: string }) {
    const where: any = {};
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.taskType && filters.taskType !== 'ALL') {
      where.prompt = { taskType: filters.taskType };
    }

    return this.prisma.essay.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        prompt: true,
        evaluation: {
          select: {
            overallBand: true,
            taTrScore: true,
            ccScore: true,
            lrScore: true,
            graScore: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            chatMessages: true,
            errorRecords: true,
            notebookItems: true,
          },
        },
      },
    });
  }

  async getById(id: string) {
    const essay = await this.prisma.essay.findUnique({
      where: { id },
      include: {
        prompt: true,
        chatMessages: { orderBy: { createdAt: 'asc' } },
        evaluation: true,
        errorRecords: { orderBy: { createdAt: 'desc' } },
        notebookItems: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!essay) {
      throw new NotFoundException(`Không tìm thấy bài viết với mã ID ${id}`);
    }

    return essay;
  }

  async createOrGetActive(promptId: string, aimBand = 6.5) {
    // Check if there is an active draft for this prompt
    const existing = await this.prisma.essay.findFirst({
      where: { promptId, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      include: { prompt: true, chatMessages: true },
    });

    if (existing) {
      // Synchronize aimBand if user selected a different target
      if (aimBand && existing.aimBand !== aimBand) {
        return this.prisma.essay.update({
          where: { id: existing.id },
          data: { aimBand },
          include: { prompt: true, chatMessages: true },
        });
      }
      return existing;
    }

    return this.prisma.essay.create({
      data: {
        promptId,
        aimBand,
        content: '',
        wordCount: 0,
        status: 'DRAFT',
      },
      include: { prompt: true, chatMessages: true },
    });
  }

  async updateContent(id: string, content: string) {
    const wordCount = countWords(content);
    return this.prisma.essay.update({
      where: { id },
      data: {
        content,
        wordCount,
      },
    });
  }

  async updateTimeSpent(id: string, seconds: number) {
    return this.prisma.essay.update({
      where: { id },
      data: {
        timeSpentSeconds: { increment: seconds },
      },
    });
  }

  async retryEssay(id: string) {
    const oldEssay = await this.getById(id);

    // If old essay is still draft, mark it reviewed
    if (oldEssay.status === 'DRAFT') {
      await this.prisma.essay.update({
        where: { id },
        data: { status: 'REVIEWED' },
      });
    }

    // Create a new draft for the same prompt
    return this.prisma.essay.create({
      data: {
        promptId: oldEssay.promptId,
        aimBand: oldEssay.aimBand,
        content: '',
        wordCount: 0,
        status: 'DRAFT',
      },
      include: { prompt: true, chatMessages: true },
    });
  }

  async deleteEssay(id: string) {
    await this.getById(id);
    return this.prisma.essay.delete({
      where: { id },
    });
  }

  async listRecent() {
    return this.prisma.essay.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        prompt: true,
        evaluation: { select: { overallBand: true } },
      },
    });
  }
}
