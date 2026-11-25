import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { TutorService } from './tutor.service';

@Controller('api/tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('chat')
  async chat(
    @Body()
    body: {
      essayId: string;
      message: string;
      selectedText?: string;
      inputMethod?: string;
    },
    @Res() res: Response,
  ) {
    return this.tutorService.handleChatStream(
      body.essayId,
      body.message,
      body.selectedText,
      body.inputMethod || 'TEXT',
      res,
    );
  }

  @Post('inline-action')
  async inlineAction(
    @Body()
    body: {
      essayId: string;
      actionType: 'FIX_ERRORS' | 'UPGRADE_SENTENCE' | string;
      selectedText: string;
    },
    @Res() res: Response,
  ) {
    return this.tutorService.handleInlineAction(
      body.essayId,
      body.actionType,
      body.selectedText,
      res,
    );
  }
}

