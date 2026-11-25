import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  private textModel = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
  private visionModel = process.env.OLLAMA_VISION_MODEL || 'qwen2.5-vl:7b';

  async checkHealth(): Promise<{ online: boolean; models: string[]; activeModel: string }> {
    try {
      const res = await axios.get(`${this.host}/api/tags`, { timeout: 3000 });
      const models = (res.data.models || []).map((m: any) => m.name);
      return {
        online: true,
        models,
        activeModel: models.includes(this.textModel) ? this.textModel : (models[0] || this.textModel),
      };
    } catch (err: any) {
      this.logger.warn(`Ollama check failed: ${err.message}`);
      return {
        online: false,
        models: [],
        activeModel: this.textModel,
      };
    }
  }

  async streamToClient(
    res: Response,
    prompt: string,
    systemPrompt: string,
    model?: string,
  ): Promise<string> {
    const targetModel = model || this.textModel;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullText = '';
    try {
      const response = await axios.post(
        `${this.host}/api/generate`,
        {
          model: targetModel,
          prompt,
          system: systemPrompt,
          stream: true,
          options: {
            temperature: 0.4,
          },
        },
        {
          responseType: 'stream',
          timeout: 180000,
        },
      );

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter((l) => l.trim() !== '');
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                fullText += parsed.response;
                res.write(`data: ${JSON.stringify({ text: parsed.response })}\n\n`);
              }
              if (parsed.done) {
                res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
                res.end();
                resolve(fullText);
              }
            } catch (e) {
              // Ignore line parse errors
            }
          }
        });

        response.data.on('error', (err: any) => {
          this.logger.error(`Stream error: ${err.message}`);
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
          reject(err);
        });
      });
    } catch (err: any) {
      this.logger.error(`Ollama stream failed: ${err.message}`);
      res.write(`data: ${JSON.stringify({ error: `Cannot reach Ollama at ${this.host}. Please ensure Ollama is running.` })}\n\n`);
      res.end();
      return '';
    }
  }

  private cleanAndParseJson<T = any>(raw: string): T {
    let cleaned = raw.trim();
    // Strip markdown codeblocks ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract between outermost braces
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (firstErr) {
      // Robust JSON syntax sanitization:
      // 1. Remove trailing commas before } or ]
      let sanitized = cleaned.replace(/,\s*([}\]])/g, '$1');

      // 2. Escape literal unescaped newlines/tabs ONLY within quoted strings
      sanitized = sanitized.replace(/"(?:[^"\\]|\\.)*"/gs, (match) => {
        return match
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
      });

      try {
        return JSON.parse(sanitized) as T;
      } catch (secondErr) {
        this.logger.error(`Failed to parse LLM JSON after sanitization. Raw: ${cleaned.slice(0, 200)}...`);
        throw secondErr;
      }
    }
  }

  async generateJson<T = any>(prompt: string, systemPrompt: string): Promise<T> {
    // Fast health probe first to fail immediately if Ollama is not running
    try {
      await axios.get(`${this.host}/api/tags`, { timeout: 2500 });
    } catch (e: any) {
      throw new HttpException(
        `Không thể kết nối đến Ollama tại ${this.host}. Vui lòng mở Ollama trên máy tính trước khi chấm bài.`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response = await axios.post(
        `${this.host}/api/generate`,
        {
          model: this.textModel,
          prompt,
          system: systemPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2,
            num_ctx: 4096,
          },
        },
        { timeout: 180000 },
      );

      return this.cleanAndParseJson<T>(response.data.response);
    } catch (err: any) {
      this.logger.warn(`Primary JSON generation failed (${err.message}). Retrying once with temperature 0.1...`);
      try {
        const retryResponse = await axios.post(
          `${this.host}/api/generate`,
          {
            model: this.textModel,
            prompt: `${prompt}\n\nIMPORTANT: Return strictly valid JSON only. No explanation, no codeblocks.`,
            system: systemPrompt,
            stream: false,
            format: 'json',
            options: {
              temperature: 0.1,
              num_ctx: 4096,
            },
          },
          { timeout: 180000 },
        );
        return this.cleanAndParseJson<T>(retryResponse.data.response);
      } catch (retryErr: any) {
        this.logger.error(`Ollama JSON generation retry failed: ${retryErr.message}`);
        throw retryErr;
      }
    }
  }

  async analyzeTask1Image(base64Image: string, questionText: string): Promise<string> {
    let targetVisionModel = this.visionModel;

    // Probe installed models in Ollama to auto-detect any vision model
    try {
      const tagsRes = await axios.get(`${this.host}/api/tags`, { timeout: 3000 });
      const installedModels: string[] = (tagsRes.data.models || []).map((m: any) => m.name);

      if (!installedModels.includes(targetVisionModel)) {
        const found = installedModels.find((m) =>
          m.includes('llava') ||
          m.includes('moondream') ||
          m.includes('vision') ||
          m.includes('vl') ||
          m.includes('minicpm'),
        );

        if (found) {
          targetVisionModel = found;
          this.logger.log(`Auto-detected installed Vision Model: ${targetVisionModel}`);
        } else {
          this.logger.warn(
            `No Vision Model found in Ollama (Installed: ${installedModels.join(', ') || 'none'}). You can install one with 'ollama run llava'.`,
          );
          return JSON.stringify({
            chart_type: 'Biểu đồ Task 1',
            main_subject: questionText,
            key_trends: ['(Chưa nhận diện tự động do Ollama chưa cài Vision Model như llava hay qwen2.5-vl)'],
            significant_data_points: ['(Bấm nút "Chỉnh sửa số liệu" bên dưới để nhập số liệu thực tế từ ảnh)'],
            overview_summary: 'Tổng quan số liệu cần được nhập hoặc nhận diện từ hình ảnh.',
            missingVisionModel: true,
            needsManualInput: true,
          });
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not connect to Ollama to check models: ${e.message}`);
    }

    const prompt = `You are an expert IELTS Writing Task 1 visual data extractor.
Analyze this IELTS Writing Task 1 chart/diagram very carefully.
Question context: ${questionText}

Step-by-step visual analysis:
1. Chart Title & Axis Labels: Read the exact chart title, Y-axis unit (e.g. $ million, percentage, thousands), and X-axis categories.
2. Legend & Grouping: If there are grouped bars or multiple lines, carefully identify what each color/symbol represents (e.g. Red bar = Year 1, Blue bar = Year 2).
3. Value per Category: Look at each item along the X-axis and note its height/value for each year/group according to the Y-axis grid lines.
4. Highest & Lowest: Explicitly determine the highest overall category and the lowest category.
5. Key Comparisons & Trends: Note which items grew, which stayed the same, and which declined.
6. Expected Overview: Write a concise, band 8+ overview summarizing the main features without reciting every single number.

Return ONLY a valid JSON object matching this exact schema:
{
  "chart_type": "Bar chart | Line graph | Pie chart | Table | Process | Map",
  "main_subject": "Exact subject being measured, units of measurement, and time periods covered",
  "key_trends": [
    "Overall trend 1 (e.g. Category A had the highest spending in both years, rising from ~$X to ~$Y)",
    "Overall trend 2 (e.g. Category B was the lowest and the only item to decline from $X to $Y)"
  ],
  "significant_data_points": [
    "Category 1: Year X value vs Year Y value",
    "Category 2: Year X value vs Year Y value"
  ],
  "overview_summary": "Clear, professional 1-2 sentence IELTS band 8+ overview summarizing overall patterns."
}
Return raw JSON ONLY. No markdown, no conversational text.`;

    try {
      const response = await axios.post(
        `${this.host}/api/generate`,
        {
          model: targetVisionModel,
          prompt,
          images: [base64Image],
          stream: false,
          options: { temperature: 0.1 },
        },
        { timeout: 180000 },
      );

      const raw = response.data.response.trim();
      const cleaned = raw.replace(/^```json/i, '').replace(/```$/i, '').trim();
      return cleaned;
    } catch (err: any) {
      this.logger.warn(`Vision model failed or not installed: ${err.message}. Generating structured template.`);
      return JSON.stringify({
        chart_type: 'Biểu đồ Task 1',
        main_subject: questionText,
        key_trends: ['(Chưa nhận diện tự động do mô hình Vision bị lỗi kết nối)'],
        significant_data_points: ['(Bấm nút "Chỉnh sửa số liệu" để nhập số liệu thực tế từ ảnh)'],
        overview_summary: 'Tổng quan số liệu cần được nhập hoặc nhận diện từ hình ảnh.',
        missingVisionModel: true,
        needsManualInput: true,
      });
    }
  }
}
