import React, { useState, useEffect } from 'react';
import { NotebookItem } from '../types';
import { Trash2, Search, BookMarked, Tag, Sparkles, Loader2, Download, Check, Zap } from 'lucide-react';

interface NotebookViewProps {
  onOpenFlashcards?: () => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({ onOpenFlashcards }) => {
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const url = filterType === 'ALL' ? '/api/notebook' : `/api/notebook?type=${filterType}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load notebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này khỏi sổ tay?')) return;
    try {
      const res = await fetch(`/api/notebook/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/notebook/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ielts-notebook-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.originalText.toLowerCase().includes(q) ||
      (item.meaningVi && item.meaningVi.toLowerCase().includes(q)) ||
      (item.tags && item.tags.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-pop-in">
      {/* Top Header */}
      <div className="bg-white card-neo p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📖</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Sổ Tay Từ Vựng & Cấu Trúc
            </h1>
            <span className="text-xs font-pixel font-bold px-2.5 py-0.5 rounded-lg bg-amber-300 border-2 border-retro-border shadow-neo-sm text-slate-950">
              {items.length} MỤC
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm">
            Kho lưu trữ từ vựng C1/C2, collocations và cấu trúc câu bạn đã thu thập từ các bài viết.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {onOpenFlashcards && (
            <button
              onClick={onOpenFlashcards}
              disabled={items.length === 0}
              className="bg-amber-300 hover:bg-amber-400 text-zinc-950 font-black text-xs px-3.5 py-2 rounded-xl border-2 border-retro-border shadow-neo-sm active:translate-y-0.5 transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Mở Flashcard SRS ôn tập ngay các từ đã lưu"
            >
              <Zap className="w-4 h-4 fill-current text-amber-900" />
              <span>⚡ Ôn Tập Flashcard (SRS)</span>
            </button>
          )}

          {/* Export Markdown Button */}
          <button
            onClick={handleExportMarkdown}
            disabled={exporting || items.length === 0}
            className="btn-neo-primary px-4 py-2 text-xs flex items-center gap-1.5 rounded-xl disabled:opacity-50"
            title="Tải về file Markdown để import vào Notion, Obsidian hoặc in ra ôn tập"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{exporting ? 'Đang Xuất...' : 'Xuất File Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-retro-border shadow-neo-sm">
          {[
            { label: 'Tất cả', value: 'ALL' },
            { label: '💡 Collocations', value: 'COLLOCATION' },
            { label: '📝 Từ Vựng C1/C2', value: 'VOCABULARY' },
            { label: '🏗️ Cấu Trúc Câu', value: 'SENTENCE_STRUCTURE' },
            { label: '✨ Diễn Đạt Tự Nhiên', value: 'REFINED_PHRASE' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-3 py-1.5 rounded-xl border border-transparent text-xs font-bold transition-all ${
                filterType === tab.value
                  ? 'bg-retro-navy text-white shadow-neo-sm border-retro-border'
                  : 'text-zinc-700 hover:bg-ivory'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng, collocation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-2xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy font-medium shadow-neo-sm"
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <span className="text-white font-bold text-xs">Đang tải sổ tay...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-neo p-12 text-center bg-ivory max-w-lg mx-auto">
          <div className="text-4xl mb-2">📚</div>
          <p className="font-extrabold text-zinc-900 text-sm">Chưa có mục nào trong sổ tay</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
            Trong lúc viết bài hoặc nhận xét từ AI Tutor, bạn chỉ cần bôi đen bất kỳ cụm từ nào và bấm "Lưu Sổ Tay".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card-neo-sm p-4 bg-white flex flex-col justify-between group hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-retro-border bg-amber-100 text-amber-900">
                      {item.type}
                    </span>
                    {typeof item.masteryLevel === 'number' && item.masteryLevel > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-retro-border ${
                        item.masteryLevel >= 4 ? 'bg-emerald-100 text-emerald-800' :
                        item.masteryLevel >= 2 ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Level {item.masteryLevel}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-zinc-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                    title="Xóa mục này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-extrabold text-sm text-[#285737] mb-1.5 leading-snug">
                  {item.originalText}
                </h3>

                {item.meaningVi && (
                  <p className="text-xs text-zinc-700 font-medium mb-2 leading-relaxed">
                    <span className="font-bold text-zinc-500">Nghĩa:</span> {item.meaningVi}
                  </p>
                )}

                {item.contextExample && (
                  <p className="text-[11px] text-zinc-600 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 leading-relaxed font-sans">
                    "{item.contextExample}"
                  </p>
                )}
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                <span className="bg-zinc-100 px-2 py-0.5 rounded font-mono text-zinc-600">{item.tags || 'General'}</span>
                <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
