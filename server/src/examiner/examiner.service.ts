import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../ollama/ollama.service';
import axios from 'axios';

export interface EvaluationPayload {
  overallBand: number;
  taTrScore: number;
  ccScore: number;
  lrScore: number;
  graScore: number;
  taTrFeedback: string;
  ccFeedback: string;
  lrFeedback: string;
  graFeedback: string;
  ideaAnalysis: {
    taTrFeedback?: string;
    ccFeedback?: string;
    lrFeedback?: string;
    graFeedback?: string;
    wellDevelopedIdeas: string[];
    weakOrOffTopicIdeas: string[];
    keyMissingIdeas: string[];
    elaborationAdvice: string;
  };
  detailedErrors: Array<{
    type: string;
    original: string;
    suggested: string;
    explanationVi: string;
  }>;
  upgradedEssay: string;
}

const VALID_TAXONOMY = new Set([
  'SVA',
  'TENSE',
  'ARTICLE',
  'PREPOSITION',
  'COLLOCATION',
  'WORD_FORM',
  'SENTENCE_STRUCTURE',
  'PUNCTUATION',
  'UNNATURAL',
  'COHESION',
  'OTHER',
]);

function normalizeErrorType(typeStr: string): string {
  if (!typeStr) return 'OTHER';
  const upper = typeStr.toUpperCase().trim().replace(/[\s-]/g, '_');
  if (VALID_TAXONOMY.has(upper)) return upper;
  if (upper.includes('AGREEMENT') || upper.includes('SVA')) return 'SVA';
  if (upper.includes('TENSE') || upper.includes('VERB_TENSE')) return 'TENSE';
  if (upper.includes('ARTICLE')) return 'ARTICLE';
  if (upper.includes('PREP')) return 'PREPOSITION';
  if (upper.includes('COLLOC')) return 'COLLOCATION';
  if (upper.includes('WORD_FORM') || upper.includes('FORMS')) return 'WORD_FORM';
  if (upper.includes('PUNCT')) return 'PUNCTUATION';
  if (upper.includes('SENTENCE') || upper.includes('RUN_ON') || upper.includes('FRAGMENT')) return 'SENTENCE_STRUCTURE';
  if (upper.includes('UNNATURAL') || upper.includes('TONE') || upper.includes('AWKWARD')) return 'UNNATURAL';
  if (upper.includes('COHESION') || upper.includes('LINKING')) return 'COHESION';
  return 'OTHER';
}

function normalizeBandScore(score: any, defaultVal = 6.0): number {
  const num = Number(score);
  if (isNaN(num)) return defaultVal;
  const clamped = Math.max(0, Math.min(9, num));
  return Math.round(clamped * 2) / 2;
}

function calculateOfficialIeltsBand(taTr: number, cc: number, lr: number, gra: number): number {
  const avg = (taTr + cc + lr + gra) / 4;
  const intPart = Math.floor(avg);
  const decimal = avg - intPart;
  if (decimal < 0.25) return intPart;
  if (decimal < 0.75) return intPart + 0.5;
  return intPart + 1.0;
}

