import React, { useState, useEffect } from 'react';
import { Essay } from '../types';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Bookmark,
  Split,
  FileText,
  Star,
  Download,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EvaluationResultProps {
  essay: Essay;
  evaluation: any;
  onBackToEditor: () => void;
  onOpenNotebookModal: (text: string, meaning?: string) => void;
  onCloseToPrompts?: () => void;
}

export const EvaluationResult: React.FC<EvaluationResultProps> = ({
  essay,
  evaluation,
  onBackToEditor,
  onOpenNotebookModal,
  onCloseToPrompts,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'SIDE_BY_SIDE' | 'UPGRADED_ONLY'>('SIDE_BY_SIDE');
  const [savedErrorIndexes, setSavedErrorIndexes] = useState<number[]>([]);

  const {
    overallBand = 6.5,
    taTrScore = 6.5,
    ccScore = 6.0,
    lrScore = 6.5,
    graScore = 6.5,
    ideaAnalysis = {},
    detailedErrors = [],
    upgradedEssay = '',
  } = evaluation;

  const isTask1 = essay.prompt.taskType === 'TASK_1';
  const taTrLabel = isTask1 ? 'Task Achievement (TA)' : 'Task Response (TR)';

  // Trigger celebration confetti on evaluation mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleCopyUpgraded = () => {
    navigator.clipboard.writeText(upgradedEssay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveErrorToNotebook = (idx: number, suggested: string, explanation: string) => {
    onOpenNotebookModal(suggested, explanation);
    if (!savedErrorIndexes.includes(idx)) {
      setSavedErrorIndexes((prev) => [...prev, idx]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-pop-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToEditor}
            className="btn-neo-secondary px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Quay Lại Chỉnh Sửa Bài</span>
          </button>
          {onCloseToPrompts && (
            <button
              onClick={onCloseToPrompts}
              className="px-3.5 py-2 text-xs flex items-center gap-1.5 rounded-xl border-2 border-retro-border bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold shadow-neo-sm active:translate-y-0.5 transition-all"
              title="Đóng kết quả và quay về Kho Đề Thi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Về Kho Đề Thi</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full border-2 border-retro-border bg-amber-100 text-amber-900 shadow-neo-sm">
            ★ MỤC TIÊU: BAND {essay.aimBand.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="card-neo p-6 bg-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border-2 border-retro-border">
              <Award className="w-4 h-4" />
              <span>KẾT QUẢ ĐÁNH GIÁ CHUẨN IELTS EXAMINER</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {essay.prompt.title}
            </h1>
            <p className="text-xs text-slate-600 max-w-xl">
              Bài làm đã được chấm điểm chi tiết theo 4 tiêu chí chuẩn IELTS của Hội đồng khảo thí Cambridge với mô hình đánh giá cục bộ chạy trực tiếp trên máy của bạn.
            </p>
          </div>

          {/* Overall Band Badge */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-5 rounded-3xl border-3 border-retro-border shadow-neo min-w-[170px] transform hover:scale-105 transition-transform">
            <span className="text-[10px] font-pixel font-bold text-slate-500 uppercase tracking-wider">
              OVERALL BAND
            </span>
            <div className="text-5xl font-black text-[#285737] my-1 font-sans">
              {overallBand.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-extrabold">
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-none" />
              <span>Aim: Band {essay.aimBand.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 4 Criteria Scores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t-2 border-retro-border">
          {/* Criterion 1: TA / TR */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-retro-border border-l-4 border-l-emerald-500 shadow-neo-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">{taTrLabel}</span>
                <span className="text-sm font-black text-white px-2.5 py-0.5 rounded-lg bg-emerald-600 border border-slate-900 shadow-xs">
                  {taTrScore.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {ideaAnalysis.taTrFeedback || 'Đánh giá mức độ hoàn thành nhiệm vụ và chiều sâu lập luận.'}
              </p>
            </div>
          </div>

          {/* Criterion 2: CC */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-retro-border border-l-4 border-l-sky-500 shadow-neo-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">Coherence & Cohesion</span>
                <span className="text-sm font-black text-white px-2.5 py-0.5 rounded-lg bg-sky-600 border border-slate-900 shadow-xs">
                  {ccScore.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {ideaAnalysis.ccFeedback || 'Đánh giá tính mạch lạc, bố cục chia đoạn và từ nối liên kết.'}
              </p>
            </div>
          </div>

          {/* Criterion 3: LR */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-retro-border border-l-4 border-l-amber-500 shadow-neo-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">Lexical Resource</span>
                <span className="text-sm font-black text-white px-2.5 py-0.5 rounded-lg bg-amber-600 border border-slate-900 shadow-xs">
                  {lrScore.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {ideaAnalysis.lrFeedback || 'Đánh giá vốn từ vựng học thuật, độ chuẩn xác và collocations.'}
              </p>
            </div>
          </div>

          {/* Criterion 4: GRA */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-retro-border border-l-4 border-l-indigo-500 shadow-neo-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">Grammar & Accuracy</span>
                <span className="text-sm font-black text-white px-2.5 py-0.5 rounded-lg bg-indigo-600 border border-slate-900 shadow-xs">
                  {graScore.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {ideaAnalysis.graFeedback || 'Đánh giá độ phong phú và chính xác của cấu trúc câu phức.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Idea Analysis Section */}
      <div className="card-neo p-5 bg-white space-y-4">
        <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2 border-b-2 border-retro-border pb-3">
          <span>🧠 Phân Tích Chiều Sâu Luận Điểm (Idea Critique)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Well developed ideas */}
          <div className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ý Phát Triển Tốt & Thuyết Phục</span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-1.5 list-disc pl-4 font-medium">
              {(ideaAnalysis.wellDevelopedIdeas || ['Các luận điểm chính đã bám sát câu hỏi đề bài.']).map((idea: string, i: number) => (
                <li key={i}>{idea}</li>
              ))}
            </ul>
          </div>

          {/* Weak or Off-topic ideas */}
          <div className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ý Chưa Chặt Chẽ / Nguy Cơ Lạc Đề</span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-1.5 list-disc pl-4 font-medium">
              {(ideaAnalysis.weakOrOffTopicIdeas || ['Không phát hiện ý lạc đề nghiêm trọng.']).map((idea: string, i: number) => (
                <li key={i}>{idea}</li>
              ))}
            </ul>
          </div>

          {/* Key missing ideas */}
          <div className="p-4 rounded-2xl border-2 border-blue-400 bg-blue-50/70 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
              <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Ý Quan Trọng Nên Bổ Sung</span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-1.5 list-disc pl-4 font-medium">
              {(ideaAnalysis.keyMissingIdeas || ['Bổ sung thêm ví dụ thực tiễn để tăng sức nặng cho luận điểm.']).map((idea: string, i: number) => (
                <li key={i}>{idea}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Elaboration Advice Box */}
        {ideaAnalysis.elaborationAdvice && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-retro-border text-xs text-zinc-800 shadow-sm">
            <span className="font-black text-zinc-900">🎯 Lời khuyên triển khai luận điểm (Elaboration): </span>
            <span className="font-medium">{ideaAnalysis.elaborationAdvice}</span>
          </div>
        )}
      </div>

      {/* Detailed Errors Breakdown */}
      {detailedErrors.length > 0 && (
        <div className="card-neo p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b-2 border-retro-border pb-3">
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                <span>🔍 Bảng Đối Chiếu Lỗi Cụ Thể ({detailedErrors.length} điểm cần sửa)</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Các lỗi đã tự động được lưu vào Trí Nhớ Lỗi (Error Memory) để AI gia sư nhắc nhở ở các lần viết sau.
              </p>
            </div>
          </div>

          <div className="divide-y-2 divide-zinc-100">
            {detailedErrors.map((err: any, idx: number) => {
              const isSaved = savedErrorIndexes.includes(idx);

              return (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border border-retro-border bg-red-100 text-red-800">
                        {err.type || 'GRAMMAR'}
                      </span>
                      <span className="text-xs line-through text-red-600 font-semibold bg-red-50/70 px-2 py-0.5 rounded border border-red-200">
                        "{err.original}"
                      </span>
                      <span className="text-xs text-zinc-400 font-bold">➔</span>
                      <span className="text-xs text-emerald-800 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                        "{err.suggested}"
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 pl-1 font-normal leading-relaxed">{err.explanationVi}</p>
                  </div>

                  <button
                    onClick={() => handleSaveErrorToNotebook(idx, err.suggested, err.explanationVi)}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto rounded-xl border-2 border-retro-border shadow-neo-sm font-bold transition-all ${
                      isSaved ? 'bg-emerald-100 text-emerald-800' : 'bg-white hover:bg-ivory'
                    }`}
                    title="Lưu cụm từ đúng vào Notebook"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Đã Lưu Sổ Tay' : 'Lưu Sổ Tay'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Upgraded Essay */}
      <div className="card-neo p-5 bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-retro-border pb-3">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span>01 Bản Viết Nâng Cấp Chuẩn Aim Band {essay.aimBand.toFixed(1)}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Giữ nguyên khung tư duy lập luận của bạn, nâng cấp từ vựng C1/C2 và cấu trúc câu tự nhiên nhất.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'SIDE_BY_SIDE' ? 'UPGRADED_ONLY' : 'SIDE_BY_SIDE')}
              className="btn-neo-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{viewMode === 'SIDE_BY_SIDE' ? 'Xem Chỉ Bản Mới' : 'So Sánh 2 Bản'}</span>
            </button>

            <button
              onClick={handleCopyUpgraded}
              className="btn-neo-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã Sao Chép' : 'Sao Chép Bài Nâng Cấp'}</span>
            </button>
          </div>
        </div>

        {/* Display Side-by-Side or Upgraded only */}
        {viewMode === 'SIDE_BY_SIDE' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original */}
            <div className="p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-300">
              <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-2">
                📄 Bản Gốc Của Bạn ({essay.wordCount} từ)
              </span>
              <div className="text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap font-sans">
                {essay.content}
              </div>
            </div>

            {/* Right: Upgraded */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border-2 border-retro-border shadow-neo-sm">
              <span className="text-[11px] font-black text-[#285737] uppercase block mb-2">
                ✨ Bản Nâng Cấp Chuẩn Aim Band {essay.aimBand.toFixed(1)}
              </span>
              <div className="text-xs leading-relaxed text-zinc-900 whitespace-pre-wrap font-sans font-medium">
                {upgradedEssay}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border-2 border-retro-border shadow-neo-sm">
            <div className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap font-sans font-medium">
              {upgradedEssay}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
