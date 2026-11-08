import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PromptBank } from './components/PromptBank';
import { WritingWorkspace } from './components/WritingWorkspace';
import { EvaluationResult } from './components/EvaluationResult';
import { NotebookView } from './components/NotebookView';
import { ErrorDashboard } from './components/ErrorDashboard';
import { SaveNotebookModal } from './components/SaveNotebookModal';
import { FlashcardModal } from './components/FlashcardModal';
import { HistoryAnalyticsView } from './components/HistoryAnalyticsView';
import { TopicPrompt, Essay } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<'prompts' | 'workspace' | 'errors' | 'notebook' | 'analytics'>('prompts');
  const [prompts, setPrompts] = useState<TopicPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [activeEssay, setActiveEssay] = useState<Essay | null>(null);
  const [activeEvaluation, setActiveEvaluation] = useState<any | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; activeModel: string }>({
    online: false,
    activeModel: 'qwen2.5:7b',
  });

  // Global Notebook Modal state
  const [notebookModalOpen, setNotebookModalOpen] = useState(false);
  const [notebookInitialText, setNotebookInitialText] = useState('');
  const [notebookInitialMeaning, setNotebookInitialMeaning] = useState('');

  // Flashcard Modal state
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [flashcardTopicTitle, setFlashcardTopicTitle] = useState<string | undefined>(undefined);

  // Check Ollama health
  const checkOllamaHealth = async () => {
    try {
      const res = await fetch('/api/ollama/health');
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus({
          online: data.online,
          activeModel: data.activeModel || 'qwen2.5:7b',
        });
      }
    } catch {
      setOllamaStatus({ online: false, activeModel: 'qwen2.5:7b' });
    }
  };

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const res = await fetch('/api/prompts');
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (err) {
      console.error('Fetch prompts error:', err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    checkOllamaHealth();
    fetchPrompts();
  }, []);

  // Handle select prompt to write
  const handleSelectPrompt = async (promptId: string, aimBand = 7.0) => {
    try {
      const res = await fetch('/api/essays/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, aimBand }),
      });

      if (res.ok) {
        const essayData = await res.json();
        setActiveEssay(essayData);
        setActiveEvaluation(null);
        setCurrentTab('workspace');
      }
    } catch (err) {
      console.error('Failed to start essay:', err);
    }
  };

  const handleOpenNotebookModal = (text: string, meaning?: string) => {
    setNotebookInitialText(text);
    setNotebookInitialMeaning(meaning || '');
    setNotebookModalOpen(true);
  };

  const handleOpenFlashcards = (topicTitle?: string) => {
    setFlashcardTopicTitle(topicTitle);
    setFlashcardModalOpen(true);
  };

  const handleOpenEvaluationFromHistory = (essay: any, evaluation: any) => {
    setActiveEssay(essay);
    setActiveEvaluation(evaluation);
    setCurrentTab('workspace');
  };

  const handleOpenDraftFromHistory = (essay: any) => {
    setActiveEssay(essay);
    setActiveEvaluation(null);
    setCurrentTab('workspace');
  };

  const handleCloseActiveEssay = () => {
    setActiveEssay(null);
    setActiveEvaluation(null);
    setCurrentTab('prompts');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setActiveEvaluation(null);
          setCurrentTab(tab);
        }}
        ollamaStatus={ollamaStatus}
        hasActiveEssay={!!activeEssay}
        onOpenFlashcards={() => handleOpenFlashcards()}
        onCloseActiveEssay={handleCloseActiveEssay}
      />

      <main className="flex-1">
        {currentTab === 'prompts' && (
          <PromptBank
            prompts={prompts}
            loading={loadingPrompts}
            onSelectPrompt={handleSelectPrompt}
            onRefresh={fetchPrompts}
            onOpenFlashcards={handleOpenFlashcards}
          />
        )}

        {currentTab === 'workspace' && activeEssay && (
          activeEvaluation ? (
            <EvaluationResult
              essay={activeEssay}
              evaluation={activeEvaluation}
              onBackToEditor={() => setActiveEvaluation(null)}
              onOpenNotebookModal={handleOpenNotebookModal}
              onCloseToPrompts={handleCloseActiveEssay}
            />
          ) : (
            <WritingWorkspace
              essay={activeEssay}
              onUpdateEssay={setActiveEssay}
              onRefreshNotebookCount={() => {}}
              onShowEvaluation={(evalData) => setActiveEvaluation(evalData)}
              onCloseEssay={handleCloseActiveEssay}
            />
          )
        )}

        {currentTab === 'errors' && (
          <ErrorDashboard onOpenNotebookModal={handleOpenNotebookModal} />
        )}

        {currentTab === 'notebook' && (
          <NotebookView onOpenFlashcards={() => handleOpenFlashcards()} />
        )}

        {currentTab === 'analytics' && (
          <HistoryAnalyticsView
            onOpenEvaluation={handleOpenEvaluationFromHistory}
            onOpenDraft={handleOpenDraftFromHistory}
            onRefreshEssays={fetchPrompts}
          />
        )}
      </main>

      {/* Global Flashcard Modal */}
      <FlashcardModal
        isOpen={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        topicTitle={flashcardTopicTitle}
      />

      {/* Global Notebook Modal */}
      <SaveNotebookModal
        initialText={notebookInitialText}
        initialMeaning={notebookInitialMeaning}
        essayId={activeEssay?.id}
        isOpen={notebookModalOpen}
        onClose={() => setNotebookModalOpen(false)}
        onSaved={() => {}}
      />
    </div>
  );
}

export default App;

