import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OllamaModule } from './ollama/ollama.module';
import { PromptsModule } from './prompts/prompts.module';
import { EssaysModule } from './essays/essays.module';
import { TutorModule } from './tutor/tutor.module';
import { NotebookModule } from './notebook/notebook.module';
import { ExaminerModule } from './examiner/examiner.module';
import { ErrorsModule } from './errors/errors.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OllamaModule,
    PromptsModule,
    EssaysModule,
    TutorModule,
    NotebookModule,
    ExaminerModule,
    ErrorsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
