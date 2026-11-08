import { Controller, Post, Get, Param } from '@nestjs/common';
import { ExaminerService } from './examiner.service';

@Controller('api/examiner')
export class ExaminerController {
  constructor(private readonly examinerService: ExaminerService) {}

  @Post(':essayId/submit')
  async submitAndEvaluate(@Param('essayId') essayId: string) {
    return this.examinerService.evaluateEssay(essayId);
  }

  @Get(':essayId')
  async getEvaluation(@Param('essayId') essayId: string) {
    return this.examinerService.getEvaluationByEssayId(essayId);
  }
}

