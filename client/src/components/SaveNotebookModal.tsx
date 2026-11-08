import React, { useState, useEffect } from 'react';
import { Bookmark, Check, X, Loader2 } from 'lucide-react';

interface SaveNotebookModalProps {
  initialText: string;
  initialMeaning?: string;
  essayId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SaveNotebookModal: React.FC<SaveNotebookModalProps> = ({
  initialText,
  initialMeaning = '',
  essayId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [text, setText] = useState(initialText);
  const [type, setType] = useState<'COLLOCATION' | 'VOCABULARY' | 'SENTENCE_STRUCTURE' | 'REFINED_PHRASE'>('COLLOCATION');
  const [meaningVi, setMeaningVi] = useState(initialMeaning);
  const [contextExample, setContextExample] = useState('');
  const [tags, setTags] = useState('Writing');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(initialText);
    setMeaningVi(initialMeaning || '');
  }, [initialText, initialMeaning]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId,
          type,
          originalText: text,
          meaningVi,
          contextExample,
          tags,
        }),
      });

      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error('Failed to save to notebook:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop-in">
      <div className="bg-white card-neo max-w-md w-full p-6">
        <div className="flex items-center justify-between border-b-2 border-retro-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h3 className="font-black text-base text-zinc-900">Lưu Vào Sổ Tay Cá Nhân</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl border-2 border-retro-border font-bold text-xs bg-white hover:bg-zinc-100 flex items-center justify-center shadow-neo-sm active:translate-y-0.5"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1.5">
              Loại Kiến Thức
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setType('COLLOCATION')}
                className={`py-2 px-2.5 rounded-xl border-2 border-retro-border font-bold transition-all text-center ${
                  type === 'COLLOCATION'
                    ? 'bg-[#285737] text-white shadow-neo-sm'
                    : 'bg-white text-zinc-700 hover:bg-ivory'
                }`}
              >
                💡 Collocation
              </button>
              <button
                type="button"
                onClick={() => setType('VOCABULARY')}
                className={`py-2 px-2.5 rounded-xl border-2 border-retro-border font-bold transition-all text-center ${
                  type === 'VOCABULARY'
                    ? 'bg-[#285737] text-white shadow-neo-sm'
                    : 'bg-white text-zinc-700 hover:bg-ivory'
                }`}
              >
                📝 Từ Vựng C1/C2
              </button>
              <button
                type="button"
                onClick={() => setType('SENTENCE_STRUCTURE')}
                className={`py-2 px-2.5 rounded-xl border-2 border-retro-border font-bold transition-all text-center ${
                  type === 'SENTENCE_STRUCTURE'
                    ? 'bg-[#285737] text-white shadow-neo-sm'
                    : 'bg-white text-zinc-700 hover:bg-ivory'
                }`}
              >
                🏗️ Cấu Trúc Câu
              </button>
              <button
                type="button"
                onClick={() => setType('REFINED_PHRASE')}
                className={`py-2 px-2.5 rounded-xl border-2 border-retro-border font-bold transition-all text-center ${
                  type === 'REFINED_PHRASE'
                    ? 'bg-[#285737] text-white shadow-neo-sm'
                    : 'bg-white text-zinc-700 hover:bg-ivory'
                }`}
              >
                ✨ Diễn Đạt Tự Nhiên
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
              Từ / Cụm từ tiếng Anh
            </label>
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
              Ý nghĩa tiếng Việt
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đóng vai trò thiết yếu..."
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
              Câu ví dụ ngữ cảnh
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Practical skills play an essential role in career development."
              value={contextExample}
              onChange={(e) => setContextExample(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-retro-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-neo-secondary px-4 py-2 text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-neo-primary px-5 py-2 text-xs flex items-center gap-1.5 bg-[#285737]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Lưu Vào Sổ Tay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
