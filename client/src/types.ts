export interface TopicPrompt {
  id: string;
  taskType: 'TASK_1' | 'TASK_2';
  title: string;
  questionText: string;
  imageUrl?: string;
  chartDataJson?: string;
  category: string;
  createdAt: string;
  _count?: { essays: number };
}

export interface Essay {
  id: string;
  promptId: string;
  prompt: TopicPrompt;
  aimBand: number;
  title?: string;
  content: string;
  wordCount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED';
  timeSpentSeconds?: number;
  createdAt: string;
  updatedAt: string;
  chatMessages?: TutorMessage[];
  evaluations?: any[];
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  inputMethod: 'TEXT' | 'VOICE';
  mode?: string;
  selectedText?: string;
  content: string;
  createdAt: string;
}

export interface NotebookItem {
  id: string;
  essayId?: string;
  type: 'COLLOCATION' | 'VOCABULARY' | 'SENTENCE_STRUCTURE' | 'REFINED_PHRASE';
  originalText: string;
  meaningVi?: string;
  contextExample?: string;
  tags?: string;
  reviewCount?: number;
  masteryLevel?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  createdAt: string;
}

