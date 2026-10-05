export type SupportedLanguageId = 'es' | 'ja' | 'fr' | 'de';

export interface LanguageInfo {
  id: SupportedLanguageId;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
  description: string;
}

export interface LetterItem {
  id: string;
  char: string;
  romajiOrPhonetic: string;
  name: string;
  category: string;
  exampleWord: string;
  exampleTranslation: string;
  tip?: string;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  category: 'greetings' | 'numbers' | 'food' | 'travel' | 'daily' | 'family';
  exampleSentence: string;
  sentenceTranslation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type QuizQuestionType = 
  | 'speech' 
  | 'multiple_choice' 
  | 'listening' 
  | 'sentence_scramble' 
  | 'char_match';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  targetWord?: string;
  targetSentence?: string;
  audioText?: string;
  options?: string[];
  correctAnswer: string;
  scrambleWords?: string[];
  explanation?: string;
  hint?: string;
}

export interface GameStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  theme: string;
  xpReward: number;
  gemsReward: number;
  isBossStage?: boolean;
  questions: QuizQuestion[];
}

export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Ruby' | 'Diamond';

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  country: string;
  isCurrentUser?: boolean;
  badge?: string;
}

export interface UserProgress {
  currentLanguage: SupportedLanguageId;
  totalXp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakFreezes: number;
  hearts: number;
  maxHearts: number;
  gems: number;
  dailyGoalXp: number;
  todayEarnedXp: number;
  completedStages: Record<string, boolean>;
  stageStars: Record<string, number>;
  masteredVocab: string[];
  masteredLetters: string[];
  activeLeague: LeagueTier;
  soundEnabled: boolean;
}
