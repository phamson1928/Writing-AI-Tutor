import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PromptsService } from './prompts.service';
import { OllamaService } from '../ollama/ollama.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@Controller('api/prompts')
export class PromptsController {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly ollamaService: OllamaService,
  ) {}

  @Get()
  async getAll(
    @Query('category') category?: string,
    @Query('taskType') taskType?: string,
  ) {
    return this.promptsService.getAll(category, taskType);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.promptsService.getById(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body()
    body: {
      taskType: string;
      title: string;
      questionText: string;
      category?: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined = undefined;
    let chartDataJson: string | undefined = undefined;

    if (file) {
      imageUrl = `/uploads/${file.filename}`;
      // Extract Base64 and run Vision analysis if Task 1
      if (body.taskType === 'TASK_1') {
        try {
          const fileBuffer = fs.readFileSync(file.path);
          const base64 = fileBuffer.toString('base64');
          chartDataJson = await this.ollamaService.analyzeTask1Image(
            base64,
            body.questionText,
          );
        } catch (e) {
          console.warn('Vision extraction error:', e);
        }
      }
    }

    return this.promptsService.create({
      taskType: body.taskType,
      title: body.title,
      questionText: body.questionText,
      category: body.category,
      imageUrl,
      chartDataJson,
    });
  }

  @Put(':id/chart-data')
  async updateChartData(
    @Param('id') id: string,
    @Body() body: { chartDataJson: string },
  ) {
    return this.promptsService.updateChartData(id, body.chartDataJson);
  }

  @Post(':id/rescan')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async rescan(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.promptsService.rescanChart(id, file);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.promptsService.delete(id);
  }
}
