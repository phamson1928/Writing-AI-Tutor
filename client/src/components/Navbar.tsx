import React from 'react';
import {
  BookOpen,
  PenTool,
  Bookmark,
  AlertTriangle,
  History,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'prompts' | 'workspace' | 'errors' | 'notebook' | 'analytics';
  setCurrentTab: (tab: 'prompts' | 'workspace' | 'errors' | 'notebook' | 'analytics') => void;
  ollamaStatus: { online: boolean; activeModel: string };
  hasActiveEssay: boolean;
  onOpenFlashcards: () => void;
  onCloseActiveEssay?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  ollamaStatus,
  hasActiveEssay,
  onOpenFlashcards,
  onCloseActiveEssay,
}) => {
  return (
    <header className="px-4 pt-3.5 pb-2 relative z-30">
      <div className="max-w-7xl mx-auto banner-amber-orange rounded-2xl px-5 py-3 relative flex flex-wrap items-center justify-between gap-3 text-slate-950">
        {/* Brand Logo - Bright & Punchy */}
        <div 
          onClick={() => setCurrentTab('prompts')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 border-2 border-slate-900 shadow-neo-sm flex items-center justify-center text-amber-300 font-black group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-slate-950 group-hover:text-amber-950 transition-colors">
                BandCraft<span className="text-white drop-shadow-sm">.ai</span>
              </span>
              <span className="bg-slate-900 text-amber-300 text-[10px] font-pixel font-bold px-2 py-0.5 rounded-lg border border-slate-900 shadow-xs">
                STUDIO
              </span>
            </div>
            <p className="text-[11px] text-amber-950/80 font-bold hidden sm:block">IELTS Writing Autonomous Studio</p>
          </div>
        </div>

        {/* Central Navigation Tabs - High Contrast Neo-Brutalist */}
        <nav className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => setCurrentTab('prompts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
              currentTab === 'prompts'
                ? 'bg-white text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                : 'bg-black/10 hover:bg-black/20 text-slate-950 hover:text-black border border-black/15'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kho Đề Thi</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('workspace')}
              disabled={!hasActiveEssay}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
                !hasActiveEssay ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                currentTab === 'workspace'
                  ? 'bg-white text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                  : 'bg-black/10 hover:bg-black/20 text-slate-950 hover:text-black border border-black/15'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Bàn Viết</span>
              {hasActiveEssay && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </button>
            {hasActiveEssay && onCloseActiveEssay && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Đóng bài viết hiện tại và quay về Kho Đề Thi? Bài viết của bạn đã được tự động lưu trong Lịch sử.')) {
                    onCloseActiveEssay();
                  }
                }}
                className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-rose-700 text-white flex items-center justify-center border-2 border-slate-900 transition-colors text-xs font-black shadow-xs"
                title="Đóng bài viết hiện tại"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentTab('errors')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
              currentTab === 'errors'
                ? 'bg-white text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                : 'bg-black/10 hover:bg-black/20 text-slate-950 hover:text-black border border-black/15'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Trí Nhớ Lỗi</span>
          </button>

          <button
            onClick={() => setCurrentTab('notebook')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
              currentTab === 'notebook'
                ? 'bg-white text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                : 'bg-black/10 hover:bg-black/20 text-slate-950 hover:text-black border border-black/15'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Sổ Từ Vựng</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
              currentTab === 'analytics'
                ? 'bg-white text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                : 'bg-black/10 hover:bg-black/20 text-slate-950 hover:text-black border border-black/15'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử & Band</span>
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Flashcard Review Pill */}
          <button
            onClick={onOpenFlashcards}
            className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-slate-900 shadow-neo-sm transition-all active:translate-y-0.5"
            title="Mở bộ thẻ ghi nhớ Flashcard lặp lại ngắt quãng (SRS)"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>Học Flashcard</span>
          </button>

          {/* Ollama Status Pill */}
          <div
            title={`Ollama Local Model: ${ollamaStatus.activeModel}`}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border-2 border-slate-900 bg-white/95 shadow-neo-sm ${
              ollamaStatus.online ? 'text-slate-900' : 'text-rose-700'
            }`}
          >
            {ollamaStatus.online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ollama: {ollamaStatus.activeModel}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Ollama Offline</span>
              </>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 bg-white/95 px-2.5 py-1 rounded-xl border-2 border-slate-900 shadow-neo-sm">
            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-amber-300">
              SP
            </div>
            <div className="hidden lg:block leading-tight text-left">
              <span className="block text-xs font-black text-slate-950">Sơn Phạm Hoàng</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
