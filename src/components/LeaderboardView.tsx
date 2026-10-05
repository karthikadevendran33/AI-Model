import React, { useState } from 'react';
import { Trophy, Medal, Flame, Shield, ArrowUp, ArrowDown, Sparkles, Clock, Crown } from 'lucide-react';
import { LeagueTier, UserProgress, LeaderboardUser } from '../types';
import { LEADERBOARD_PRESETS } from '../data/languages';
import { sounds } from '../utils/audio';

interface LeaderboardViewProps {
  progress: UserProgress;
  onOpenQuickQuiz: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  progress,
  onOpenQuickQuiz,
}) => {
  const [selectedLeague, setSelectedLeague] = useState<LeagueTier>(progress.activeLeague || 'Bronze');

  const leagues: LeagueTier[] = ['Bronze', 'Silver', 'Gold', 'Diamond'];

  // Get raw preset users
  const rawUsers = LEADERBOARD_PRESETS[selectedLeague] || LEADERBOARD_PRESETS.Bronze;

  // Insert or update current user in list with live XP and rank
  const usersWithCurrent = rawUsers.map((u) => {
    if (u.isCurrentUser) {
      return {
        ...u,
        xp: Math.max(u.xp, progress.totalXp),
        streak: progress.streakDays,
      };
    }
    return u;
  });

  // Re-sort by XP descending
  const sortedUsers: LeaderboardUser[] = [...usersWithCurrent]
    .sort((a, b) => b.xp - a.xp)
    .map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));

  const currentUser = sortedUsers.find(u => u.isCurrentUser);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 text-white space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Trophy className="w-4 h-4" />
              <span>Weekly Competitive League</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5" /> 3d 14h left
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              {selectedLeague} Division League
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Compete weekly against fellow language learners. Top 3 gain promotion to the next tier!
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onOpenQuickQuiz();
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Earn XP to Rank Up</span>
          </button>
        </div>

        {/* League Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          {leagues.map((league) => {
            const isSelected = selectedLeague === league;
            return (
              <button
                key={league}
                onClick={() => {
                  sounds.playPop();
                  setSelectedLeague(league);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${
                  league === 'Diamond' ? 'text-cyan-400' : league === 'Gold' ? 'text-amber-400' : 'text-slate-400'
                }`} />
                <span>{league}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User's Standings Quick Card */}
      {currentUser && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center font-display shadow-xs">
              #{currentUser.rank}
            </div>
            <div>
              <div className="text-xs text-emerald-800 font-semibold">Your Current Standings</div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                {currentUser.name} {currentUser.country}
              </h3>
              <div className="text-xs text-emerald-700 font-mono font-bold">
                {currentUser.xp} XP · {currentUser.streak} Day Streak
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              currentUser.rank <= 3
                ? 'bg-emerald-200 text-emerald-950 font-bold'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {currentUser.rank <= 3 ? '▲ Promotion Zone' : '● Safe Zone'}
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 uppercase font-semibold tracking-wider">
          <div className="w-16">Rank</div>
          <div className="flex-1">Learner</div>
          <div className="w-24 text-right">Streak</div>
          <div className="w-28 text-right">Weekly XP</div>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedUsers.map((user) => {
            const isTop3 = user.rank <= 3;
            const isCurrent = user.isCurrentUser;

            return (
              <div
                key={user.id}
                className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600 font-semibold'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Rank Badge */}
                <div className="w-16 flex items-center gap-1.5">
                  {user.rank === 1 ? (
                    <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                  ) : user.rank === 2 ? (
                    <Medal className="w-5 h-5 text-slate-400 fill-slate-300" />
                  ) : user.rank === 3 ? (
                    <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />
                  ) : (
                    <span className="font-mono text-sm font-bold text-slate-500 tabular-nums">
                      #{user.rank}
                    </span>
                  )}
                  {isTop3 && (
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
                  )}
                </div>

                {/* Learner Info */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <span className="text-2xl select-none">{user.avatar}</span>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {user.name}
                      </span>
                      <span className="text-xs" title="Country">{user.country}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    {user.badge && (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {user.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Streak */}
                <div className="w-24 text-right flex items-center justify-end gap-1 text-xs text-amber-600 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="tabular-nums font-mono">{user.streak}d</span>
                </div>

                {/* Weekly XP */}
                <div className="w-28 text-right font-mono text-sm font-extrabold text-slate-900 tabular-nums">
                  {user.xp} <span className="text-xs font-normal text-slate-400">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
