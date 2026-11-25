import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Serve static uploaded files (Task 1 charts)
  const uploadsCandidates = [
    join(process.cwd(), 'uploads'),
    join(process.cwd(), 'server', 'uploads'),
  ];
  for (const p of uploadsCandidates) {
    app.use('/uploads', express.static(p));
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 IELTS Writing AI Tutor Backend running on: http://localhost:${port}`);
}

bootstrap();

