import { Module } from '@nestjs/common';
import { ExaminerService } from './examiner.service';
import { ExaminerController } from './examiner.controller';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [OllamaModule],
  controllers: [ExaminerController],
  providers: [ExaminerService],
  exports: [ExaminerService],
})
export class ExaminerModule {}

