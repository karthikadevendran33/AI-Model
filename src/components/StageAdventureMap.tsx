import React from 'react';
import { Trophy, Star, Lock, Play, CheckCircle2, ShieldAlert, Sparkles, Compass } from 'lucide-react';
import { GameStage, UserProgress } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { sounds } from '../utils/audio';

interface StageAdventureMapProps {
  stages: GameStage[];
  progress: UserProgress;
  onSelectStage: (stage: GameStage) => void;
  onOpenSpeechLab: () => void;
}

export const StageAdventureMap: React.FC<StageAdventureMapProps> = ({
  stages,
  progress,
  onSelectStage,
  onOpenSpeechLab,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];

  const totalStages = stages.length;
  const completedCount = stages.filter(s => progress.completedStages[s.id]).length;
  const progressPercent = Math.round((completedCount / (totalStages || 1)) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-md">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            src="/src/assets/images/lingua_hero_adventure_1791194821770.jpg"
            alt="Language Quest Adventure Map"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // Graceful CSS fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-emerald-300">
              <Compass className="w-4 h-4" />
              <span>Journey Track</span>
              <span aria-hidden="true">·</span>
              <span>{currentLang.nativeName} ({currentLang.name})</span>
              <span aria-hidden="true">·</span>
              <span>{totalStages} Milestone Stages</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              {currentLang.name} Quest Map
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Progress through game stages, test your voice pronunciation, conquer listening trials, and unlock the Citadel of Fluency.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => {
                  sounds.playPop();
                  const nextStage = stages.find(s => !progress.completedStages[s.id]) || stages[0];
                  onSelectStage(nextStage);
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Continue Quest</span>
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  onOpenSpeechLab();
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-98 text-white font-semibold text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Voice Practice Lab</span>
              </button>
            </div>
          </div>

          {/* Progress Card Box */}
          <div className="w-full md:w-64 bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span>Overall Quest Progress</span>
              <span className="text-emerald-400 font-mono tabular-nums">{progressPercent}%</span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <span>Completed</span>
              <span className="font-mono text-white tabular-nums">{completedCount} / {totalStages} Stages</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Quest XP</span>
              <span className="font-mono text-amber-400 font-bold tabular-nums">+{progress.totalXp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Adventure Trail */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center space-y-1 mb-8">
          <h2 className="text-xl font-bold text-slate-900 font-display">Adventure Road</h2>
          <p className="text-xs text-slate-500">Each node unlocks the next challenge. Score 3 stars for flawless speech & syntax!</p>
        </div>

        <div className="relative">
          {/* Connector Line behind nodes */}
          <div className="absolute left-1/2 top-10 bottom-10 -translate-x-1/2 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-400 to-slate-300 rounded-full z-0 hidden sm:block" />

          {/* Stages List */}
          <div className="space-y-8 relative z-10">
            {stages.map((stage, idx) => {
              const isCompleted = Boolean(progress.completedStages[stage.id]);
              // Stage 1 is unlocked by default; others unlocked if previous is completed
              const isUnlocked = idx === 0 || Boolean(progress.completedStages[stages[idx - 1].id]);
              const stars = progress.stageStars[stage.id] || 0;
              const isBoss = stage.isBossStage;

              // Alternate zigzag offset on desktop
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center ${
                    isEven ? 'sm:justify-start' : 'sm:justify-end'
                  } justify-center`}
                >
                  <div
                    onClick={() => {
                      if (isUnlocked) {
                        sounds.playPop();
                        onSelectStage(stage);
                      }
                    }}
                    className={`w-full sm:w-[380px] p-5 rounded-2xl border transition-all relative cursor-pointer ${
                      isUnlocked
                        ? isBoss
                          ? 'bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-white border-amber-300 hover:border-amber-400 hover:shadow-lg'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                        : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Node Icon Avatar */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-sm transition-transform ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isUnlocked
                            ? isBoss
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-7 h-7" />
                        ) : isUnlocked ? (
                          isBoss ? (
                            <Trophy className="w-7 h-7 text-amber-100" />
                          ) : (
                            <span className="font-mono">{stage.stageNumber}</span>
                          )
                        ) : (
                          <Lock className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            {isBoss ? 'Final Boss Trial' : `Stage ${stage.stageNumber}`}
                          </span>
                          
                          {/* Stars */}
                          {isUnlocked && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3].map((starNum) => (
                                <Star
                                  key={starNum}
                                  className={`w-3.5 h-3.5 ${
                                    starNum <= stars
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 truncate mt-0.5 font-display">
                          {stage.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                          {stage.subtitle}
                        </p>

                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-100 text-xs">
                          <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                            +{stage.xpReward} XP
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-semibold text-cyan-700 font-mono tabular-nums">
                            +{stage.gemsReward} Gems
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500">
                            {stage.questions.length} Challenges
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Unlocked Play Prompt */}
                    {isUnlocked && (
                      <div className="mt-3 pt-2 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                        <span>{isCompleted ? 'Replay for practice' : 'Start Stage Quest'}</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Motivational Owl Coach Dialogue Banner */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-emerald-300 bg-white">
            <img
              src="/src/assets/images/lingua_mascot_owl_1791194838891.jpg"
              alt="Professor Hoot"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <h4 className="text-sm font-bold text-emerald-950 font-display">Professor Hoot’s Wisdom</h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              &ldquo;Consistent daily speaking practice activates neuro-vocal pathways twice as fast as silent reading. Try the Speech Lab to perfect your accent with instant feedback!&rdquo;
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onOpenSpeechLab();
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            Launch Speech Lab
          </button>
        </div>
      </div>
    </div>
  );
};
