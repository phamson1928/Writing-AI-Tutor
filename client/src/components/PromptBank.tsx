import React, { useState } from 'react';
import { TopicPrompt } from '../types';
import { Plus, Image as ImageIcon, ArrowRight, BookOpen, Sparkles, Loader2, Play, CheckCircle2, SlidersHorizontal, BookCheck, Zap, Trash2 } from 'lucide-react';

interface PromptBankProps {
  prompts: TopicPrompt[];
  loading: boolean;
  onSelectPrompt: (promptId: string, aimBand: number) => void;
  onRefresh: () => void;
  onOpenFlashcards: (topicTitle?: string) => void;
}

export const PromptBank: React.FC<PromptBankProps> = ({
  prompts,
  loading,
  onSelectPrompt,
  onRefresh,
  onOpenFlashcards,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'TASK_1' | 'TASK_2'>('ALL');
  const [selectedAimBand, setSelectedAimBand] = useState<number>(7.0);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New prompt form state
  const [taskType, setTaskType] = useState<'TASK_1' | 'TASK_2'>('TASK_2');
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('Education');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !questionText.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('taskType', taskType);
      formData.append('title', title);
      formData.append('questionText', questionText);
      formData.append('category', category);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/prompts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const createdData = await res.json().catch(() => null);
        const savedTitle = createdData?.title || title;
        setIsCreating(false);
        setTitle('');
        setQuestionText('');
        setImageFile(null);
        setImagePreview(null);
        setSuccessMessage(`Đã thêm thành công đề thi mới: "${savedTitle}"! Đề thi đã được lưu và sẵn sàng để luyện viết.`);
        setTimeout(() => setSuccessMessage(null), 6000);
        onRefresh();
      } else {
        const errData = await res.json().catch(() => null);
        alert(`Không thể tạo đề thi: ${errData?.message || 'Lỗi kết nối máy chủ'}`);
      }
    } catch (err) {
      console.error('Failed to create prompt:', err);
      alert('Lỗi kết nối khi gửi dữ liệu đề thi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = async (e: React.MouseEvent, promptId: string, promptTitle: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa đề thi:\n"${promptTitle}"?\n\nLưu ý: Mọi bài viết và dữ liệu chấm điểm của đề thi này cũng sẽ bị xóa vĩnh viễn.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMessage(`Đã xóa thành công đề thi: "${promptTitle}"!`);
        setTimeout(() => setSuccessMessage(null), 6000);
        onRefresh();
      } else {
        const err = await res.json().catch(() => null);
        alert(`Không thể xóa đề thi: ${err?.message || 'Lỗi server'}`);
      }
    } catch (err) {
      console.error('Delete prompt failed:', err);
      alert('Lỗi kết nối khi xóa đề thi.');
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    if (filterType === 'ALL') return true;
    return p.taskType === filterType;
  });

  // Category pill tag colors matching "The IELTS Dictionary" pastel aesthetic
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'culture':
      case 'society':
      case 'society & culture':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'history':
      case 'technology':
        return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'transportation':
      case 'environment':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'education':
      case 'psychology':
        return 'bg-teal-100 text-teal-700 border-teal-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-100 border-2 border-slate-900 rounded-2xl shadow-neo flex items-center justify-between gap-3 text-emerald-950 animate-pop-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm border-2 border-slate-900 shadow-neo-sm shrink-0">
              ✓
            </div>
            <div>
              <p className="font-black text-sm text-slate-900">Tạo Đề Thi Mới Thành Công!</p>
              <p className="text-xs text-slate-700 font-medium">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-black shadow-neo-sm shrink-0 transition-colors"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Control Bar */}
      <div className="bg-white/95 rounded-3xl border-2 border-retro-border p-5 mb-6 shadow-neo flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#3D200E] text-amber-200 flex items-center justify-center font-black text-xs border-2 border-retro-border shadow-neo-sm">
              BC
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Kho Luyện Thi IELTS Writing
            </h1>
            <span className="text-xs font-pixel font-bold px-2.5 py-0.5 rounded-lg bg-amber-300 border-2 border-retro-border shadow-neo-sm text-slate-950">
              {prompts.length} ĐỀ THI
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm">
            Hệ thống đề thi Cambridge chuẩn hóa, cá nhân hóa theo Aim Band với AI Tutor đồng hành sửa bài trực tiếp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Aim Band Global Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border-2 border-retro-border shadow-neo-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Aim Band:</span>
            <select
              value={selectedAimBand}
              onChange={(e) => setSelectedAimBand(parseFloat(e.target.value))}
              className="font-black text-xs text-[#285737] outline-none bg-transparent cursor-pointer"
            >
              <option value={5.5}>5.5</option>
              <option value={6.0}>6.0</option>
              <option value={6.5}>6.5</option>
              <option value={7.0}>7.0 (Khuyến nghị)</option>
              <option value={7.5}>7.5</option>
              <option value={8.0}>8.0</option>
              <option value={8.5}>8.5</option>
            </select>
          </div>

          {/* Filter Task Tabs */}
          <div className="bg-slate-50 p-1 rounded-2xl border-2 border-retro-border shadow-neo-sm flex items-center gap-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterType === 'ALL'
                  ? 'bg-[#285737] text-white shadow-neo-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setFilterType('TASK_1')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterType === 'TASK_1'
                  ? 'bg-[#285737] text-white shadow-neo-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Task 1
            </button>
            <button
              onClick={() => setFilterType('TASK_2')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterType === 'TASK_2'
                  ? 'bg-[#285737] text-white shadow-neo-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Task 2
            </button>
          </div>

          {/* Add Prompt Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="btn-neo-amber px-4 py-2 text-xs flex items-center gap-1.5 rounded-2xl"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Đề Mới</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#285737]" />
          <span className="text-slate-700 font-bold text-sm tracking-wide">Đang tải danh sách đề thi...</span>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="bg-white card-neo p-12 text-center max-w-lg mx-auto">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="font-extrabold text-base text-zinc-900">Không tìm thấy đề thi phù hợp</h3>
          <p className="text-xs text-zinc-600 mt-1 mb-4">
            Bạn có thể đổi bộ lọc hoặc bấm "Thêm Đề Mới" để tải đề của bạn vào hệ thống.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-neo-amber px-4 py-2 text-xs"
          >
            Thêm Đề Thi Ngay
          </button>
        </div>
      ) : (
        /* Cambridge Style Dual Cards Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Card 1: CAM 10 - TEST 1 */}
          <div className="relative bg-white rounded-[2rem] border-2 border-retro-border p-6 shadow-neo-lg transition-transform hover:-translate-y-1">
            {/* Top CAM 10 Badge Tab */}
            <div className="absolute -top-3.5 right-8 bg-amber-400 border-2 border-retro-border font-pixel font-bold text-xs text-slate-950 px-4 py-1 rounded-xl shadow-neo-sm">
              CAM 10
            </div>

            {/* Test Header */}
            <div className="flex items-center gap-4 mb-5">
              {/* Modern Academic Book Icon Card */}
              <div className="w-16 h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#285737] to-[#312E81] border-2 border-retro-border shadow-neo-sm p-2 flex flex-col items-center justify-between text-center select-none text-white">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span className="text-[9px] font-pixel font-bold text-slate-200 leading-tight">
                  IELTS<br />OFFICIAL
                </span>
                <div className="w-full bg-amber-400 border border-black rounded text-[10px] font-black text-slate-950">
                  VOL 10
                </div>
              </div>

              {/* Title & Badges */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">CAMBRIDGE 10 · TEST 1</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border-2 border-retro-border">
                    ★ MỤC TIÊU: BAND {selectedAimBand.toFixed(1)}
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border-2 border-retro-border">
                    CHẾ ĐỘ THI THẬT
                  </span>
                </div>
              </div>
            </div>

            {/* Passages List Inside Test Card */}
            <div className="space-y-3 mb-5">
              {filteredPrompts.slice(0, 3).map((prompt, idx) => {
                const badgeColor = idx === 0 ? 'bg-[#EF4444]' : idx === 1 ? 'bg-[#3B82F6]' : 'bg-[#10B981]';
                const isTask1 = prompt.taskType === 'TASK_1';

                return (
                  <div
                    key={prompt.id}
                    onClick={() => onSelectPrompt(prompt.id, selectedAimBand)}
                    className="group bg-slate-50 hover:bg-white rounded-2xl border-2 border-retro-border p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-[#285737] hover:shadow-neo-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Number Square Badge */}
                      <div className={`w-8 h-8 rounded-xl ${badgeColor} border-2 border-retro-border text-white font-black text-sm flex items-center justify-center shrink-0`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#285737] transition-colors line-clamp-1">
                            {prompt.title}
                          </h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(prompt.category)}`}>
                            {prompt.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {isTask1 ? 'Task 1 · Phân tích biểu đồ & xu hướng (150+ từ)' : 'Task 2 · Nghị luận xã hội & dẫn chứng (250+ từ)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeletePrompt(e, prompt.id, prompt.title)}
                        className="w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center justify-center shrink-0 z-10"
                        title="Xóa đề thi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-400 font-medium hidden sm:inline">Chưa làm</span>
                      <div className="w-7 h-7 rounded-full border-2 border-retro-border bg-white flex items-center justify-center group-hover:bg-[#285737] group-hover:text-white transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flashcard Vocabulary Hint link with working click */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => onOpenFlashcards('CAM 10 - TEST 1')}
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-[#285737] hover:underline transition-colors text-left"
              >
                <span>📖</span>
                <span>Học từ vựng cả đề trước (flashcard SRS) →</span>
              </button>
            </div>

            {/* Bottom Dual Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onSelectPrompt(filteredPrompts[0]?.id || prompts[0]?.id, selectedAimBand)}
                className="btn-neo-secondary py-3 text-sm font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5"
              >
                <span>LUYỆN TẬP</span>
              </button>

              <button
                onClick={() => onSelectPrompt(filteredPrompts[0]?.id || prompts[0]?.id, selectedAimBand)}
                className="btn-neo-primary py-3 text-sm font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 bg-[#285737]"
              >
                <span>ĐI THI</span>
                <Play className="w-3.5 h-3.5 fill-white stroke-none" />
              </button>
            </div>
          </div>

          {/* Card 2: CAM 10 - TEST 2 */}
          <div className="relative bg-white rounded-[2rem] border-2 border-retro-border p-6 shadow-neo-lg transition-transform hover:-translate-y-1">
            {/* Top CAM 10 Badge Tab */}
            <div className="absolute -top-3.5 right-8 bg-amber-400 border-2 border-retro-border font-pixel font-bold text-xs text-slate-950 px-4 py-1 rounded-xl shadow-neo-sm">
              CAM 10
            </div>

            {/* Test Header */}
            <div className="flex items-center gap-4 mb-5">
              {/* Modern Academic Book Icon Card */}
              <div className="w-16 h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#285737] to-[#312E81] border-2 border-retro-border shadow-neo-sm p-2 flex flex-col items-center justify-between text-center select-none text-white">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span className="text-[9px] font-pixel font-bold text-slate-200 leading-tight">
                  IELTS<br />OFFICIAL
                </span>
                <div className="w-full bg-amber-400 border border-black rounded text-[10px] font-black text-slate-950">
                  VOL 10
                </div>
              </div>

              {/* Title & Badges */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">CAMBRIDGE 10 · TEST 2</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border-2 border-retro-border">
                    ★ MỤC TIÊU: BAND {selectedAimBand.toFixed(1)}
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border-2 border-retro-border">
                    CHẾ ĐỘ THI THẬT
                  </span>
                </div>
              </div>
            </div>

            {/* Passages List Inside Test Card */}
            <div className="space-y-3 mb-5">
              {(filteredPrompts.length > 3 ? filteredPrompts.slice(3, 6) : filteredPrompts.slice(0, 3)).map((prompt, idx) => {
                const badgeColor = idx === 0 ? 'bg-[#EF4444]' : idx === 1 ? 'bg-[#3B82F6]' : 'bg-[#10B981]';
                const isTask1 = prompt.taskType === 'TASK_1';

                return (
                  <div
                    key={`t2-${prompt.id}`}
                    onClick={() => onSelectPrompt(prompt.id, selectedAimBand)}
                    className="group bg-slate-50 hover:bg-white rounded-2xl border-2 border-retro-border p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-[#285737] hover:shadow-neo-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Number Square Badge */}
                      <div className={`w-8 h-8 rounded-xl ${badgeColor} border-2 border-retro-border text-white font-black text-sm flex items-center justify-center shrink-0`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#285737] transition-colors line-clamp-1">
                            {prompt.title}
                          </h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(prompt.category)}`}>
                            {prompt.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {isTask1 ? 'Task 1 · Phân tích biểu đồ & xu hướng (150+ từ)' : 'Task 2 · Nghị luận xã hội & dẫn chứng (250+ từ)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeletePrompt(e, prompt.id, prompt.title)}
                        className="w-7 h-7 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center justify-center shrink-0 z-10"
                        title="Xóa đề thi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-400 font-medium hidden sm:inline">Chưa làm</span>
                      <div className="w-7 h-7 rounded-full border-2 border-retro-border bg-white flex items-center justify-center group-hover:bg-[#285737] group-hover:text-white transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flashcard Vocabulary Hint link with working click */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => onOpenFlashcards('CAM 10 - TEST 2')}
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-[#285737] hover:underline transition-colors text-left"
              >
                <span>📖</span>
                <span>Học từ vựng cả đề trước (flashcard SRS) →</span>
              </button>
            </div>

            {/* Bottom Dual Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onSelectPrompt(filteredPrompts[1]?.id || prompts[0]?.id, selectedAimBand)}
                className="btn-neo-secondary py-3 text-sm font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5"
              >
                <span>LUYỆN TẬP</span>
              </button>

              <button
                onClick={() => onSelectPrompt(filteredPrompts[1]?.id || prompts[0]?.id, selectedAimBand)}
                className="btn-neo-primary py-3 text-sm font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 bg-[#285737]"
              >
                <span>ĐI THI</span>
                <Play className="w-3.5 h-3.5 fill-white stroke-none" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional & Custom Prompts Grid if > 6 prompts */}
      {filteredPrompts.length > 6 && (
        <div className="mt-8 bg-white card-neo p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-retro-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="font-black text-lg text-zinc-900">
                Các Đề Thi Khác & Đề Tự Tạo ({filteredPrompts.length - 6} đề)
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.slice(6).map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt.id, selectedAimBand)}
                className="card-neo-sm p-4 bg-ivory hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#285737] text-white text-[10px] font-pixel font-bold px-2 py-0.5 rounded-lg border border-retro-border">
                        {prompt.taskType}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(prompt.category)}`}>
                        {prompt.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePrompt(e, prompt.id, prompt.title)}
                      className="w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center justify-center shrink-0"
                      title="Xóa đề thi này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-900 line-clamp-2 mb-1">
                    {prompt.title}
                  </h4>
                  <p className="text-xs text-zinc-600 line-clamp-3">
                    {prompt.questionText}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-200 flex items-center justify-between text-xs font-bold text-[#285737]">
                  <span>Luyện viết đề này ➔</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Thêm đề mới (With Task 1 Vision Support) */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop-in">
          <div className="bg-ivory card-neo max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-retro-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h2 className="font-black text-lg text-zinc-900">Thêm Đề Thi Mới</h2>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="w-8 h-8 rounded-xl border-2 border-retro-border font-bold text-sm bg-white hover:bg-zinc-100 flex items-center justify-center shadow-neo-sm active:translate-y-0.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrompt} className="space-y-4">
              {/* Task type select */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                  Dạng Bài
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskType('TASK_2')}
                    className={`p-2.5 rounded-xl border-2 border-retro-border text-xs font-bold text-center transition-all ${
                      taskType === 'TASK_2'
                        ? 'bg-[#285737] text-white shadow-neo-sm'
                        : 'bg-white text-zinc-700 hover:bg-ivory'
                    }`}
                  >
                    Task 2 · Nghị Luận (Essay)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('TASK_1')}
                    className={`p-2.5 rounded-xl border-2 border-retro-border text-xs font-bold text-center transition-all ${
                      taskType === 'TASK_1'
                        ? 'bg-[#285737] text-white shadow-neo-sm'
                        : 'bg-white text-zinc-700 hover:bg-ivory'
                    }`}
                  >
                    Task 1 · Biểu Đồ (Visual)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                  Tiêu Đề Đề Bài
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Academic Subjects vs Practical Skills"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                  Chủ Đề (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy font-medium"
                >
                  <option value="Education">Education (Giáo dục)</option>
                  <option value="Environment">Environment (Môi trường)</option>
                  <option value="Technology">Technology (Công nghệ)</option>
                  <option value="Society">Society & Culture (Xã hội & Văn hóa)</option>
                  <option value="Government">Government & Economy (Kinh tế & Chính sách)</option>
                  <option value="Transportation">Transportation (Giao thông)</option>
                  <option value="Psychology">Psychology (Tâm lý & Đổi mới)</option>
                  <option value="Work & Careers">Work & Careers (Việc làm)</option>
                </select>
              </div>

              {/* Question text */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1.5">
                  Nội Dung Câu Hỏi Đề Bài (Prompt)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Dán toàn bộ đề bài IELTS vào đây..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-retro-border bg-white outline-none focus:ring-2 focus:ring-retro-navy resize-none font-medium"
                />
              </div>

              {/* Image upload if Task 1 */}
              {taskType === 'TASK_1' && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-retro-border border-dashed">
                  <label className="block text-xs font-bold text-zinc-800 uppercase mb-1">
                    Ảnh Biểu Đồ Task 1 (Hỗ trợ Vision AI phân tích)
                  </label>
                  <p className="text-[11px] text-zinc-600 mb-2.5">
                    Tải ảnh biểu đồ lên, Vision Model cục bộ sẽ tự động bóc tách số liệu để AI làm căn cứ chấm bài.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-zinc-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-2 file:border-retro-border file:text-xs file:font-bold file:bg-white file:hover:bg-zinc-100 cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-3 rounded-xl border-2 border-retro-border overflow-hidden max-h-44 bg-white p-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-retro-border">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="btn-neo-secondary px-4 py-2 text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-neo-primary px-5 py-2 text-xs flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <span>Lưu Đề Bài</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
