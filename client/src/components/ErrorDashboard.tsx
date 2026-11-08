import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Bookmark,
  Calendar,
  Search,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ErrorDashboardProps {
  onOpenNotebookModal: (text: string, meaning?: string) => void;
}

export const ErrorDashboard: React.FC<ErrorDashboardProps> = ({ onOpenNotebookModal }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalErrors: number;
    typeStats: Array<{ type: string; count: number }>;
    recentErrors: any[];
  }>({
    totalErrors: 0,
    typeStats: [],
    recentErrors: [],
  });
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/errors/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch error summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const filteredErrors = summary.recentErrors.filter((err) => {
    const matchesType = filterType === 'ALL' || err.errorType === filterType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      err.originalSnippet.toLowerCase().includes(q) ||
      err.correctedSnippet.toLowerCase().includes(q) ||
      err.explanationVi.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-pop-in">
      {/* Top Header */}
      <div className="bg-white card-neo p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🧠</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Trí Nhớ Lỗi & Tiến Trình Cải Thiện
            </h1>
            <span className="text-xs font-pixel font-bold px-2.5 py-0.5 rounded-lg bg-amber-300 border-2 border-retro-border shadow-neo-sm text-slate-950">
              {summary.totalErrors} LỖI ĐÃ LƯU
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm">
            AI Tutor ghi nhớ tất cả lỗi sai từ các bài thi trước để chủ động nhắc nhở bạn không lặp lại.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#285737]" />
          <span className="text-slate-700 font-bold text-xs">Đang phân tích dữ liệu lỗi...</span>
        </div>
      ) : summary.totalErrors === 0 ? (
        <div className="card-neo p-12 text-center bg-ivory max-w-lg mx-auto">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-extrabold text-base text-zinc-900">Chưa có dữ liệu lỗi sai!</h3>
          <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
            Sau khi hoàn thành bài viết và bấm "Nộp Bài & Đánh Giá", AI Examiner sẽ tự động bóc tách các điểm cần lưu ý và lưu vào bộ nhớ tại đây.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-neo p-5 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Tổng Số Lỗi Đã Ghi Nhận</span>
                <span className="text-4xl font-black text-zinc-900 font-sans">{summary.totalErrors}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-retro-border shadow-neo-sm flex items-center justify-center text-xl">
                ⚠️
              </div>
            </div>

            <div className="card-neo p-5 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Loại Lỗi Thường Gặp Nhất</span>
                <span className="text-lg font-black text-red-600">
                  {summary.typeStats[0]?.type || 'N/A'}
                </span>
                <span className="text-xs text-zinc-400 block mt-0.5">
                  {summary.typeStats[0]?.count ? `${summary.typeStats[0].count} lần xuất hiện` : ''}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 border-2 border-retro-border shadow-neo-sm flex items-center justify-center text-xl">
                🎯
              </div>
            </div>

            <div className="card-neo p-5 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Trạng Thái AI Companion</span>
                <span className="text-sm font-black text-emerald-700 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang giám sát chủ động
                </span>
                <span className="text-[11px] text-zinc-400 block mt-0.5">
                  Tự động đưa vào system prompt gia sư
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-retro-border shadow-neo-sm flex items-center justify-center text-xl">
                🤖
              </div>
            </div>
          </div>

          {/* Progress Breakdown by Error Category */}
          <div className="card-neo p-5 bg-white space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-900 border-b-2 border-retro-border pb-2.5 flex items-center gap-2">
              <span>📊 Phân Bổ Theo Danh Mục Lỗi (Taxonomy Distribution)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.typeStats.map((stat) => {
                const percentage = Math.round((stat.count / summary.totalErrors) * 100);

                return (
                  <div key={stat.type} className="p-3 bg-zinc-50 rounded-2xl border-2 border-zinc-200">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-zinc-800">{stat.type}</span>
                      <span className="text-zinc-500 font-mono">{stat.count} lỗi ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden border border-retro-border">
                      <div
                        className="h-full bg-retro-navy transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Error Log */}
          <div className="card-neo p-5 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-retro-border pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900">
                  Chi Tiết Các Lỗi Đã Ghi Nhận ({filteredErrors.length})
                </h3>
                <p className="text-xs text-zinc-500">
                  Bấm nút lưu vào sổ tay nếu muốn đưa cụm từ đúng vào danh sách ôn tập.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Lọc lỗi theo từ khóa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border-2 border-retro-border outline-none focus:ring-1 focus:ring-retro-navy"
                />
              </div>
            </div>

            <div className="divide-y-2 divide-zinc-100">
              {filteredErrors.map((err) => (
                <div key={err.id} className="py-3.5 flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-retro-border bg-red-100 text-red-800">
                        {err.errorType}
                      </span>
                      <span className="text-xs line-through text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        "{err.originalSnippet}"
                      </span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                      <span className="text-xs text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300">
                        "{err.correctedSnippet}"
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed font-normal">{err.explanationVi}</p>
                  </div>

                  <button
                    onClick={() => onOpenNotebookModal(err.correctedSnippet, err.explanationVi)}
                    className="btn-neo-secondary px-3 py-1 text-xs flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Lưu Sổ Tay</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
