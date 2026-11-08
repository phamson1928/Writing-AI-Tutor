import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ErrorsService } from './errors.service';

@Controller('api/errors')
export class ErrorsController {
  constructor(private readonly errorsService: ErrorsService) {}

  @Get('summary')
  async getSummary() {
    return this.errorsService.getSummary();
  }

  @Get('frequent')
  async getFrequent(@Query('limit') limit?: number) {
    return this.errorsService.getTopFrequentErrors(limit ? Number(limit) : 3);
  }

  @Post()
  async create(
    @Body()
    body: {
      essayId: string;
      errorType: string;
      originalSnippet: string;
      correctedSnippet: string;
      explanationVi: string;
    },
  ) {
    return this.errorsService.createManualError(body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.errorsService.deleteError(id);
  }
}
