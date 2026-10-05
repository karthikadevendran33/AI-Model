import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { StageAdventureMap } from './components/StageAdventureMap';
import { SpeechRecognitionLab } from './components/SpeechRecognitionLab';
import { AlphabetModule } from './components/AlphabetModule';
import { VocabularyModule } from './components/VocabularyModule';
import { QuizArenaView } from './components/QuizArenaView';
import { LeaderboardView } from './components/LeaderboardView';
import { QuizRunnerModal } from './components/QuizRunnerModal';
import { DailyStreaksModal } from './components/DailyStreaksModal';
import { SupportedLanguageId, UserProgress, GameStage, QuizQuestion } from './types';
import { getLanguageData } from './data/languages';
import { sounds } from './utils/audio';

const STORAGE_KEY = 'linguaquest_user_progress_v2';

const INITIAL_PROGRESS: UserProgress = {
  currentLanguage: 'es',
  totalXp: 380,
  streakDays: 7,
  lastActiveDate: new Date().toISOString().split('T')[0],
  streakFreezes: 1,
  hearts: 5,
  maxHearts: 5,
  gems: 160,
  dailyGoalXp: 50,
  todayEarnedXp: 20,
  completedStages: { 'es-stage-1': true },
  stageStars: { 'es-stage-1': 3 },
  masteredVocab: ['es-v1', 'es-v2'],
  masteredLetters: ['es-a', 'es-e', 'es-i'],
  activeLeague: 'Bronze',
  soundEnabled: true,
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_PROGRESS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROGRESS;
  });

  const [currentTab, setCurrentTab] = useState<string>('stages');
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  // Active quiz runner state
  const [activeQuizState, setActiveQuizState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    stageId?: string;
    questions: QuizQuestion[];
    xpReward: number;
    gemsReward: number;
  } | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // safe
    }
  }, [progress]);

  // Sync sound engine
  useEffect(() => {
    sounds.enabled = progress.soundEnabled;
  }, [progress.soundEnabled]);

  const langData = getLanguageData(progress.currentLanguage);

  const handleToggleSound = () => {
    const nextState = !progress.soundEnabled;
    setProgress(prev => ({ ...prev, soundEnabled: nextState }));
    sounds.enabled = nextState;
    if (nextState) sounds.playPop();
  };

  const handleChangeLanguage = (newLang: SupportedLanguageId) => {
    setProgress(prev => ({
      ...prev,
      currentLanguage: newLang,
    }));
  };

  const handleAddXp = (amount: number) => {
    setProgress(prev => ({
      ...prev,
      totalXp: prev.totalXp + amount,
      todayEarnedXp: prev.todayEarnedXp + amount,
    }));
  };

  const handleToggleMasterLetter = (letterId: string) => {
    setProgress(prev => {
      const exists = prev.masteredLetters.includes(letterId);
      const updated = exists
        ? prev.masteredLetters.filter(id => id !== letterId)
        : [...prev.masteredLetters, letterId];
      return { ...prev, masteredLetters: updated };
    });
  };

  const handleToggleMasterVocab = (vocabId: string) => {
    setProgress(prev => {
      const exists = prev.masteredVocab.includes(vocabId);
      const updated = exists
        ? prev.masteredVocab.filter(id => id !== vocabId)
        : [...prev.masteredVocab, vocabId];
      return { ...prev, masteredVocab: updated };
    });
  };

  const handleSelectStage = (stage: GameStage) => {
    sounds.playPop();
    setActiveQuizState({
      isOpen: true,
      title: `${stage.stageNumber ? `Stage ${stage.stageNumber}: ` : ''}${stage.title}`,
      subtitle: stage.subtitle,
      stageId: stage.id,
      questions: stage.questions,
      xpReward: stage.xpReward,
      gemsReward: stage.gemsReward,
    });
  };

  const handleStartCustomQuiz = (
    title: string,
    subtitle: string,
    questions: QuizQuestion[],
    xpReward: number,
    gemsReward: number
  ) => {
    sounds.playPop();
    setActiveQuizState({
      isOpen: true,
      title,
      subtitle,
      questions,
      xpReward,
      gemsReward,
    });
  };

  const handleCompleteQuiz = ({
    stageId,
    earnedXp,
    earnedGems,
    stars,
  }: {
    stageId?: string;
    earnedXp: number;
    earnedGems: number;
    stars: number;
  }) => {
    setProgress(prev => {
      const completed = { ...prev.completedStages };
      const currentStars = { ...prev.stageStars };

      if (stageId) {
        completed[stageId] = true;
        currentStars[stageId] = Math.max(currentStars[stageId] || 0, stars);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const isNewDay = prev.lastActiveDate !== todayStr;
      const nextStreak = isNewDay ? prev.streakDays + 1 : prev.streakDays;

      return {
        ...prev,
        totalXp: prev.totalXp + earnedXp,
        todayEarnedXp: prev.todayEarnedXp + earnedXp,
        gems: prev.gems + earnedGems,
        completedStages: completed,
        stageStars: currentStars,
        streakDays: nextStreak,
        lastActiveDate: todayStr,
      };
    });
  };

  const handleDeductHeart = () => {
    setProgress(prev => ({
      ...prev,
      hearts: Math.max(0, prev.hearts - 1),
    }));
  };

  const handleBuyShopItem = (type: 'freeze' | 'hearts' | 'boost', cost: number) => {
    if (progress.gems < cost) return;

    sounds.playPop();
    setProgress(prev => {
      const updatedGems = prev.gems - cost;
      if (type === 'freeze') {
        return {
          ...prev,
          gems: updatedGems,
          streakFreezes: prev.streakFreezes + 1,
        };
      } else if (type === 'hearts') {
        return {
          ...prev,
          gems: updatedGems,
          hearts: prev.maxHearts,
        };
      }
      return { ...prev, gems: updatedGems };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Contract (3 zones) */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        progress={progress}
        onToggleSound={handleToggleSound}
        onChangeLanguage={handleChangeLanguage}
        onOpenStreakModal={() => setIsStreakModalOpen(true)}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'stages' && (
          <StageAdventureMap
            stages={langData.stages}
            progress={progress}
            onSelectStage={handleSelectStage}
            onOpenSpeechLab={() => setCurrentTab('speech')}
          />
        )}

        {currentTab === 'speech' && (
          <SpeechRecognitionLab
            progress={progress}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'letters' && (
          <AlphabetModule
            progress={progress}
            onToggleMasterLetter={handleToggleMasterLetter}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'vocab' && (
          <VocabularyModule
            progress={progress}
            onToggleMasterVocab={handleToggleMasterVocab}
            onAddXp={handleAddXp}
            onOpenSpeechLab={() => setCurrentTab('speech')}
          />
        )}

        {currentTab === 'quiz' && (
          <QuizArenaView
            progress={progress}
            onStartCustomQuiz={handleStartCustomQuiz}
            onOpenSpeechLab={() => setCurrentTab('speech')}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            progress={progress}
            onOpenQuickQuiz={() => setCurrentTab('quiz')}
          />
        )}
      </main>

      {/* Active Quiz Runner Modal */}
      {activeQuizState?.isOpen && (
        <QuizRunnerModal
          title={activeQuizState.title}
          subtitle={activeQuizState.subtitle}
          stageId={activeQuizState.stageId}
          questions={activeQuizState.questions}
          xpReward={activeQuizState.xpReward}
          gemsReward={activeQuizState.gemsReward}
          progress={progress}
          onClose={() => setActiveQuizState(null)}
          onComplete={handleCompleteQuiz}
          onDeductHeart={handleDeductHeart}
        />
      )}

      {/* Daily Streaks & Powerups Shop Modal */}
      {isStreakModalOpen && (
        <DailyStreaksModal
          progress={progress}
          onClose={() => setIsStreakModalOpen(false)}
          onBuyItem={handleBuyShopItem}
        />
      )}

      {/* Subtle, Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">LinguaQuest</span>
            <span aria-hidden="true">·</span>
            <span>Interactive Foreign Language Mastery</span>
            <span aria-hidden="true">·</span>
            <span>Web Speech API Speech Recognition</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => { sounds.playPop(); setIsStreakModalOpen(true); }}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Streak Protection
            </button>
            <button
              onClick={() => { sounds.playPop(); setCurrentTab('speech'); }}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Speech Lab
            </button>
            <button
              onClick={() => { sounds.playPop(); setCurrentTab('leaderboard'); }}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Weekly Leagues
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
