import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  FileText,
  RotateCcw,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface HistoryAnalyticsViewProps {
  onOpenEvaluation: (essay: any, evaluation: any) => void;
  onOpenDraft: (essay: any) => void;
  onRefreshEssays: () => void;
}

export const HistoryAnalyticsView: React.FC<HistoryAnalyticsViewProps> = ({
  onOpenEvaluation,
  onOpenDraft,
  onRefreshEssays,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'history'>('analytics');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [essays, setEssays] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, essaysRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/essays'),
      ]);

      if (overviewRes.ok) {
        const ov = await overviewRes.json();
        setOverview(ov);
      }
      if (essaysRes.ok) {
        const es = await essaysRes.json();
        setEssays(es);
      }
    } catch (err) {
      console.error('Failed to load history & analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewEvaluation = async (essay: any) => {
    try {
      const res = await fetch(`/api/examiner/${essay.id}`);
      if (res.ok) {
        const evalData = await res.json();
        onOpenEvaluation(essay, evalData);
      } else {
        alert('Chưa có dữ liệu chấm cho bài viết này.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async (essayId: string) => {
    if (!confirm('Bạn có muốn tạo một phiên bản viết lại (Revision) mới cho đề bài này?')) return;
    try {
      const res = await fetch(`/api/essays/${essayId}/retry`, { method: 'POST' });
      if (res.ok) {
        const newEssay = await res.json();
        onOpenDraft(newEssay);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (essayId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      const res = await fetch(`/api/essays/${essayId}`, { method: 'DELETE' });
      if (res.ok) {
        setEssays((prev) => prev.filter((e) => e.id !== essayId));
        fetchData();
        onRefreshEssays();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-pop-in">
      {/* Top Header */}
      <div className="bg-white card-neo p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⏱️</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Lịch Sử Luyện Viết & Tiến Trình Điểm Số
            </h1>
            <span className="text-xs font-pixel font-bold px-2.5 py-0.5 rounded-lg bg-amber-300 border-2 border-retro-border shadow-neo-sm text-slate-950">
              {essays.length} BÀI ĐÃ LÀM
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm">
            Theo dõi sự tiến bộ qua từng bài thi, xem lại nhận xét của giám khảo và viết lại để nâng band.
          </p>
        </div>

        {/* Tab switch button pills */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border-2 border-retro-border shadow-neo-sm">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#285737] text-white shadow-neo-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            📊 Thống Kê & Band
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#285737] text-white shadow-neo-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            ⏱️ Danh Sách Bài Viết ({essays.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow" />
          <span className="text-white font-bold text-xs">Đang tổng hợp dữ liệu...</span>
        </div>
      ) : activeTab === 'analytics' ? (
        /* Analytics View */
        <div className="space-y-6">
          {/* 4 Metric Hero Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-neo p-4 bg-white flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Tổng Bài Viết</span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl font-black text-zinc-900 font-sans">{overview?.totalEssays || 0}</span>
                <span className="text-xs text-zinc-500 font-bold">({overview?.completedEvaluations || 0} đã chấm)</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Task 1: {overview?.taskBreakdown?.task1 || 0} · Task 2: {overview?.taskBreakdown?.task2 || 0}
              </div>
            </div>

            <div className="card-neo p-4 bg-white flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Tổng Từ Đã Viết</span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl font-black text-[#285737] font-sans">{overview?.totalWords || 0}</span>
                <span className="text-xs text-zinc-500 font-bold">từ vựng</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">
                ✓ Sức bền viết học thuật cao
              </div>
            </div>

            <div className="card-neo p-4 bg-white flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Thời Gian Luyện Tập</span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl font-black text-amber-600 font-sans">{overview?.totalMinutes || 0}</span>
                <span className="text-xs text-zinc-500 font-bold">phút</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Đo bằng bộ đếm phòng thi
              </div>
            </div>

            <div className="card-neo p-4 bg-white flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase">Overall Band Ước Tính</span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-3xl font-black text-emerald-700 font-sans">
                  {overview?.averageBand ? overview.averageBand.toFixed(1) : 'Chưa có'}
                </span>
                {overview?.bestBand > 0 && (
                  <span className="text-xs text-amber-700 font-black">
                    (Max: {overview.bestBand.toFixed(1)})
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">
                Dựa trên {overview?.completedEvaluations || 0} bài thi chuẩn
              </div>
            </div>
          </div>

          {/* Criteria Averages Card */}
          {overview?.completedEvaluations > 0 && (
            <div className="card-neo p-5 bg-white space-y-4">
              <h3 className="font-extrabold text-sm text-zinc-900 border-b-2 border-retro-border pb-2.5 flex items-center gap-2">
                <span>🎯 Điểm Trung Bình 4 Tiêu Chí IELTS</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 text-center shadow-sm">
                  <span className="text-[11px] font-black text-emerald-800 block mb-1 uppercase">Task Response / TA</span>
                  <span className="text-3xl font-black text-emerald-900">{overview.criteriaAverages.taTr.toFixed(1)}</span>
                </div>
                <div className="p-3 bg-sky-50/80 rounded-2xl border-2 border-sky-300 text-center shadow-sm">
                  <span className="text-[11px] font-black text-sky-800 block mb-1 uppercase">Coherence & Cohesion</span>
                  <span className="text-3xl font-black text-sky-900">{overview.criteriaAverages.cc.toFixed(1)}</span>
                </div>
                <div className="p-3 bg-amber-50/80 rounded-2xl border-2 border-amber-300 text-center shadow-sm">
                  <span className="text-[11px] font-black text-amber-800 block mb-1 uppercase">Lexical Resource</span>
                  <span className="text-3xl font-black text-amber-900">{overview.criteriaAverages.lr.toFixed(1)}</span>
                </div>
                <div className="p-3 bg-indigo-50/80 rounded-2xl border-2 border-indigo-300 text-center shadow-sm">
                  <span className="text-[11px] font-black text-indigo-800 block mb-1 uppercase">Grammar & Accuracy</span>
                  <span className="text-3xl font-black text-indigo-900">{overview.criteriaAverages.gra.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Band Progression Timeline */}
          {overview?.bandTrend && overview.bandTrend.length > 0 && (
            <div className="card-neo p-5 bg-white space-y-4">
              <h3 className="font-extrabold text-sm text-zinc-900 border-b-2 border-retro-border pb-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Tiến Trình Điểm Số Theo Thời Gian (Band Progression)</span>
              </h3>

              <div className="space-y-3">
                {overview.bandTrend.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-amber-50/70 rounded-2xl border-2 border-retro-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hover:shadow-neo-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#285737] border-2 border-retro-border text-white flex flex-col items-center justify-center font-black text-sm shrink-0">
                        <span>{item.overallBand.toFixed(1)}</span>
                        <span className="text-[8px] font-pixel text-amber-300">BAND</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-900 line-clamp-1">{item.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span>{item.date}</span>
                          <span>•</span>
                          <span className="font-bold text-zinc-700">{item.taskType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 bg-white px-3 py-1.5 rounded-xl border border-retro-border">
                      <span>TR: {item.taTrScore.toFixed(1)}</span>
                      <span>•</span>
                      <span>CC: {item.ccScore.toFixed(1)}</span>
                      <span>•</span>
                      <span>LR: {item.lrScore.toFixed(1)}</span>
                      <span>•</span>
                      <span>GRA: {item.graScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Essays History List */
        <div className="space-y-4">
          {essays.length === 0 ? (
            <div className="card-neo p-12 text-center bg-ivory">
              <div className="text-4xl mb-2">📝</div>
              <h3 className="font-black text-base text-zinc-900">Chưa có bài viết nào trong lịch sử</h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
                Hãy vào Kho Đề Thi, chọn 1 đề bài và bắt đầu luyện viết để hệ thống lưu giữ tiến độ học tập nhé.
              </p>
            </div>
          ) : (
            essays.map((essay) => {
              const hasEvaluation = !!essay.evaluation;
              const isReviewed = essay.status === 'REVIEWED';

              return (
                <div
                  key={essay.id}
                  className="card-neo p-5 bg-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group hover:-translate-y-0.5 transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-pixel font-bold px-2 py-0.5 rounded bg-[#285737] text-white border border-retro-border">
                        {essay.prompt.taskType}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-retro-border bg-amber-100 text-amber-900">
                        {essay.prompt.category}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isReviewed
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isReviewed ? '✓ Đã chấm' : 'Đang viết dở'}
                      </span>
                      {hasEvaluation && (
                        <span className="text-xs font-black text-white px-2 py-0.5 rounded-lg bg-[#10B981] border border-black shadow-neo-sm">
                          BAND {essay.evaluation.overallBand.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-zinc-900 group-hover:text-[#285737] transition-colors">
                      {essay.prompt.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>Độ dài: <strong className="text-zinc-800">{essay.wordCount} từ</strong></span>
                      <span>•</span>
                      <span>Mục tiêu: <strong className="text-amber-800">Band {essay.aimBand.toFixed(1)}</strong></span>
                      <span>•</span>
                      <span>Cập nhật: {new Date(essay.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                    {hasEvaluation ? (
                      <button
                        onClick={() => handleViewEvaluation(essay)}
                        className="btn-neo-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-xl font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Bài Chấm</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenDraft(essay)}
                        className="btn-neo-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-xl font-bold bg-[#285737]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Viết Tiếp</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRetry(essay.id)}
                      className="btn-neo-secondary px-3 py-1.5 text-xs flex items-center gap-1 rounded-xl font-bold"
                      title="Viết lại bài này từ đầu (Revision)"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Viết Lại</span>
                    </button>

                    <button
                      onClick={() => handleDelete(essay.id)}
                      className="text-zinc-400 hover:text-red-600 p-2 rounded-xl border border-transparent hover:border-retro-border hover:bg-red-50 transition-colors"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

