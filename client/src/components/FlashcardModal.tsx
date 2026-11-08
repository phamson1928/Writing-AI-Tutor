import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  contextExample?: string;
  clozeExample?: string;
  type: string;
  tags?: string;
  reviewCount: number;
  masteryLevel: string;
  sourceTopic?: string;
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle?: string;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [useClozeMode, setUseClozeMode] = useState(false);
  const [reviewedInSession, setReviewedInSession] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notebook/flashcards');
      if (res.ok) {
        const data: Flashcard[] = await res.json();
        setCards(data);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsCompleted(false);
        setReviewedInSession(0);
      }
    } catch (err) {
      console.error('Failed to fetch flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCards();
    }
  }, [isOpen]);

  // Keyboard shortcut navigation (Space to flip, 1-2-3 to rate, Esc to close)
  useEffect(() => {
    if (!isOpen || isCompleted || cards.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          handleReview('AGAIN');
        } else if (e.key === '2') {
          handleReview('GOOD');
        } else if (e.key === '3') {
          handleReview('EASY');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, currentIndex, cards, isCompleted]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (outcome: 'AGAIN' | 'GOOD' | 'EASY') => {
    if (!currentCard) return;

    try {
      await fetch(`/api/notebook/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });

      setReviewedInSession((prev) => prev + 1);

      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop-in">
      <div className="bg-white card-neo max-w-2xl w-full p-6 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-border pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border-2 border-retro-border shadow-neo-sm flex items-center justify-center text-lg">
              📖
            </div>
            <div>
              <h2 className="font-black text-base text-zinc-900 leading-tight">
                Flashcard Ôn Tập Lặp Lại Ngắt Quãng (SRS)
              </h2>
              <span className="text-[11px] text-zinc-600 font-medium">
                {topicTitle ? `Bộ đề: ${topicTitle}` : 'Ôn luyện collocations & từ vựng đắt giá'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cards.length > 0 && !isCompleted && (
              <span className="text-xs font-pixel font-bold px-2.5 py-1 rounded-xl bg-white border-2 border-retro-border shadow-neo-sm text-[#285737]">
                {currentIndex + 1} / {cards.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border-2 border-retro-border font-bold text-sm bg-white hover:bg-zinc-100 flex items-center justify-center shadow-neo-sm active:translate-y-0.5"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mode Toggles */}
        {cards.length > 0 && !isCompleted && (
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseClozeMode(!useClozeMode)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border-2 border-retro-border transition-all flex items-center gap-1.5 ${
                  useClozeMode
                    ? 'bg-[#285737] text-white shadow-neo-sm'
                    : 'bg-white text-zinc-700 hover:bg-ivory'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{useClozeMode ? 'Đang bật bài tập đục lỗ (Cloze)' : 'Chuyển sang chế độ đục lỗ'}</span>
              </button>
            </div>

            <span className="text-[11px] text-zinc-500 font-medium italic hidden sm:inline">
              Bấm thẻ hoặc phím cách để lật đáp án
            </span>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#285737]" />
            <span className="text-xs font-bold text-zinc-700">Đang chuẩn bị bộ thẻ...</span>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-4xl">📚</div>
            <h3 className="font-black text-base text-zinc-900">Sổ từ vựng của bạn chưa có thẻ nào!</h3>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
              Trong lúc viết bài hoặc nhận xét từ AI Tutor, bạn chỉ cần bôi đen bất kỳ từ hoặc cụm collocation nào rồi bấm "Lưu Sổ Tay" để nạp vào bộ thẻ nhé.
            </p>
            <button
              onClick={onClose}
              className="btn-neo-primary px-5 py-2 text-xs rounded-xl"
            >
              Đã hiểu, quay lại viết bài
            </button>
          </div>
        ) : isCompleted ? (
          /* Completion State */
          <div className="py-12 text-center space-y-4 animate-pop-in">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 border-3 border-retro-border shadow-neo mx-auto flex items-center justify-center text-4xl animate-bounce">
              🎉
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900">
                Xuất Sắc! Bạn Đã Hoàn Thành Phiên Ôn Tập
              </h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-md mx-auto">
                Hệ thống SRS đã ghi nhận tiến trình ghi nhớ của bạn. Những từ vựng này sẽ giúp bạn tăng điểm tiêu chí Lexical Resource (LR) đáng kể!
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-retro-border max-w-xs mx-auto shadow-neo-sm text-xs space-y-1 font-bold">
              <div className="flex justify-between text-zinc-600">
                <span>Số thẻ đã ôn:</span>
                <span className="text-[#285737]">{reviewedInSession} thẻ</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Tỷ lệ hoàn thành:</span>
                <span className="text-emerald-700">100% Deck</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={fetchCards}
                className="btn-neo-secondary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ôn Tập Lại Lượt Nữa</span>
              </button>
              <button
                onClick={onClose}
                className="btn-neo-primary px-5 py-2 text-xs rounded-xl"
              >
                Đóng Thẻ
              </button>
            </div>
          </div>
        ) : (
          /* Active Flashcard */
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* 3D Flip Card Container */}
            <div
              onClick={handleFlip}
              className="cursor-pointer select-none perspective-1000 min-h-[260px] flex-1"
            >
              <div
                className={`relative w-full h-full min-h-[260px] rounded-3xl border-3 border-retro-border shadow-neo p-6 flex flex-col justify-between transition-all duration-300 transform ${
                  isFlipped
                    ? 'bg-amber-50/90 border-[#285737]'
                    : 'bg-white hover:border-[#285737]'
                }`}
              >
                {/* Card Header Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border border-retro-border bg-amber-100 text-amber-900">
                      {currentCard.type}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                      {currentCard.masteryLevel} · Đã ôn {currentCard.reviewCount} lần
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Mặt sau (Đáp án)' : 'Mặt trước (Câu hỏi)'}</span>
                  </span>
                </div>

                {/* Card Center Content */}
                <div className="py-6 text-center">
                  {!isFlipped ? (
                    /* Front side */
                    <div>
                      {useClozeMode && currentCard.clozeExample ? (
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-amber-800 uppercase block tracking-wider">
                            Điền từ/cụm từ còn thiếu vào chỗ trống:
                          </span>
                          <p className="text-base sm:text-lg font-bold text-zinc-900 leading-relaxed font-sans max-w-lg mx-auto">
                            "{currentCard.clozeExample}"
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h3 className="text-2xl sm:text-3xl font-black text-[#285737] tracking-tight">
                            {currentCard.front}
                          </h3>
                          {currentCard.contextExample && (
                            <p className="text-xs text-zinc-500 italic mt-2 max-w-md mx-auto line-clamp-2">
                              "{currentCard.contextExample}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Back side */
                    <div className="space-y-3 animate-pop-in">
                      <h3 className="text-2xl font-black text-[#285737]">
                        {currentCard.front}
                      </h3>
                      <div className="p-3 bg-white rounded-2xl border-2 border-retro-border inline-block max-w-md shadow-neo-sm">
                        <span className="text-xs font-extrabold text-zinc-500 uppercase block mb-0.5">
                          Ý nghĩa tiếng Việt:
                        </span>
                        <p className="text-sm font-black text-emerald-800">
                          {currentCard.back}
                        </p>
                      </div>

                      {currentCard.contextExample && (
                        <div className="text-xs text-zinc-700 bg-amber-100/60 p-2.5 rounded-xl border border-amber-300 max-w-lg mx-auto italic font-medium leading-relaxed">
                          Ví dụ: "{currentCard.contextExample}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Hint */}
                <div className="text-center text-[11px] text-zinc-400 font-medium">
                  {isFlipped
                    ? 'Hãy chọn mức độ ghi nhớ của bạn ở bên dưới ➔'
                    : '💡 Bấm vào thẻ để xem đáp án và giải nghĩa'}
                </div>
              </div>
            </div>

            {/* SRS Action Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-3 gap-3 pt-2 animate-pop-in">
                <button
                  type="button"
                  onClick={() => handleReview('AGAIN')}
                  className="p-3 rounded-2xl border-2 border-retro-border bg-red-100 text-red-900 hover:bg-red-200 font-extrabold text-xs flex flex-col items-center gap-1 shadow-neo-sm active:translate-y-0.5 transition-all"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Chưa Nhớ (AGAIN)</span>
                  <span className="text-[10px] font-normal text-red-700">Ôn lại sớm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReview('GOOD')}
                  className="p-3 rounded-2xl border-2 border-retro-border bg-amber-100 text-amber-900 hover:bg-amber-200 font-extrabold text-xs flex flex-col items-center gap-1 shadow-neo-sm active:translate-y-0.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Nhớ Được (GOOD)</span>
                  <span className="text-[10px] font-normal text-amber-700">Tiếp tục củng cố</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReview('EASY')}
                  className="p-3 rounded-2xl border-2 border-retro-border bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-extrabold text-xs flex flex-col items-center gap-1 shadow-neo-sm active:translate-y-0.5 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Thành Thạo (EASY)</span>
                  <span className="text-[10px] font-normal text-emerald-700">Đã làm chủ</span>
                </button>
              </div>
            ) : (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleFlip}
                  className="btn-neo-secondary py-3 px-6 text-xs rounded-2xl font-black w-full"
                >
                  Lật Thẻ Xem Đáp Án ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
