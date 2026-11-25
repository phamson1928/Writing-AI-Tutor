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
    actionType: 'FIX_ERRORS' | 'UPGRADE_SENTENCE' | string,
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

    const isUpgrade = actionType === 'UPGRADE_SENTENCE';
    const actionLabel = isUpgrade
      ? `✨ Nâng cấp câu & Collocations chuẩn Aim Band ${essay.aimBand}: "${selectedText}"`
      : `🔍 Sửa lỗi toàn diện (Ngữ pháp, chính tả & Collocations): "${selectedText}"`;

    await this.prisma.tutorMessage.create({
      data: {
        essayId,
        role: 'user',
        inputMethod: 'TEXT',
        mode: isUpgrade ? 'UPGRADE_SENTENCE' : 'FIX_ERRORS',
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

    if (isUpgrade) {
      prompt = `Bạn là Chuyên gia IELTS Writing luyện thi chuyên sâu theo Aim Band ${essay.aimBand}.
Hãy nâng cấp toàn diện câu/đoạn sau lên đúng chuẩn đẳng cấp Aim Band ${essay.aimBand} (kết hợp cả cấu trúc câu học thuật và collocations bản xứ):
"${selectedText}"

YÊU CẦU TRẢ LỜI ĐẦY ĐỦ VÀ RÕ RÀNG:
1. 🌟 HAI PHIÊN BẢN NÂNG CẤP XUẤT SẮC:
   - Cách 1 (Mạch lạc & Tự nhiên - Fluent & Natural): Diễn đạt tự nhiên, trôi chảy như người bản xứ, lồng ghép các collocations C1 chuẩn xác.
   - Cách 2 (Học thuật & Đột phá - Academic & Sophisticated): Nâng cao cấu trúc câu (danh từ hóa / nominalization, câu phức, mệnh đề quan hệ hoặc đảo ngữ) kết hợp các collocations C1/C2 đắt giá nhất.
2. 💡 COLLOCATIONS ĐẮT GIÁ ĐƯỢC DÙNG:
   - Trích xuất 2-3 cụm Collocations ấn tượng nhất trong các bản nâng cấp trên (kèm nghĩa tiếng Việt) để học viên có thể bôi đen và bấm "Lưu Sổ Tay".
3. 🎯 PHÂN TÍCH ĐIỂM SÁNG:
   - Giải thích ngắn gọn 1-2 lý do vì sao cách viết nâng cấp này giúp ăn điểm cao ở tiêu chí GRA và LR.`;
    } else {
      prompt = `Bạn là Gia sư IELTS chuyên sâu về Độ chuẩn xác (Accuracy: Ngữ pháp, Chính tả & Collocations).
Hãy kiểm tra và sửa lỗi toàn diện cho câu/đoạn sau:
"${selectedText}"

YÊU CẦU TRẢ LỜI ĐẦY ĐỦ VÀ RÕ RÀNG:
1. 🔍 CHẨN ĐOÁN LỖI:
   - Lỗi Ngữ pháp & Cấu trúc (SVA, thì động từ, mạo từ a/an/the, giới từ, trật tự từ, từ loại, chính tả).
   - Lỗi Collocations & Dùng từ: Bắt các cụm từ kết hợp sai, collocation gượng gạo hoặc dịch thô từ tiếng Việt (ví dụ: dùng sai động từ đi kèm, sai giới từ trong cụm từ cố định).
   - Nếu câu ĐÃ ĐÚNG: Xác nhận câu hoàn toàn chuẩn xác và nêu ngắn gọn điểm tốt.
   - Nếu câu CÓ LỖI: Chỉ đích danh từ/cụm từ sai và giải thích nguyên tắc bằng tiếng Việt.
2. 🛠️ PHIÊN BẢN SỬA LỖI CHUẨN XÁC:
   - Đưa ra phiên bản đã được sửa sạch mọi lỗi ngữ pháp và thay thế các collocation dùng sai bằng collocation tự nhiên của người bản xứ.
   - NGUYÊN TẮC: GIỮ NGUYÊN cấu trúc cốt lõi, giọng văn và ý tưởng ban đầu của học viên, không tự ý biến đổi sang ý khác.`;
    }

    const fullResponse = await this.ollama.streamToClient(res, prompt, systemPrompt);

    if (fullResponse) {
      await this.prisma.tutorMessage.create({
        data: {
          essayId,
          role: 'assistant',
          inputMethod: 'TEXT',
          mode: isUpgrade ? 'UPGRADE_SENTENCE' : 'FIX_ERRORS',
          selectedText,
          content: fullResponse,
        },
      });
    }
  }
}
