import React, { useState, useEffect, useRef } from 'react';
import { Essay, TutorMessage } from '../types';
import {
  Mic,
  MicOff,
  Send,
  Save,
  Sparkles,
  Search,
  BookMarked,
  Lightbulb,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  LogOut,
} from 'lucide-react';
import { SaveNotebookModal } from './SaveNotebookModal';
import { TipTapEditor } from './TipTapEditor';

interface WritingWorkspaceProps {
  essay: Essay;
  onUpdateEssay: (updated: Essay) => void;
  onRefreshNotebookCount: () => void;
  onShowEvaluation: (evaluation: any) => void;
  onCloseEssay?: () => void;
}

export const WritingWorkspace: React.FC<WritingWorkspaceProps> = ({
  essay,
  onUpdateEssay,
  onRefreshNotebookCount,
  onShowEvaluation,
  onCloseEssay,
}) => {
  const [content, setContent] = useState(essay.content || '');
  const [wordCount, setWordCount] = useState(essay.wordCount || 0);
  const [aimBand, setAimBand] = useState<number>(essay.aimBand || 7.0);
  const [savingStatus, setSavingStatus] = useState<'SAVED' | 'SAVING' | 'DIRTY'>('SAVED');
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Timer state
  const isTask1 = essay.prompt.taskType === 'TASK_1';
  const defaultSeconds = isTask1 ? 20 * 60 : 40 * 60;
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<TutorMessage[]>(essay.chatMessages || []);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // In-line selection state
  const [selectedText, setSelectedText] = useState('');

  // Notebook modal
  const [notebookModalOpen, setNotebookModalOpen] = useState(false);
  const [textToSave, setTextToSave] = useState('');

  // Voice recording state (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Task 1 Chart toggle
  const [showChartDetails, setShowChartDetails] = useState(false);
  const [frequentErrors, setFrequentErrors] = useState<Array<{ type: string; count: number }>>([]);

  // Parsed Task 1 Chart Data if present
  const parsedChartData = React.useMemo(() => {
    if (!essay.prompt.chartDataJson) return null;
    try {
      return JSON.parse(essay.prompt.chartDataJson);
    } catch {
      return null;
    }
  }, [essay.prompt.chartDataJson]);

  // Edit Chart Data state
  const [isEditingChart, setIsEditingChart] = useState(false);
  const [editChartType, setEditChartType] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTrends, setEditTrends] = useState('');
  const [editFigures, setEditFigures] = useState('');
  const [editOverview, setEditOverview] = useState('');
  const [isSavingChart, setIsSavingChart] = useState(false);

  const handleStartEditChart = () => {
    setEditChartType(parsedChartData?.chart_type || 'Bar chart');
    setEditSubject(parsedChartData?.main_subject || essay.prompt.questionText || '');
    setEditTrends(
      Array.isArray(parsedChartData?.key_trends)
        ? parsedChartData.key_trends.join('\n')
        : ''
    );
    setEditFigures(
      Array.isArray(parsedChartData?.significant_data_points)
        ? parsedChartData.significant_data_points.join('\n')
        : ''
    );
    setEditOverview(parsedChartData?.overview_summary || '');
    setIsEditingChart(true);
  };

  const handleSaveChartData = async () => {
    setIsSavingChart(true);
    const updatedPayload = {
      chart_type: editChartType.trim() || 'Bar chart',
      main_subject: editSubject.trim(),
      key_trends: editTrends.split('\n').map((s) => s.trim()).filter(Boolean),
      significant_data_points: editFigures.split('\n').map((s) => s.trim()).filter(Boolean),
      overview_summary: editOverview.trim(),
      manualEdited: true,
    };

    try {
      const res = await fetch(`/api/prompts/${essay.prompt.id}/chart-data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartDataJson: JSON.stringify(updatedPayload) }),
      });

      if (res.ok) {
        onUpdateEssay({
          ...essay,
          prompt: {
            ...essay.prompt,
            chartDataJson: JSON.stringify(updatedPayload),
          },
        });
        setIsEditingChart(false);
      } else {
        alert('Không thể cập nhật số liệu biểu đồ. Vui lòng kiểm tra lại backend.');
      }
    } catch (err) {
      console.error('Update chart data failed:', err);
      alert('Lỗi kết nối khi cập nhật số liệu.');
    } finally {
      setIsSavingChart(false);
    }
  };

  // Fetch top frequent errors for personalized proactive reminder
  useEffect(() => {
    fetch('/api/errors/frequent?limit=2')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFrequentErrors(data))
      .catch(() => {});
  }, []);

  // Timer countdown effect & periodic time sync to backend
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  // Sync elapsed time to database every 30 seconds
  useEffect(() => {
    const timeSyncInterval = setInterval(() => {
      if (isTimerRunning) {
        fetch(`/api/essays/${essay.id}/time`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds: 30 }),
        }).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(timeSyncInterval);
  }, [isTimerRunning, essay.id]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Exit & Close Workspace
  const handleExitWorkspace = async () => {
    if (confirm('Lưu bản nháp và quay về Kho Đề Thi? Bạn có thể mở lại bài viết này trong phần "Lịch Sử & Band" bất cứ lúc nào.')) {
      setSavingStatus('SAVING');
      try {
        await fetch(`/api/essays/${essay.id}/autosave`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
      } catch (err) {
        console.error('Error saving before exit:', err);
      }
      if (onCloseEssay) {
        onCloseEssay();
      }
    }
  };

  // Target word count
  const targetWords = isTask1 ? 150 : 250;

  // Debounced autosave
  useEffect(() => {
    setSavingStatus('DIRTY');
    const timer = setTimeout(async () => {
      setSavingStatus('SAVING');
      try {
        const res = await fetch(`/api/essays/${essay.id}/autosave`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const updated = await res.json();
          setWordCount(updated.wordCount);
          setSavingStatus('SAVED');
          onUpdateEssay({
            ...essay,
            content,
            wordCount: updated.wordCount,
            aimBand,
          });
        }
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, essay.id, aimBand]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Chrome hoặc Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Send message to AI Tutor
  const handleSendMessage = async (customMsg?: string, selected?: string) => {
    const messageToSend = customMsg || inputMessage;
    if (!messageToSend.trim() || isStreaming) return;

    const userMsg: TutorMessage = {
      id: Date.now().toString(),
      role: 'user',
      inputMethod: isRecording ? 'VOICE' : 'TEXT',
      selectedText: selected || (selectedText || undefined),
      content: messageToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsStreaming(true);
    setStreamingText('');

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId: essay.id,
          message: messageToSend,
          selectedText: selected || (selectedText || undefined),
          inputMethod: isRecording ? 'VOICE' : 'TEXT',
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAssistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.text) {
                fullAssistantText += data.text;
                setStreamingText(fullAssistantText);
              }
              if (data.done) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    inputMethod: 'TEXT',
                    content: data.fullText || fullAssistantText,
                    createdAt: new Date().toISOString(),
                  },
                ]);
                setStreamingText('');
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  // Trigger In-line action from Bubble Menu
  const handleInlineAction = async (
    actionType: 'FIX_GRAMMAR' | 'UPGRADE_SENTENCE' | 'COLLOCATION' | 'ALL_IN_ONE',
    overrideText?: string,
  ) => {
    const targetText = overrideText || selectedText;
    if (!targetText || isStreaming) return;

    const actionTitle =
      actionType === 'ALL_IN_ONE'
        ? `⚡ Đánh giá toàn diện 3-in-1 (Lỗi + Nâng cấp Band ${aimBand.toFixed(1)} + Collocation): "${targetText}"`
        : actionType === 'FIX_GRAMMAR'
        ? `🔍 Kiểm tra & Sửa lỗi câu: "${targetText}"`
        : actionType === 'UPGRADE_SENTENCE'
        ? `✨ Nâng cấp câu theo Aim Band ${aimBand.toFixed(1)}: "${targetText}"`
        : `💡 Gợi ý Collocations học thuật: "${targetText}"`;

    const userMsg: TutorMessage = {
      id: Date.now().toString(),
      role: 'user',
      inputMethod: 'TEXT',
      selectedText: targetText,
      content: actionTitle,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText('');

    try {
      const response = await fetch('/api/tutor/inline-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId: essay.id,
          actionType,
          selectedText: targetText,
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAssistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.text) {
                fullAssistantText += data.text;
                setStreamingText(fullAssistantText);
              }
              if (data.done) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    inputMethod: 'TEXT',
                    content: data.fullText || fullAssistantText,
                    createdAt: new Date().toISOString(),
                  },
                ]);
                setStreamingText('');
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      console.error('Inline action error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle Submit & Evaluate
  const handleSubmitEvaluation = async () => {
    if (wordCount < 40) {
      alert('Bài viết cần ít nhất 40-50 từ để Examiner phân tích được đầy đủ 4 tiêu chí và luận điểm.');
      return;
    }

    setIsEvaluating(true);
    try {
      // Ensure content is saved first
      await fetch(`/api/essays/${essay.id}/autosave`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const res = await fetch(`/api/examiner/${essay.id}/submit`, {
        method: 'POST',
      });

      if (res.ok) {
        const evalData = await res.json();
        onShowEvaluation(evalData);
      } else {
        const err = await res.json();
        alert(`Lỗi đánh giá: ${err.message || 'Không thể kết nối đến AI Examiner'}`);
      }
    } catch (err: any) {
      console.error('Evaluation error:', err);
      alert('Không thể hoàn thành chấm bài. Hãy đảm bảo Ollama đang chạy trên máy của bạn.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 px-4 animate-pop-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Writing Canvas (Cols 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card Đề Bài & Thông Tin Đầu Bài */}
          <div className="card-neo p-5 relative overflow-hidden bg-white">
            {/* Top Bar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-retro-border pb-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#285737] text-white text-[11px] font-pixel font-bold px-2.5 py-0.5 rounded-lg border border-retro-border">
                  {essay.prompt.taskType}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-retro-border bg-emerald-100 text-emerald-800">
                  {essay.prompt.category}
                </span>

                {/* Aim Band Selector */}
                <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border-2 border-retro-border shadow-neo-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">MỤC TIÊU:</span>
                  <select
                    value={aimBand}
                    onChange={(e) => setAimBand(parseFloat(e.target.value))}
                    className="font-black text-xs text-[#285737] outline-none bg-transparent cursor-pointer"
                  >
                    <option value={6.0}>Band 6.0</option>
                    <option value={6.5}>Band 6.5</option>
                    <option value={7.0}>Band 7.0</option>
                    <option value={7.5}>Band 7.5</option>
                    <option value={8.0}>Band 8.0</option>
                    <option value={8.5}>Band 8.5</option>
                  </select>
                </div>
              </div>

              {/* Timer & Autosave Status & Exit */}
              <div className="flex items-center gap-2.5">
                {/* Timer Pill */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border-2 border-retro-border shadow-neo-sm text-xs font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-600" />
                  <span className={secondsLeft < 300 ? 'text-red-600 animate-pulse font-black' : 'text-zinc-800'}>
                    {formatTimer(secondsLeft)}
                  </span>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="text-zinc-500 hover:text-zinc-900 ml-1"
                    title={isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}
                  >
                    {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-zinc-700" />}
                  </button>
                </div>

                {/* Autosave status indicator */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                  {savingStatus === 'SAVING' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span className="hidden sm:inline">Đang lưu...</span>
                    </>
                  ) : savingStatus === 'SAVED' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Đã lưu</span>
                    </>
                  ) : (
                    <span className="hidden sm:inline">Đã sửa...</span>
                  )}
                </div>

                {/* Exit Draft Button */}
                <button
                  type="button"
                  onClick={handleExitWorkspace}
                  className="px-3 py-1 rounded-xl border-2 border-retro-border bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-400 font-extrabold text-xs flex items-center gap-1.5 shadow-neo-sm active:translate-y-0.5 transition-all text-slate-700"
                  title="Lưu bản nháp và quay lại Kho đề thi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đóng & Thoát</span>
                </button>
              </div>
            </div>

            {/* Title & Question */}
            <h2 className="font-black text-base text-slate-900 mb-2">{essay.prompt.title}</h2>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 border-l-4 border-l-[#285737] shadow-sm">
              {essay.prompt.questionText}
            </div>

            {/* Task 1 Visual Chart Preview if available */}
            {isTask1 && essay.prompt.imageUrl && (
              <div className="mt-3 pt-3 border-t-2 border-retro-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-zinc-800 flex items-center gap-1.5">
                    <span>📊 Biểu Đồ Task 1</span>
                  </span>
                  <button
                    onClick={() => setShowChartDetails(!showChartDetails)}
                    className="text-[11px] font-bold text-retro-navy hover:underline flex items-center gap-1"
                  >
                    {showChartDetails ? 'Thu gọn số liệu' : 'Xem số liệu bóc tách từ Vision AI'}
                    {showChartDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="rounded-2xl border-2 border-retro-border overflow-hidden bg-white max-h-56 flex items-center justify-center p-2">
                  <img
                    src={essay.prompt.imageUrl}
                    alt="Task 1 Chart"
                    className="max-h-52 w-auto object-contain"
                  />
                </div>

                {showChartDetails && (
                  <div className="mt-3 p-4 bg-amber-50/95 rounded-2xl border-2 border-retro-border text-xs text-slate-900 space-y-3 shadow-neo-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🤖</span>
                        <span className="font-black text-xs text-slate-900 uppercase">
                          Căn Cứ Dữ Liệu Bóc Tách (Vision AI Ground Truth)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {parsedChartData?.chart_type || 'Biểu đồ Task 1'}
                        </span>
                        {!isEditingChart && (
                          <button
                            type="button"
                            onClick={handleStartEditChart}
                            className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-slate-900 border border-slate-900 shadow-neo-sm active:translate-y-0.5 transition-all flex items-center gap-1"
                          >
                            ✏️ Nhập / Chỉnh Sửa Số Liệu
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notice if vision model is missing or template was used */}
                    {(parsedChartData?.missingVisionModel || parsedChartData?.key_trends?.[0]?.includes('chưa') || parsedChartData?.significant_data_points?.[0]?.includes('Highest point')) && !isEditingChart && (
                      <div className="p-3 bg-amber-100/90 rounded-xl border border-amber-300 text-amber-950 text-xs space-y-1 shadow-xs">
                        <div className="flex items-center gap-1.5 font-black text-amber-900">
                          <span>💡</span>
                          <span>Chưa có Vision Model để AI tự động quét ảnh</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Trong Ollama trên máy bạn hiện chưa có mô hình đọc ảnh (Vision Model như <code>llava</code> hoặc <code>qwen2.5-vl</code>). 
                          Bạn có thể mở Terminal gõ lệnh <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">ollama run llava</code> để tải, 
                          <strong> hoặc bấm ngay nút "✏️ Nhập / Chỉnh Sửa Số Liệu" ở trên</strong> để điền các con số từ ảnh vào đây cho AI làm căn cứ chấm bài!
                        </p>
                      </div>
                    )}

                    {isEditingChart ? (
                      /* In-Place Chart Data Editor Form */
                      <div className="space-y-3 bg-white p-3.5 rounded-2xl border-2 border-retro-border shadow-neo-sm animate-pop-in">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                          <span className="font-black text-xs text-slate-900">
                            ✏️ Điền / Chỉnh Sửa Số Liệu Chuẩn Từ Biểu Đồ
                          </span>
                          <span className="text-[11px] text-slate-500">Dùng làm đáp án chấm Task Achievement</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                            Dạng Biểu Đồ
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Bar chart, Line graph, Pie chart"
                            value={editChartType}
                            onChange={(e) => setEditChartType(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border-2 border-retro-border bg-slate-50 outline-none font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                            🎯 Đối Tượng & Mốc Thời Gian
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Spending per household in the US on five products, 2010 and 2014 ($ million)"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border-2 border-retro-border bg-slate-50 outline-none font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                            📈 Xu Hướng Lớn (Mỗi dòng 1 ý)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ví dụ:&#10;Food là khoản chi lớn nhất trong cả 2 năm&#10;Books là khoản chi duy nhất giảm mạnh"
                            value={editTrends}
                            onChange={(e) => setEditTrends(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border-2 border-retro-border bg-slate-50 outline-none font-medium resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                            🔢 Các Mốc Số Liệu Nổi Bật (Mỗi dòng 1 số liệu)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Ví dụ:&#10;Food: $3700m (2010) tăng lên $4400m (2014)&#10;Clothes: giữ nguyên ở mức khoảng $2500m&#10;Books: giảm từ $1000m xuống còn $500m"
                            value={editFigures}
                            onChange={(e) => setEditFigures(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border-2 border-retro-border bg-slate-50 outline-none font-medium resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                            💡 Tóm Tắt Tổng Quan Chuẩn (Expected Overview)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Ví dụ: Overall, food accounted for the highest spending in both years, while books had the lowest figures and was the only category to decline."
                            value={editOverview}
                            onChange={(e) => setEditOverview(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border-2 border-retro-border bg-slate-50 outline-none font-medium resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setIsEditingChart(false)}
                            className="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-100 text-xs font-black shadow-neo-sm"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={isSavingChart}
                            onClick={handleSaveChartData}
                            className="btn-neo-primary px-4 py-1.5 text-xs flex items-center gap-1.5 rounded-xl"
                          >
                            {isSavingChart ? 'Đang Lưu...' : '✓ Lưu Số Liệu Chuẩn'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display View */
                      <>
                        <p className="text-[11px] text-slate-600 italic">
                          Dưới đây là các số liệu và xu hướng được dùng làm căn cứ chuẩn để AI chấm tiêu chí <strong>Task Achievement (TA)</strong> cho bạn:
                        </p>

                        {parsedChartData ? (
                          <div className="space-y-2.5">
                            {parsedChartData.main_subject && (
                              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-xs">
                                <span className="font-extrabold text-[11px] text-amber-950 block mb-0.5">
                                  🎯 Đối tượng đo lường & Mốc thời gian:
                                </span>
                                <span className="text-slate-800 font-medium text-xs">
                                  {parsedChartData.main_subject}
                                </span>
                              </div>
                            )}

                            {parsedChartData.key_trends && Array.isArray(parsedChartData.key_trends) && (
                              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-xs">
                                <span className="font-extrabold text-[11px] text-amber-950 block mb-1">
                                  📈 Xu hướng lớn (Overall Trends):
                                </span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium text-xs">
                                  {parsedChartData.key_trends.map((trend: string, idx: number) => (
                                    <li key={idx}>{trend}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {parsedChartData.significant_data_points && Array.isArray(parsedChartData.significant_data_points) && (
                              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-xs">
                                <span className="font-extrabold text-[11px] text-amber-950 block mb-1">
                                  🔢 Các mốc số liệu nổi bật (Key Figures):
                                </span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium text-xs">
                                  {parsedChartData.significant_data_points.map((pt: string, idx: number) => (
                                    <li key={idx}>{pt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {parsedChartData.overview_summary && (
                              <div className="bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200 shadow-xs">
                                <span className="font-extrabold text-[11px] text-emerald-900 block mb-0.5">
                                  💡 Tóm tắt tổng quan chuẩn (Standard Overview):
                                </span>
                                <span className="text-slate-800 font-medium text-xs">
                                  {parsedChartData.overview_summary}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap text-[11px] bg-white p-2.5 rounded-xl border border-amber-200 font-mono">
                            {essay.prompt.chartDataJson || 'Chưa có số liệu bóc tách cho đề này.'}
                          </pre>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Bàn Soạn Thảo (Writing Canvas) */}
          <div className="card-neo p-5 bg-white relative">
            <div className="flex items-center justify-between mb-3 border-b-2 border-retro-border pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-600">
                ✍️ Không Gian Viết Bài (Essay Editor)
              </span>

              {/* Word counter with live progress */}
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold">
                  Số từ: <span className={wordCount >= targetWords ? 'text-emerald-600 font-black' : 'text-zinc-800'}>{wordCount}</span> / {targetWords}
                </div>
                <div className="w-20 h-2 bg-zinc-200 rounded-full overflow-hidden border border-retro-border">
                  <div
                    className={`h-full transition-all duration-300 ${wordCount >= targetWords ? 'bg-emerald-500' : 'bg-retro-amber'}`}
                    style={{ width: `${Math.min(100, (wordCount / targetWords) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Instruction helper */}
            <div className="text-[11px] text-zinc-500 mb-2 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <span>💡</span>
              <span>Bôi đen câu bất kỳ bằng chuột để: Kiểm tra lỗi, Nâng cấp câu Band {aimBand.toFixed(1)}, hoặc Lưu vào Sổ tay.</span>
            </div>

            {/* TipTap Rich Text Editor with Bubble Menu */}
            <TipTapEditor
              content={content}
              onChange={(newText, newCount) => {
                setContent(newText);
                setWordCount(newCount);
              }}
              onInlineAction={(actionType, selected) => {
                setSelectedText(selected);
                handleInlineAction(actionType, selected);
              }}
              onSaveToNotebook={(selected) => {
                setTextToSave(selected);
                setNotebookModalOpen(true);
              }}
            />

            {/* Bottom action toolbar */}
            <div className="mt-4 pt-3 border-t-2 border-retro-border flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-zinc-500 font-medium">
                {wordCount < targetWords ? (
                  <span className="text-amber-700 font-bold">
                    ⚠️ Còn thiếu {targetWords - wordCount} từ để đạt mức tiêu chuẩn {targetWords} từ.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Đã đạt độ dài tiêu chuẩn IELTS ({wordCount} từ)!
                  </span>
                )}
              </div>

              {/* Submit for Examiner Evaluation Button */}
              <button
                disabled={isEvaluating}
                onClick={handleSubmitEvaluation}
                className="btn-neo-primary px-6 py-2.5 text-xs flex items-center gap-2 rounded-2xl bg-[#285737] hover:bg-[#1E4329] uppercase tracking-wider font-black shadow-[3px_3px_0px_#0F172A] disabled:opacity-50 text-white"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Examiner Đang Chấm...</span>
                  </>
                ) : (
                  <>
                    <span>Nộp Bài & Đánh Giá</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Tutor Companion (Cols 5) */}
        <div className="lg:col-span-5 sticky top-4">
          <div className="card-neo bg-white flex flex-col h-[calc(100vh-100px)] overflow-hidden">
            {/* Tutor Header - Bright Amber-Orange Signature */}
            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 border-b-2 border-retro-border flex items-center justify-between text-slate-950 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border-2 border-slate-900 shadow-neo-sm flex items-center justify-center text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-950 leading-tight">
                    AI IELTS Tutor
                  </h3>
                  <span className="text-[11px] text-amber-950 font-bold">
                    Gia sư đồng hành 1-on-1 · Gợi ý ý tưởng & sửa lỗi
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-black bg-white/95 text-slate-950 px-2.5 py-1 rounded-xl border-2 border-retro-border shadow-neo-sm">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-amber-600 animate-ping' : 'bg-emerald-600 animate-pulse'}`} />
                <span>{isStreaming ? 'Đang nghĩ...' : 'Sẵn sàng'}</span>
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="p-2.5 bg-amber-100/60 border-b-2 border-retro-border flex items-center gap-1.5 overflow-x-auto text-[11px] font-extrabold no-scrollbar">
              <button
                onClick={() => handleSendMessage('Tôi đang bị bí ý tưởng ở phần Body, hãy gợi ý cho tôi 2 hướng triển khai ý chặt chẽ theo đề này.')}
                className="whitespace-nowrap px-3 py-1 rounded-xl bg-white border-2 border-retro-border shadow-neo-sm hover:bg-amber-200 text-slate-950 active:translate-y-0.5 transition-all font-black"
              >
                💡 Bí ý tưởng Body
              </button>
              <button
                onClick={() => handleSendMessage('Cho tôi 3-4 collocations và cấu trúc câu đắt giá dùng cho chủ đề này.')}
                className="whitespace-nowrap px-3 py-1 rounded-xl bg-white border-2 border-retro-border shadow-neo-sm hover:bg-amber-200 text-slate-950 active:translate-y-0.5 transition-all font-black"
              >
                🏗️ Collocations C1/C2
              </button>
              <button
                onClick={() => handleSendMessage('Kiểm tra những câu tôi vừa viết trong bài xem có lỗi ngữ pháp hoặc diễn đạt chưa tự nhiên không.')}
                className="whitespace-nowrap px-3 py-1 rounded-xl bg-white border-2 border-retro-border shadow-neo-sm hover:bg-amber-200 text-slate-950 active:translate-y-0.5 transition-all font-black"
              >
                🔍 Soi lỗi câu
              </button>
            </div>

            {/* Proactive Personalization Banner from Error Memory */}
            {frequentErrors.length > 0 && (
              <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-amber-100 border-2 border-retro-border text-[11px] text-amber-950 flex items-start gap-2 shadow-neo-sm">
                <span className="text-sm leading-none mt-0.5">📌</span>
                <div>
                  <span className="font-extrabold text-amber-950">Gia sư nhắc nhở:</span> Ở các bài trước, bạn hay mắc lỗi{' '}
                  <span className="font-black underline text-amber-900">
                    {frequentErrors.map((e) => `${e.type} (${e.count} lần)`).join(', ')}
                  </span>
                  . Chú ý các điểm này nhé!
                </div>
              </div>
            )}

            {/* Chat Messages Log */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs leading-relaxed bg-[#FBF9F5]"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 px-4 text-zinc-500">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 border-2 border-retro-border shadow-neo-sm flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="font-black text-slate-900 text-sm">Chào bạn! Mình là AI IELTS Tutor.</p>
                  <p className="mt-1 text-xs text-slate-600 max-w-xs mx-auto">
                    Trong khi viết, nếu bí từ, cần mở rộng ý hoặc thắc mắc ngữ pháp, hãy gõ câu hỏi hoặc bấm nút 🎙️ Mic để nói chuyện với mình nhé!
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Selected context banner if exists */}
                  {msg.selectedText && (
                    <div className="mb-1 text-[10px] text-slate-700 italic max-w-[85%] truncate bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-bold">
                      Đoạn chọn: "{msg.selectedText}"
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl border-2 border-retro-border shadow-neo-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white font-medium'
                        : 'bg-white text-slate-900 font-medium'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {/* Streaming token display */}
              {isStreaming && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[88%] p-3.5 rounded-2xl border-2 border-retro-border shadow-neo-sm bg-white text-slate-800">
                    <div className="whitespace-pre-wrap">{streamingText}</div>
                    <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Chat Input with Microphone (Web Speech API) */}
            <div className="p-3 bg-white border-t-2 border-retro-border">
              {isRecording && (
                <div className="mb-2 flex items-center justify-between px-3 py-1.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-700 font-bold">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-1 bg-rose-500 rounded animate-wave-1" />
                      <span className="w-1 bg-rose-500 rounded animate-wave-2" />
                      <span className="w-1 bg-rose-500 rounded animate-wave-3" />
                      <span className="w-1 bg-rose-500 rounded animate-wave-4" />
                    </div>
                    <span>Đang nghe bạn nói... (Nói tiếng Việt hoặc tiếng Anh)</span>
                  </div>
                  <button
                    onClick={toggleRecording}
                    className="text-rose-800 underline text-[11px] font-black"
                  >
                    Dừng
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Voice button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2.5 rounded-xl border-2 border-retro-border transition-all ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-mic-pulse'
                      : 'bg-white text-slate-800 hover:bg-slate-100 shadow-neo-sm active:translate-y-0.5'
                  }`}
                  title="Nói chuyện trực tiếp với AI Tutor (Microphone Voice Input)"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Hỏi AI gia sư điều bạn đang thắc mắc..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border-2 border-retro-border bg-[#FBF9F5] outline-none focus:border-amber-500 font-medium"
                />

                {/* Send button - Vibrant Amber-Orange */}
                <button
                  type="button"
                  disabled={!inputMessage.trim() || isStreaming}
                  onClick={() => handleSendMessage()}
                  className="btn-neo p-2.5 text-xs flex items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 border-2 border-retro-border shadow-neo-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluating Loading Overlay */}
      {isEvaluating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory card-neo max-w-sm w-full p-6 text-center space-y-4 animate-pop-in">
            <div className="w-16 h-16 rounded-2xl bg-retro-amber border-2 border-retro-border shadow-neo flex items-center justify-center text-3xl mx-auto animate-bounce">
              🤖
            </div>
            <div>
              <h3 className="font-black text-lg text-zinc-900 mb-1">
                AI Examiner Đang Chấm Điểm
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Đang đánh giá 4 tiêu chí chuẩn IELTS, phân tích chiều sâu luận điểm và tạo bản viết nâng cấp theo Aim Band...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-black text-[#285737]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Vui lòng đợi giây lát...</span>
            </div>
          </div>
        </div>
      )}

      {/* Save to Notebook Modal */}
      <SaveNotebookModal
        initialText={textToSave}
        essayId={essay.id}
        isOpen={notebookModalOpen}
        onClose={() => setNotebookModalOpen(false)}
        onSaved={onRefreshNotebookCount}
      />
    </div>
  );
};
