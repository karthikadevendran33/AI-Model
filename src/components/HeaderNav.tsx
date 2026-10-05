import React from 'react';
import { Volume2, VolumeX, Flame, Gem, Heart, Globe2 } from 'lucide-react';
import { SupportedLanguageId, UserProgress } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { sounds } from '../utils/audio';

interface HeaderNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  progress: UserProgress;
  onToggleSound: () => void;
  onChangeLanguage: (lang: SupportedLanguageId) => void;
  onOpenStreakModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onTabChange,
  progress,
  onToggleSound,
  onChangeLanguage,
  onOpenStreakModal,
}) => {
  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];

  const navItems = [
    { id: 'stages', label: 'Quest Map' },
    { id: 'speech', label: 'Speech Lab' },
    { id: 'letters', label: 'Alphabet' },
    { id: 'vocab', label: 'Vocabulary' },
    { id: 'quiz', label: 'Quiz Arena' },
    { id: 'leaderboard', label: 'Leagues' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element wordmark */}
          <button 
            onClick={() => { sounds.playPop(); onTabChange('stages'); }}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-emerald-500 transition-colors">
              LQ
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                LinguaQuest
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Text with active underlines / tabs) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { sounds.playPop(); onTabChange(item.id); }}
                  className={`px-3 py-2 text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Stats HUD & Primary Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative group">
              <label htmlFor="language-select" className="sr-only">Select Learning Language</label>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm cursor-pointer">
                <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-base leading-none">{currentLangInfo.flag}</span>
                <span className="hidden sm:inline">{currentLangInfo.name}</span>
                <select
                  id="language-select"
                  aria-label="Select Learning Language"
                  value={progress.currentLanguage}
                  onChange={(e) => {
                    sounds.playPop();
                    onChangeLanguage(e.target.value as SupportedLanguageId);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Streak Counter Button */}
            <button
              onClick={() => { sounds.playPop(); onOpenStreakModal(); }}
              title="Daily Streak - Click for details"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="tabular-nums">{progress.streakDays}</span>
              <span className="hidden sm:inline">Days</span>
            </button>

            {/* Gems */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 text-xs font-bold">
              <Gem className="w-3.5 h-3.5 text-cyan-500 fill-cyan-400" />
              <span className="tabular-nums">{progress.gems}</span>
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="tabular-nums">{progress.hearts}</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              title={progress.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {progress.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { sounds.playPop(); onTabChange(item.id); }}
                className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap rounded-md transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
