import { Module } from '@nestjs/common';
import { EssaysService } from './essays.service';
import { EssaysController } from './essays.controller';

@Module({
  controllers: [EssaysController],
  providers: [EssaysService],
  exports: [EssaysService],
})
export class EssaysModule {}