@Injectable()
export class ExaminerService {
  private readonly logger = new Logger(ExaminerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  async evaluateEssay(essayId: string): Promise<any> {
    const essay = await this.prisma.essay.findUnique({
      where: { id: essayId },
      include: { prompt: true },
    });

    if (!essay) {
      throw new NotFoundException(`Essay with ID ${essayId} not found`);
    }

    if (!essay.content || essay.content.trim().length < 40) {
      throw new BadRequestException('Bài viết cần ít nhất 40-50 từ để có thể phân tích 4 tiêu chí và luận điểm.');
    }

    const isTask1 = essay.prompt.taskType === 'TASK_1';
    const taskTypeLabel = isTask1 ? 'Task 1 (Academic Report)' : 'Task 2 (Academic Essay)';
    const chartContext =
      isTask1 && essay.prompt.chartDataJson
        ? `\nTHÔNG TIN BIỂU ĐỒ TASK 1 ĐƯỢC BÓC TÁCH:\n${essay.prompt.chartDataJson}\n`
        : '';

    const systemPrompt = `Bạn là một Giám khảo IELTS Writing kỳ cựu (IELTS Examiner) kiêm Gia sư luyện thi chuyên sâu.
Nhiệm vụ của bạn: Chấm điểm bài viết IELTS, phân tích tư duy lập luận và tạo đúng 01 bản nâng cấp chuẩn hóa theo Aim Band.

HƯỚNG DẪN ĐÁNH GIÁ:
1. Chấm điểm khách quan theo 4 tiêu chí chuẩn IELTS (điểm từ 0 đến 9, bội số 0.5):
   - ${isTask1 ? 'Task Achievement (TA)' : 'Task Response (TR)'}
   - Coherence and Cohesion (CC)
   - Lexical Resource (LR)
   - Grammatical Range and Accuracy (GRA)
2. Phân tích chiều sâu luận điểm:
   - Các ý phát triển tốt (wellDevelopedIdeas).
   - Các ý lạc đề / lập luận yếu / thiếu căn cứ (weakOrOffTopicIdeas).
   - Các ý quan trọng nên bổ sung (keyMissingIdeas).
   - Hướng dẫn triển khai luận điểm (elaborationAdvice: Point -> Explain -> Example).
3. Bảng lỗi cụ thể theo taxonomy chuẩn:
   Phân loại type là một trong các giá trị sau: SVA, TENSE, ARTICLE, PREPOSITION, COLLOCATION, WORD_FORM, SENTENCE_STRUCTURE, PUNCTUATION, UNNATURAL, COHESION.
   Giải thích cặn kẽ nguyên nhân bằng tiếng Việt.
4. Đúng 01 Bản viết nâng cấp (Single Upgraded Essay):
   - BẮT BUỘC cung cấp toàn văn bài viết nâng cấp ở trường "upgradedEssay" đạt đúng mức Aim Band: ${essay.aimBand}.
   - Giữ nguyên bố cục đoạn và tư duy cốt lõi của học viên, nhưng nâng cấp vốn từ vựng học thuật C1/C2, cấu trúc câu đa dạng và tự nhiên như người bản xứ.

BẮT BUỘC: Trả về kết quả hoàn toàn dưới dạng JSON hợp lệ tuân thủ đúng cấu trúc.`;

    const userPrompt = `DẠNG ĐỀ: ${taskTypeLabel}
ĐỀ BÀI: "${essay.prompt.questionText}"${chartContext}
AIM BAND MỤC TIÊU: ${essay.aimBand}

BÀI VIẾT CỦA HỌC VIÊN (${essay.wordCount} từ):
"""
${essay.content.replace(/"""/g, '"')}
"""

YÊU CẦU: Trả về JSON theo đúng định dạng sau:
{
  "taTrScore": 6.5,
  "ccScore": 6.0,
  "lrScore": 6.5,
  "graScore": 6.5,
  "overallBand": 6.5,
  "taTrFeedback": "Nhận xét chi tiết về Task Response / Task Achievement bằng tiếng Việt",
  "ccFeedback": "Nhận xét chi tiết về Tính liên kết & Mạch lạc bằng tiếng Việt",
  "lrFeedback": "Nhận xét chi tiết về Vốn từ vựng & Collocation bằng tiếng Việt",
  "graFeedback": "Nhận xét chi tiết về Độ chính xác & Đa dạng ngữ pháp bằng tiếng Việt",
  "ideaAnalysis": {
    "wellDevelopedIdeas": ["Ý 1 đã được triển khai tốt...", "Ý 2..."],
    "weakOrOffTopicIdeas": ["Ý chưa chặt chẽ hoặc có nguy cơ lạc đề..."],
    "keyMissingIdeas": ["Ý đắt giá nên đưa vào đề này..."],
    "elaborationAdvice": "Lời khuyên triển khai luận điểm (Point -> Explain -> Example)..."
  },
  "detailedErrors": [
    {
      "type": "SVA | TENSE | ARTICLE | PREPOSITION | COLLOCATION | WORD_FORM | SENTENCE_STRUCTURE | PUNCTUATION | UNNATURAL | COHESION",
      "original": "cụm từ hoặc câu gốc",
      "suggested": "câu sửa chuẩn",
      "explanationVi": "giải thích ngữ pháp bằng tiếng Việt"
    }
  ],
  "upgradedEssay": "Toàn bộ bài viết nâng cấp đạt chuẩn Aim Band ${essay.aimBand} (độ dài tương đương bài gốc, từ vựng C1/C2)..."
}`;

    this.logger.log(`Evaluating essay ${essayId} with model...`);
    const rawResult = await this.ollama.generateJson<EvaluationPayload>(userPrompt, systemPrompt);

    // Normalize individual scores
    const taTrScore = normalizeBandScore(rawResult.taTrScore, 6.0);
    const ccScore = normalizeBandScore(rawResult.ccScore, 6.0);
    const lrScore = normalizeBandScore(rawResult.lrScore, 6.0);
    const graScore = normalizeBandScore(rawResult.graScore, 6.0);
    const overallBand = calculateOfficialIeltsBand(taTrScore, ccScore, lrScore, graScore);

    // Normalize criteria feedbacks
    const taTrFeedback = rawResult.taTrFeedback || (rawResult as any).ta_tr_feedback || 'Đánh giá mức độ hoàn thành nhiệm vụ và chiều sâu lập luận.';
    const ccFeedback = rawResult.ccFeedback || (rawResult as any).cc_feedback || 'Đánh giá tính mạch lạc, bố cục chia đoạn và từ nối liên kết.';
    const lrFeedback = rawResult.lrFeedback || (rawResult as any).lr_feedback || 'Đánh giá vốn từ vựng học thuật, độ chuẩn xác và collocations.';
    const graFeedback = rawResult.graFeedback || (rawResult as any).gra_feedback || 'Đánh giá độ phong phú và chính xác của cấu trúc câu phức.';

    // Normalize idea analysis (support camelCase and snake_case)
    const rawIdea = rawResult.ideaAnalysis || (rawResult as any).idea_analysis || {};
    const normalizedIdeaAnalysis = {
      taTrFeedback,
      ccFeedback,
      lrFeedback,
      graFeedback,
      wellDevelopedIdeas: rawIdea.wellDevelopedIdeas || rawIdea.well_developed_ideas || ['Các luận điểm chính đã bám sát yêu cầu đề bài.'],
      weakOrOffTopicIdeas: rawIdea.weakOrOffTopicIdeas || rawIdea.weak_or_off_topic_ideas || ['Không phát hiện ý lạc đề nghiêm trọng.'],
      keyMissingIdeas: rawIdea.keyMissingIdeas || rawIdea.key_missing_ideas || ['Bổ sung thêm ví dụ thực tiễn để tăng sức nặng cho bài viết.'],
      elaborationAdvice: rawIdea.elaborationAdvice || rawIdea.elaboration_advice || 'Phát triển luận điểm theo công thức: Nêu luận điểm (Point) -> Giải thích nguyên nhân (Explain) -> Đưa ví dụ cụ thể (Example).',
    };

    // Normalize detailed errors with standard taxonomy & snake_case support
    const rawErrors = (rawResult as any).detailedErrors || (rawResult as any).detailed_errors || (rawResult as any).errors || [];
    const normalizedErrors = rawErrors
      .map((err: any) => ({
        type: normalizeErrorType(err.type),
        original: err.original || err.originalSnippet || '',
        suggested: err.suggested || err.correctedSnippet || err.correction || '',
        explanationVi: err.explanationVi || err.explanation || '',
      }))
      .filter((err: any) => err.original && err.suggested && err.original !== err.suggested);

    let upgradedEssay = (rawResult as any).upgradedEssay ||
      (rawResult as any).upgraded_essay ||
      (rawResult as any).improvedEssay ||
      (rawResult as any).improved_essay ||
      (rawResult as any).revisedEssay ||
      (rawResult as any).revised_essay ||
      (rawResult as any).upgraded_version ||
      '';

    // Guaranteed fallback: If the LLM omitted upgradedEssay in the single JSON call, generate it specifically
    if (!upgradedEssay || upgradedEssay.trim().length < 50) {
      this.logger.log('Upgraded essay was missing in primary JSON. Triggering fast targeted generation...');
      try {
        const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
        const upgradePrompt = `Hãy viết lại bài viết sau đây của học viên để đạt chuẩn điểm Aim Band ${essay.aimBand}:
ĐỀ BÀI: "${essay.prompt.questionText}"
BÀI VIẾT GỐC:
${essay.content}

YÊU CẦU:
- Nâng cấp từ vựng học thuật C1/C2 và cấu trúc câu phong phú.
- Giữ nguyên tư duy lập luận của học viên.
- Trả về DUY NHẤT bài viết nâng cấp hoàn chỉnh, không kèm bất kỳ lời dẫn giải nào.`;

        const res = await axios.post(
          `${host}/api/generate`,
          {
            model,
            prompt: upgradePrompt,
            stream: false,
            options: { temperature: 0.3 },
          },
          { timeout: 60000 },
        );
        if (res.data?.response) {
          upgradedEssay = res.data.response.replace(/^```(?:markdown)?/i, '').replace(/```$/i, '').trim();
        }
      } catch (e: any) {
        this.logger.warn(`Fallback upgrade generation failed: ${e.message}`);
      }
    }

    // Save or update Evaluation in DB
    const savedEvaluation = await this.prisma.evaluation.upsert({
      where: { essayId },
      create: {
        essayId,
        overallBand,
        taTrScore,
        ccScore,
        lrScore,
        graScore,
        ideaAnalysisJson: JSON.stringify(normalizedIdeaAnalysis),
        detailedErrorsJson: JSON.stringify(normalizedErrors),
        upgradedEssay,
      },
      update: {
        overallBand,
        taTrScore,
        ccScore,
        lrScore,
        graScore,
        ideaAnalysisJson: JSON.stringify(normalizedIdeaAnalysis),
        detailedErrorsJson: JSON.stringify(normalizedErrors),
        upgradedEssay,
      },
    });

    // Update Essay status to REVIEWED
    await this.prisma.essay.update({
      where: { id: essayId },
      data: { status: 'REVIEWED' },
    });

    // Clean up previous error records for this essay before re-evaluating to prevent duplicate inflation
    await this.prisma.errorRecord.deleteMany({
      where: { essayId },
    });

    // Save new identified errors into ErrorRecord table for Error Memory
    if (normalizedErrors.length > 0) {
      for (const err of normalizedErrors) {
        await this.prisma.errorRecord.create({
          data: {
            essayId,
            errorType: err.type,
            originalSnippet: err.original,
            correctedSnippet: err.suggested,
            explanationVi: err.explanationVi,
          },
        });
      }
    }

    return {
      evaluationId: savedEvaluation.id,
      overallBand,
      taTrScore,
      ccScore,
      lrScore,
      graScore,
      taTrFeedback,
      ccFeedback,
      lrFeedback,
      graFeedback,
      ideaAnalysis: normalizedIdeaAnalysis,
      detailedErrors: normalizedErrors,
      upgradedEssay,
    };
  }

  async getEvaluationByEssayId(essayId: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { essayId },
    });

    if (!evaluation) return null;

    let ideaAnalysis: any = {};
    let detailedErrors: any[] = [];
    try {
      ideaAnalysis = JSON.parse(evaluation.ideaAnalysisJson);
    } catch {}
    try {
      detailedErrors = JSON.parse(evaluation.detailedErrorsJson);
    } catch {}

    return {
      id: evaluation.id,
      essayId: evaluation.essayId,
      overallBand: evaluation.overallBand,
      taTrScore: evaluation.taTrScore,
      ccScore: evaluation.ccScore,
      lrScore: evaluation.lrScore,
      graScore: evaluation.graScore,
      ideaAnalysis,
      detailedErrors,
      upgradedEssay: evaluation.upgradedEssay,
      createdAt: evaluation.createdAt,
    };
  }
}
