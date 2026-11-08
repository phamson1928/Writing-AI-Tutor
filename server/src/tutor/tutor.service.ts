import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../ollama/ollama.service';
import { Response } from 'express';

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  private buildSystemPrompt(essay: any, topErrors: string[] = []): string {
    const isTask1 = essay.prompt.taskType === 'TASK_1';
    const chartContext = isTask1 && essay.prompt.chartDataJson
      ? `\nTHÔNG TIN BIỂU ĐỒ TASK 1 ĐƯỢC TRÍCH XUẤT:\n${essay.prompt.chartDataJson}`
      : '';

    const errorContext = topErrors.length > 0
      ? `\nLƯU Ý CÁ NHÂN HÓA (GHI NHỚ LỖI CÁ NHÂN): Học viên có tiền sử hay mắc các lỗi sau trong các bài viết trước: [${topErrors.join(', ')}]. Hãy nhẹ nhàng nhắc nhở hoặc lưu ý nếu bạn thấy học viên có nguy cơ lặp lại các điểm yếu này.`
      : '';

    return `Bạn là "AI IELTS Writing Tutor" – gia sư AI đồng hành trực tiếp trong quá trình người học viết bài IELTS.
MỤC TIÊU CỦA BẠN: Hướng dẫn tư duy, phân tích và đồng hành. TUYỆT ĐỐI KHÔNG VIẾT HỘ NGUYÊN BÀI!

NGỮ CẢNH BÀI THI:
- Dạng đề: ${essay.prompt.taskType}
- Đề bài: "${essay.prompt.questionText}"
- Aim Band mục tiêu của học viên: ${essay.aimBand}${chartContext}${errorContext}

NGUYÊN TẮC SƯ PHẠM:
1. Giải thích ngữ pháp, từ vựng bằng tiếng Việt thân thiện, rõ ràng, dễ hiểu. Các ví dụ minh họa viết bằng tiếng Anh.
2. Khi học viên bí ý: Gợi ý 2-3 hướng phát triển luận điểm hoặc đặt câu hỏi gợi mở để học viên tự chọn và tự viết.
3. Khi học viên hỏi một câu/đoạn: Chỉ ra lỗi (nếu có), giải thích tại sao sai (quy tắc ngữ pháp, collocation gượng gạo), rồi đưa ra câu hỏi hướng dẫn cách sửa.
4. Giữ phong cách gần gũi, khích lệ như một người bạn/gia sư ngồi cạnh bàn học.`;
  }

  async handleChatStream(
    essayId: string,
    userMessage: string,
    selectedText: string | undefined,
    inputMethod: string,
    res: Response,
  ) {
    const essay = await this.prisma.essay.findUnique({
      where: { id: essayId },
      include: { prompt: true, chatMessages: { take: 6, orderBy: { createdAt: 'desc' } } },
    });

    if (!essay) {
      res.status(404).json({ error: 'Essay not found' });
      return;
    }

    // Save user message
    await this.prisma.tutorMessage.create({
      data: {
        essayId,
        role: 'user',
        inputMethod: inputMethod || 'TEXT',
        selectedText: selectedText || null,
        content: userMessage,
      },
    });

    // Query recent errors to personalize guidance
    const recentErrors = await this.prisma.errorRecord.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { errorType: true },
    });
    const counts: Record<string, number> = {};
    for (const e of recentErrors) counts[e.errorType] = (counts[e.errorType] || 0) + 1;
    const topErrors = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k} (${v} lần)`);

    const systemPrompt = this.buildSystemPrompt(essay, topErrors);

    // Format multi-turn conversation history
    let historyContext = '';
    const recentMessages = (essay.chatMessages || []).slice().reverse();
    if (recentMessages.length > 0) {
      historyContext = '\n[LỊCH SỬ TRAO ĐỔI VỪA RỒI]:\n' +
        recentMessages.map((m) => `${m.role === 'user' ? 'Học viên' : 'Gia sư'}: ${m.content}`).join('\n') +
        '\n\n';
    }

    let prompt = historyContext;
    if (selectedText) {
      prompt += `[Đoạn văn tôi đang chọn trong bài viết]: "${selectedText}"\n\n`;
    }
    if (essay.content) {
      const excerpt = essay.content.slice(-400); // Last 400 chars of essay
      prompt += `[Bản nháp tôi đang viết đến đoạn]: "...${excerpt}"\n\n`;
    }
    prompt += `Câu hỏi mới của tôi: ${userMessage}`;

    // Stream to client
    const fullResponse = await this.ollama.streamToClient(res, prompt, systemPrompt);

    // Save assistant message when completed
    if (fullResponse) {
      await this.prisma.tutorMessage.create({
        data: {
          essayId,
          role: 'assistant',
          inputMethod: 'TEXT',
          content: fullResponse,
        },
      });
    }
  }

  async handleInlineAction(
    essayId: string,
    actionType: 'FIX_GRAMMAR' | 'UPGRADE_SENTENCE' | 'COLLOCATION',
    selectedText: string,
    res: Response,
  ) {
    const essay = await this.prisma.essay.findUnique({
      where: { id: essayId },
      include: { prompt: true },
    });

    if (!essay) {
      res.status(404).json({ error: 'Essay not found' });
      return;
    }

    // Save user request into chat history so the thread is complete
    const actionLabel =
      actionType === 'FIX_GRAMMAR'
        ? `Kiểm tra ngữ pháp câu: "${selectedText}"`
        : actionType === 'UPGRADE_SENTENCE'
        ? `Nâng cấp câu theo Aim Band ${essay.aimBand}: "${selectedText}"`
        : `Gợi ý Collocation cho đoạn: "${selectedText}"`;

    await this.prisma.tutorMessage.create({
      data: {
        essayId,
        role: 'user',
        inputMethod: 'TEXT',
        mode: actionType,
        selectedText,
        content: actionLabel,
      },
    });

    // Query recent errors to personalize guidance
    const recentErrors = await this.prisma.errorRecord.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { errorType: true },
    });
    const counts: Record<string, number> = {};
    for (const e of recentErrors) counts[e.errorType] = (counts[e.errorType] || 0) + 1;
    const topErrors = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k} (${v} lần)`);

    const systemPrompt = this.buildSystemPrompt(essay, topErrors);
    let prompt = '';

    if (actionType === 'FIX_GRAMMAR') {
      prompt = `Hãy kiểm tra và phân tích câu/đoạn sau đây tôi vừa viết:
"${selectedText}"

YÊU CẦU:
1. Chỉ ra câu này đúng hay có lỗi ngữ pháp/chính tả nào không?
2. Giải thích cụ thể nguyên nhân sai bằng tiếng Việt.
3. Đưa ra gợi ý sửa tự nhiên nhưng giữ nguyên ý tưởng ban đầu của tôi.`;
    } else if (actionType === 'UPGRADE_SENTENCE') {
      prompt = `Hãy giúp tôi nâng cấp câu sau lên mức Aim Band ${essay.aimBand}:
"${selectedText}"

YÊU CẦU:
1. Đưa ra 1-2 cách viết lại học thuật, tự nhiên và chuẩn phong cách IELTS.
2. Giải thích ngắn gọn bằng tiếng Việt tại sao cách viết mới lại ấn tượng hơn (từ vựng C1/C2, cấu trúc câu phức, tính liên kết).`;
    } else if (actionType === 'COLLOCATION') {
      prompt = `Từ đoạn văn bản này:
"${selectedText}"

YÊU CẦU:
Gợi ý 3-4 Collocations học thuật tự nhiên (kèm nghĩa tiếng Việt và 1 câu ví dụ minh họa) có thể dùng để thay thế hoặc mở rộng cho các từ trong đoạn này.`;
    }

    const fullResponse = await this.ollama.streamToClient(res, prompt, systemPrompt);

    if (fullResponse) {
      await this.prisma.tutorMessage.create({
        data: {
          essayId,
          role: 'assistant',
          inputMethod: 'TEXT',
          mode: actionType,
          selectedText,
          content: fullResponse,
        },
      });
    }
  }
}
