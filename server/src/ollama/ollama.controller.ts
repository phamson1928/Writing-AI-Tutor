import { Controller, Get } from '@nestjs/common';
import { OllamaService } from './ollama.service';

@Controller('api/ollama')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Get('health')
  async getHealth() {
    return this.ollamaService.checkHealth();
  }
}

