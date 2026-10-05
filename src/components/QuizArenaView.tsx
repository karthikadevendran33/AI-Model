import React from 'react';
import { Mic, Volume2, Sparkles, Brain, Award, Play, Flame } from 'lucide-react';
import { SupportedLanguageId, UserProgress, QuizQuestion } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageData } from '../data/languages';
import { sounds } from '../utils/audio';

interface QuizArenaViewProps {
  progress: UserProgress;
  onStartCustomQuiz: (title: string, subtitle: string, questions: QuizQuestion[], xp: number, gems: number) => void;
  onOpenSpeechLab: () => void;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  progress,
  onStartCustomQuiz,
  onOpenSpeechLab,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];
  const langData = getLanguageData(progress.currentLanguage);

  // Generate Rapid Voice Quiz
  const handleLaunchVoiceQuiz = () => {
    sounds.playPop();
    const voiceQuestions: QuizQuestion[] = langData.vocab.slice(0, 5).map((v, idx) => ({
      id: `voice-q-${idx}`,
      type: 'speech',
      prompt: `Pronounce "${v.word}" clearly into your microphone:`,
      targetWord: v.word,
      correctAnswer: v.word,
      hint: `${v.phonetic} - meaning: ${v.translation}`,
      explanation: `Great voice accuracy on ${v.word}!`,
    }));

    onStartCustomQuiz(
      'Rapid Voice Challenge',
      'Test your pronunciation accuracy in real time',
      voiceQuestions,
      60,
      25
    );
  };

  // Generate Listening Sprint Quiz
  const handleLaunchListeningQuiz = () => {
    sounds.playPop();
    const listeningQuestions: QuizQuestion[] = langData.vocab.slice(0, 5).map((v, idx) => {
      // Pick 3 distractors
      const distractors = langData.vocab
        .filter(item => item.id !== v.id)
        .slice(0, 3)
        .map(item => item.translation);
      
      const options = [v.translation, ...distractors].sort(() => Math.random() - 0.5);

      return {
        id: `listen-q-${idx}`,
        type: 'listening',
        prompt: 'Listen closely and select the correct translation:',
        audioText: v.word,
        options,
        correctAnswer: v.translation,
        explanation: `"${v.word}" translates to "${v.translation}".`,
      };
    });

    onStartCustomQuiz(
      'Audio Listening Sprint',
      'Train your ear to recognize native accents',
      listeningQuestions,
      50,
      20
    );
  };

  // Generate Mixed Vocab Scramble & Multiple Choice Quiz
  const handleLaunchMixedQuiz = () => {
    sounds.playPop();
    // Gather all questions from all stages
    const allStageQuestions = langData.stages.flatMap(s => s.questions);
    const selected = [...allStageQuestions].sort(() => Math.random() - 0.5).slice(0, 5);

    onStartCustomQuiz(
      'Mastery Arena Challenge',
      'Mixed grammar, voice, and syntax trial',
      selected.length > 0 ? selected : allStageQuestions.slice(0, 5),
      75,
      30
    );
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl border border-emerald-800 p-6 sm:p-8 text-white space-y-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Quiz Arena</span>
          <span aria-hidden="true">·</span>
          <span>{currentLang.name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
          Skill Drills & Rapid Tests
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
          Sharpen your foreign language recall with dedicated drills: voice tests, listening comprehension, and sentence assembly.
        </p>
      </div>

      {/* Quiz Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Mode 1: Rapid Voice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900">
              Rapid Voice Challenge
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              5 rapid-fire speech recognition prompts. Speak the target phrases into your mic to score native accuracy.
            </p>
            <div className="text-xs font-mono font-semibold text-emerald-700">
              +60 XP · +25 Gems
            </div>
          </div>

          <button
            onClick={handleLaunchVoiceQuiz}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Voice Sprint</span>
          </button>
        </div>

        {/* Mode 2: Listening Sprint */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900">
              Listening Comprehension
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Train your ear with authentic accents. Listen to spoken audio and match the intended meaning under time pressure.
            </p>
            <div className="text-xs font-mono font-semibold text-emerald-700">
              +50 XP · +20 Gems
            </div>
          </div>

          <button
            onClick={handleLaunchListeningQuiz}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Listening Test</span>
          </button>
        </div>

        {/* Mode 3: Mixed Arena Review */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-slate-900">
              Mixed Arena Gauntlet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full review combining sentence scramble, multiple choice questions, listening, and speaking.
            </p>
            <div className="text-xs font-mono font-semibold text-emerald-700">
              +75 XP · +30 Gems
            </div>
          </div>

          <button
            onClick={handleLaunchMixedQuiz}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Enter Gauntlet</span>
          </button>
        </div>

      </div>

      {/* Quick Launch Speech Lab CTA */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold font-display">Need Freeform Voice Practice?</h4>
          <p className="text-xs text-slate-300">
            Open the Speech Lab to test any custom phrase or drill through our pronunciation library with instant accuracy scores.
          </p>
        </div>
        <button
          onClick={() => {
            sounds.playPop();
            onOpenSpeechLab();
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0"
        >
          Open Speech Lab
        </button>
      </div>
    </div>
  );
};
