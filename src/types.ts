export interface QuizQuestion {
  id: number;
  question: string;
  answer: string;
  options: string[];
  category: string;
  explanation: string;
  stage: number;
}

export interface ScoreSubmission {
  studentName: string;
  studentId: string;
  quizScore: number;
  gameScore: number;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  cleared: boolean;
  timeTaken: number;
  timestamp?: string;
  appsScriptUrl?: string;
}

export interface ScoreRecord extends ScoreSubmission {
  id: string;
  createdAt: string;
  syncedToGoogleSheet?: boolean;
}

export type GameState = 'START' | 'PLAYING' | 'QUIZ_PAUSED' | 'GAME_OVER' | 'VICTORY';
