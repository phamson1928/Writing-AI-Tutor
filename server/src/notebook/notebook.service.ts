import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotebookService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(type?: string) {
    return this.prisma.notebookItem.findMany({
      where: type && type !== 'ALL' ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { essay: { include: { prompt: true } } },
    });
  }

  async create(data: {
    essayId?: string;
    type: string;
    originalText: string;
    meaningVi?: string;
    contextExample?: string;
    tags?: string;
  }) {
    return this.prisma.notebookItem.create({
      data: {
        essayId: data.essayId,
        type: data.type || 'COLLOCATION',
        originalText: data.originalText,
        meaningVi: data.meaningVi,
        contextExample: data.contextExample,
        tags: data.tags,
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.notebookItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Notebook item with ID ${id} not found`);
    }
    return this.prisma.notebookItem.delete({
      where: { id },
    });
  }

  async getFlashcards(filters?: { masteryLevel?: string; type?: string }) {
    const where: any = {};
    if (filters?.masteryLevel && filters.masteryLevel !== 'ALL') {
      where.masteryLevel = filters.masteryLevel;
    }
    if (filters?.type && filters.type !== 'ALL') {
      where.type = filters.type;
    }

    const items = await this.prisma.notebookItem.findMany({
      where,
      orderBy: [{ reviewCount: 'asc' }, { createdAt: 'desc' }],
      include: { essay: { include: { prompt: true } } },
    });

    return items.map((item) => {
      // Create cloze test by replacing the word/collocation in contextExample
      let clozeText = item.contextExample || '';
      if (clozeText && item.originalText) {
        const regex = new RegExp(item.originalText, 'gi');
        clozeText = clozeText.replace(regex, '[______]');
      }

      return {
        id: item.id,
        front: item.originalText,
        back: item.meaningVi || 'Không có giải nghĩa',
        contextExample: item.contextExample,
        clozeExample: clozeText,
        type: item.type,
        tags: item.tags,
        reviewCount: item.reviewCount,
        masteryLevel: item.masteryLevel,
        lastReviewedAt: item.lastReviewedAt,
        sourceTopic: item.essay?.prompt?.title,
      };
    });
  }

  async reviewFlashcard(id: string, outcome: 'AGAIN' | 'GOOD' | 'EASY') {
    const item = await this.prisma.notebookItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Flashcard with ID ${id} not found`);
    }

    let nextMastery = item.masteryLevel;
    if (outcome === 'AGAIN') {
      nextMastery = 'LEARNING';
    } else if (outcome === 'GOOD') {
      nextMastery = item.reviewCount >= 2 ? 'MASTERED' : 'LEARNING';
    } else if (outcome === 'EASY') {
      nextMastery = 'MASTERED';
    }

    return this.prisma.notebookItem.update({
      where: { id },
      data: {
        reviewCount: { increment: 1 },
        masteryLevel: nextMastery,
        lastReviewedAt: new Date(),
      },
    });
  }

  async getFlashcardStats() {
    const total = await this.prisma.notebookItem.count();
    const newCount = await this.prisma.notebookItem.count({ where: { masteryLevel: 'NEW' } });
    const learningCount = await this.prisma.notebookItem.count({ where: { masteryLevel: 'LEARNING' } });
    const masteredCount = await this.prisma.notebookItem.count({ where: { masteryLevel: 'MASTERED' } });

    return {
      total,
      newCount,
      learningCount,
      masteredCount,
    };
  }

  async exportMarkdown(): Promise<string> {
    const items = await this.prisma.notebookItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { essay: { include: { prompt: true } } },
    });

    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      const type = item.type || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    }

    let md = `# 📖 IELTS Writing Personal Notebook Export\n`;
    md += `*Exported on: ${new Date().toLocaleDateString('vi-VN')}*\n\n`;

    for (const [type, list] of Object.entries(groups)) {
      md += `## ${type} (${list.length})\n\n`;
      for (const item of list) {
        md += `- **${item.originalText}**`;
        if (item.meaningVi) md += `: ${item.meaningVi}`;
        md += `\n`;
        if (item.contextExample) md += `  - *Example*: "${item.contextExample}"\n`;
        if (item.essay?.prompt?.title) md += `  - *Source*: ${item.essay.prompt.title}\n`;
        md += `  - *Mastery*: ${item.masteryLevel} (Đã ôn ${item.reviewCount} lần)\n`;
      }
      md += `\n`;
    }

    return md;
  }
}
