import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EssaysService } from './essays.service';

@Controller('api/essays')
export class EssaysController {
  constructor(private readonly essaysService: EssaysService) {}

  @Get()
  async listAll(
    @Query('status') status?: string,
    @Query('taskType') taskType?: string,
  ) {
    return this.essaysService.listAll({ status, taskType });
  }

  @Get('recent')
  async getRecent() {
    return this.essaysService.listRecent();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.essaysService.getById(id);
  }

  @Post('start')
  async startEssay(
    @Body() body: { promptId: string; aimBand?: number },
  ) {
    return this.essaysService.createOrGetActive(body.promptId, body.aimBand);
  }

  @Put(':id/autosave')
  async autosave(
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.essaysService.updateContent(id, body.content);
  }

  @Put(':id/time')
  async updateTime(
    @Param('id') id: string,
    @Body() body: { seconds: number },
  ) {
    return this.essaysService.updateTimeSpent(id, body.seconds);
  }

  @Post(':id/retry')
  async retryEssay(@Param('id') id: string) {
    return this.essaysService.retryEssay(id);
  }

  @Delete(':id')
  async deleteEssay(@Param('id') id: string) {
    return this.essaysService.deleteEssay(id);
  }
}
