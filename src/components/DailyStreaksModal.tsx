import React from 'react';
import { X, Flame, Shield, Heart, Zap, Sparkles, Check, Gem } from 'lucide-react';
import { UserProgress } from '../types';
import { sounds } from '../utils/audio';

interface DailyStreaksModalProps {
  progress: UserProgress;
  onClose: () => void;
  onBuyItem: (type: 'freeze' | 'hearts' | 'boost', cost: number) => void;
}

export const DailyStreaksModal: React.FC<DailyStreaksModalProps> = ({
  progress,
  onClose,
  onBuyItem,
}) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Current day of week index (Monday = 0, Sunday = 6)
  const todayIndex = (new Date().getDay() + 6) % 7;

  const dailyProgressPercent = Math.min(100, Math.round((progress.todayEarnedXp / (progress.dailyGoalXp || 1)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn space-y-6 p-6 sm:p-8 relative">
        <button
          onClick={() => { sounds.playPop(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Animated Streak Flame */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-lg animate-float">
              <Flame className="w-14 h-14 fill-white animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
              {progress.streakDays}d
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              {progress.streakDays} Day Streak!
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Practice every day to keep your flame blazing and climb the weekly leaderboards.
            </p>
          </div>
        </div>

        {/* 7-Day Calendar Strip */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>This Week’s Consistency</span>
            <span className="text-amber-600 font-bold">{progress.streakDays} days active</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {daysOfWeek.map((day, idx) => {
              const isPastOrToday = idx <= todayIndex;
              const isToday = idx === todayIndex;

              return (
                <div
                  key={day}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                    isToday
                      ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/40'
                      : isPastOrToday
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-100 bg-white opacity-40'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{day}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isPastOrToday
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isPastOrToday ? (
                      <Flame className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <span className="text-[10px]">•</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Goal Meter */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Daily Practice Goal:</span>
            <span className="font-mono text-emerald-700 font-bold tabular-nums">
              {progress.todayEarnedXp} / {progress.dailyGoalXp} XP
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            {dailyProgressPercent >= 100
              ? '🎉 Daily goal met! Your streak is safely locked for today.'
              : `Earn ${Math.max(0, progress.dailyGoalXp - progress.todayEarnedXp)} more XP to secure today’s streak.`}
          </p>
        </div>

        {/* Powerups & Streak Protection Shop */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Streak Powerups & Shop
            </h4>
            <div className="flex items-center gap-1 text-xs font-bold text-cyan-700 font-mono">
              <Gem className="w-3.5 h-3.5 text-cyan-500 fill-cyan-400" />
              <span>{progress.gems} Gems Available</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Streak Freeze */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Streak Freeze</div>
                  <div className="text-[11px] text-slate-500">Protects streak if you miss a day</div>
                </div>
              </div>
              <button
                disabled={progress.gems < 50}
                onClick={() => onBuyItem('freeze', 50)}
                className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Equip for 50</span>
                <Gem className="w-3 h-3 fill-current" />
              </button>
            </div>

            {/* Heart Refill */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Refill All Hearts</div>
                  <div className="text-[11px] text-slate-500">Restore full 5 quiz hearts</div>
                </div>
              </div>
              <button
                disabled={progress.gems < 30 || progress.hearts >= progress.maxHearts}
                onClick={() => onBuyItem('hearts', 30)}
                className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Refill for 30</span>
                <Gem className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
