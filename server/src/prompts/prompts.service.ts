import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../ollama/ollama.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class PromptsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  async onModuleInit() {
    // Seed default sample prompts if none exist or if only 3 exist
    const count = await this.prisma.topicPrompt.count();
    if (count < 6) {
      const defaultPrompts = [
        {
          taskType: 'TASK_2',
          title: 'Stepwells & Ancient Heritage Conservation',
          questionText:
            'Many historical buildings and ancient monuments like traditional stepwells are costly to maintain. Some people think that governments should spend money on public infrastructure instead of preserving old buildings. To what extent do you agree or disagree?',
          category: 'Culture',
        },
        {
          taskType: 'TASK_2',
          title: 'European Transport Systems & Urban Congestion',
          questionText:
            'The best way to resolve the increasing traffic congestion in modern cities is to provide free public transportation. Discuss the advantages and disadvantages of this proposal and give your opinion.',
          category: 'Transportation',
        },
        {
          taskType: 'TASK_2',
          title: 'The Psychology of Innovation & Risk-Taking',
          questionText:
            'Some psychologists suggest that highly successful individuals are those willing to make mistakes and take significant risks, while others believe that systematic planning is far more essential. Discuss both views and give your opinion.',
          category: 'Psychology',
        },
        {
          taskType: 'TASK_2',
          title: 'Tea Trade and the Industrial Revolution',
          questionText:
            'Global trade and historical consumer goods (such as tea, sugar, and cotton) played a crucial role in economic transformations. Do the benefits of rapid industrialization and global commerce outweigh the drawbacks?',
          category: 'History',
        },
        {
          taskType: 'TASK_2',
          title: 'Gifted Children and Specialized Education',
          questionText:
            'Some educators argue that exceptionally intelligent or talented children should be taught in specialized schools, while others advocate that they should study alongside children of normal abilities. Discuss both views.',
          category: 'Education',
        },
        {
          taskType: 'TASK_1',
          title: 'Energy Production by Source in 1995 and 2005',
          questionText:
            'The pie charts show the proportions of energy produced from different sources in a European country in 1995 and 2005. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
          category: 'Energy',
          chartDataJson: JSON.stringify({
            chart_type: 'Pie charts',
            main_subject: 'Energy production sources in 1995 vs 2005',
            key_trends: ['Coal remained the predominant source', 'Gas significantly increased while Nuclear slightly grew'],
            significant_data_points: ['Coal: 29.8% (1995) to 30.9% (2005)', 'Gas: 29.6% to 30.3%', 'Petro decreased from 29.2% to 19.5%'],
            overview_summary: 'Overall, coal and gas were the primary energy sources throughout both years, while petroleum saw a marked decline.'
          })
        }
      ];

      for (const p of defaultPrompts) {
        const exists = await this.prisma.topicPrompt.findFirst({ where: { title: p.title } });
        if (!exists) {
          await this.prisma.topicPrompt.create({ data: p });
        }
      }
    }
  }

  async getAll(category?: string, taskType?: string) {
    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (taskType && taskType !== 'ALL') where.taskType = taskType;

    return this.prisma.topicPrompt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { essays: true } },
      },
    });
  }

  async getById(id: string) {
    const prompt = await this.prisma.topicPrompt.findUnique({
      where: { id },
      include: { essays: true },
    });
    if (!prompt) {
      throw new NotFoundException(`Không tìm thấy đề thi với ID ${id}`);
    }
    return prompt;
  }

  async create(data: {
    taskType: string;
    title: string;
    questionText: string;
    category?: string;
    imageUrl?: string;
    chartDataJson?: string;
  }) {
    return this.prisma.topicPrompt.create({
      data: {
        taskType: data.taskType,
        title: data.title,
        questionText: data.questionText,
        category: data.category || 'General',
        imageUrl: data.imageUrl,
        chartDataJson: data.chartDataJson,
      },
    });
  }

  async delete(id: string) {
    const prompt = await this.getById(id);
    if (prompt.imageUrl && prompt.imageUrl.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'uploads', prompt.imageUrl.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore
        }
      }
    }
    return this.prisma.topicPrompt.delete({
      where: { id },
    });
  }

  async updateChartData(id: string, chartDataJson: string) {
    return this.prisma.topicPrompt.update({
      where: { id },
      data: { chartDataJson },
    });
  }

  async rescanChart(id: string, newFile?: Express.Multer.File) {
    const prompt = await this.getById(id);

    let imageUrl = prompt.imageUrl;
    let base64 = '';

    if (newFile) {
      imageUrl = `/uploads/${newFile.filename}`;
      const fileBuffer = fs.readFileSync(newFile.path);
      base64 = fileBuffer.toString('base64');
    } else {
      if (!prompt.imageUrl) {
        throw new BadRequestException('Đề thi này không có hình ảnh biểu đồ để quét.');
      }
      const uploadsDir = join(process.cwd(), 'uploads');
      const relativeName = prompt.imageUrl.replace(/^\/uploads\//, '');
      const localUploadPath = join(uploadsDir, relativeName);

      if (prompt.imageUrl.startsWith('data:image')) {
        base64 = prompt.imageUrl.split(',')[1] || '';
      } else if (fs.existsSync(localUploadPath)) {
        base64 = fs.readFileSync(localUploadPath).toString('base64');
      } else if (fs.existsSync(prompt.imageUrl)) {
        base64 = fs.readFileSync(prompt.imageUrl).toString('base64');
      } else {
        throw new NotFoundException(
          `Không tìm thấy file hình ảnh gốc của đề thi tại: ${prompt.imageUrl}`,
        );
      }
    }

    const chartDataJson = await this.ollama.analyzeTask1Image(
      base64,
      prompt.questionText,
    );

    return this.prisma.topicPrompt.update({
      where: { id },
      data: {
        imageUrl,
        chartDataJson,
      },
    });
  }
}
