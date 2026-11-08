import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { NotebookService } from './notebook.service';
import { Response } from 'express';

@Controller('api/notebook')
export class NotebookController {
  constructor(private readonly notebookService: NotebookService) {}

  @Get()
  async getAll(@Query('type') type?: string) {
    return this.notebookService.getAll(type);
  }

  @Post()
  async create(
    @Body()
    body: {
      essayId?: string;
      type: string;
      originalText: string;
      meaningVi?: string;
      contextExample?: string;
      tags?: string;
    },
  ) {
    return this.notebookService.create(body);
  }

  @Get('flashcards')
  async getFlashcards(
    @Query('masteryLevel') masteryLevel?: string,
    @Query('type') type?: string,
  ) {
    return this.notebookService.getFlashcards({ masteryLevel, type });
  }

  @Get('flashcards/stats')
  async getFlashcardStats() {
    return this.notebookService.getFlashcardStats();
  }

  @Post('flashcards/:id/review')
  async reviewFlashcard(
    @Param('id') id: string,
    @Body() body: { outcome: 'AGAIN' | 'GOOD' | 'EASY' },
  ) {
    return this.notebookService.reviewFlashcard(id, body.outcome);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.notebookService.delete(id);
  }

  @Get('export')
  async exportMarkdown(@Res() res: Response) {
    const md = await this.notebookService.exportMarkdown();
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ielts-notebook-${new Date().toISOString().slice(0, 10)}.md"`,
    );
    res.send(md);
  }
}
