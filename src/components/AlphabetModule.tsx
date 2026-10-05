import React, { useState } from 'react';
import { Volume2, CheckCircle2, Mic, Sparkles, BookOpen, Layers, X } from 'lucide-react';
import { LetterItem, UserProgress } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageData } from '../data/languages';
import { sounds, speakWord } from '../utils/audio';
import { calculateSimilarity, isSpeechRecognitionSupported, SpeechRecognizer } from '../utils/speechRecognition';

interface AlphabetModuleProps {
  progress: UserProgress;
  onToggleMasterLetter: (letterId: string) => void;
  onAddXp: (amount: number) => void;
}

export const AlphabetModule: React.FC<AlphabetModuleProps> = ({
  progress,
  onToggleMasterLetter,
  onAddXp,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];
  const langData = getLanguageData(progress.currentLanguage);
  const letters = langData.letters;

  // Categories
  const categories = Array.from(new Set(letters.map(l => l.category)));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);
  
  // Flashcard mode toggle
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Speech practice state inside letter detail modal
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechScore, setSpeechScore] = useState<number | null>(null);

  const filteredLetters = selectedCategory === 'All'
    ? letters
    : letters.filter(l => l.category === selectedCategory);

  const masteredCount = letters.filter(l => progress.masteredLetters.includes(l.id)).length;
  const progressPercent = Math.round((masteredCount / (letters.length || 1)) * 100);

  const handlePlayLetterAudio = async (text: string) => {
    sounds.playPop();
    await speakWord(text, currentLang.speechCode, 0.85);
  };

  const handleStartLetterSpeech = (letter: LetterItem) => {
    setTranscript('');
    setSpeechScore(null);
    if (!isSpeechRecognitionSupported()) {
      // Simulate
      const simText = letter.exampleWord;
      setTranscript(simText);
      const score = calculateSimilarity(letter.exampleWord, simText);
      setSpeechScore(score);
      sounds.playSuccess();
      onAddXp(10);
      return;
    }

    sounds.playMicStart();
    const recognizer = new SpeechRecognizer({
      lang: currentLang.speechCode,
      interimResults: true,
      onStart: () => setIsListening(true),
      onResult: ({ transcript: text, isFinal }) => {
        setTranscript(text);
        const score = calculateSimilarity(letter.exampleWord, text);
        setSpeechScore(score);
        if (isFinal) {
          setIsListening(false);
          if (score >= 70) {
            sounds.playSuccess();
            onAddXp(15);
          } else {
            sounds.playError();
          }
        }
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false),
    });
    recognizer.start();
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4">
      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <BookOpen className="w-4 h-4" />
              <span>Phonetics & Character Studio</span>
              <span aria-hidden="true">·</span>
              <span>{currentLang.nativeName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-1">
              Basic Letters & Pronunciation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Master the core phonetics, native accents, and characters of {currentLang.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playPop();
                setIsFlashcardMode(!isFlashcardMode);
                setFlashcardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isFlashcardMode
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isFlashcardMode ? 'Show Grid View' : 'Practice Flashcards'}</span>
            </button>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Alphabet Mastery:</span>
            <span className="font-mono text-emerald-700 font-bold tabular-nums">
              {masteredCount} / {letters.length} Characters Mastered ({progressPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-56 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        {!isFlashcardMode && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <button
              onClick={() => { sounds.playPop(); setSelectedCategory('All'); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({letters.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { sounds.playPop(); setSelectedCategory(cat); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View 1: Flashcard Study Mode */}
      {isFlashcardMode ? (
        <div className="max-w-md mx-auto space-y-6">
          {(() => {
            const card = letters[flashcardIndex];
            const isMastered = progress.masteredLetters.includes(card.id);

            return (
              <div className="space-y-4">
                <div
                  onClick={() => {
                    sounds.playPop();
                    setIsFlipped(!isFlipped);
                  }}
                  className="w-full h-80 bg-white rounded-2xl border-2 border-slate-200 shadow-md p-8 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:border-emerald-400 select-none"
                >
                  <div className="flex items-center justify-between w-full text-xs text-slate-400">
                    <span>Card {flashcardIndex + 1} of {letters.length}</span>
                    <span>Click card to flip ↺</span>
                  </div>

                  {!isFlipped ? (
                    <div className="space-y-3">
                      <div className="text-6xl sm:text-7xl font-bold font-display text-slate-900">
                        {card.char}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        {card.name} · {card.category}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="text-2xl font-bold text-emerald-700 font-mono">
                        {card.romajiOrPhonetic}
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        Example: {card.exampleWord}
                      </div>
                      <div className="text-xs text-slate-600">
                        &ldquo;{card.exampleTranslation}&rdquo;
                      </div>
                      {card.tip && (
                        <div className="text-xs text-slate-500 max-w-xs mx-auto italic pt-2">
                          Tip: {card.tip}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayLetterAudio(card.char)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear Sound</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        onToggleMasterLetter(card.id);
                        if (!isMastered) onAddXp(10);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                        isMastered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isMastered ? 'Mastered' : 'Mark Known'}</span>
                    </button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    disabled={flashcardIndex === 0}
                    onClick={() => {
                      sounds.playPop();
                      setFlashcardIndex(prev => Math.max(0, prev - 1));
                      setIsFlipped(false);
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={flashcardIndex === letters.length - 1}
                    onClick={() => {
                      sounds.playPop();
                      setFlashcardIndex(prev => Math.min(letters.length - 1, prev + 1));
                      setIsFlipped(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white disabled:opacity-40 cursor-pointer"
                  >
                    Next Letter
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* View 2: Character Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredLetters.map((letter) => {
            const isMastered = progress.masteredLetters.includes(letter.id);

            return (
              <div
                key={letter.id}
                onClick={() => {
                  sounds.playPop();
                  setSelectedLetter(letter);
                  setTranscript('');
                  setSpeechScore(null);
                }}
                className={`group bg-white rounded-2xl border p-4 text-center space-y-2 transition-all cursor-pointer relative hover:shadow-md hover:scale-[1.02] ${
                  isMastered
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Mastered Badge */}
                {isMastered && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  </div>
                )}

                <div className="text-3xl font-extrabold text-slate-900 font-display group-hover:text-emerald-700 transition-colors">
                  {letter.char}
                </div>

                <div className="text-xs font-mono font-semibold text-emerald-600">
                  {letter.romajiOrPhonetic}
                </div>

                <div className="text-[11px] text-slate-500 truncate">
                  {letter.exampleWord}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayLetterAudio(letter.char);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors"
                    title="Pronounce"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Letter Detail Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 relative animate-fadeIn">
            <button
              onClick={() => setSelectedLetter(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {selectedLetter.category}
              </span>
              <div className="text-6xl font-extrabold text-slate-900 font-display">
                {selectedLetter.char}
              </div>
              <div className="text-lg font-mono font-bold text-emerald-600">
                Sound: {selectedLetter.romajiOrPhonetic}
              </div>
            </div>

            {/* Pronunciation & Stroke Tips */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
              <div className="text-xs font-bold text-slate-700">Phonetic Guide & Usage:</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedLetter.tip || `In ${currentLang.name}, "${selectedLetter.char}" produces the distinct phonetic tone ${selectedLetter.romajiOrPhonetic}.`}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Example Word:</span>
                <span className="font-bold text-slate-900">
                  {selectedLetter.exampleWord} ({selectedLetter.exampleTranslation})
                </span>
              </div>
            </div>

            {/* Live Audio & Speech Recognition Practice */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-slate-800">Voice Practice with Microphone:</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlayLetterAudio(selectedLetter.exampleWord)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                  <span>Listen: {selectedLetter.exampleWord}</span>
                </button>

                <button
                  onClick={() => handleStartLetterSpeech(selectedLetter)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{isListening ? 'Listening...' : 'Speak Word'}</span>
                </button>
              </div>

              {/* Speech recognition result */}
              {transcript && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 font-semibold">Transcript: &ldquo;{transcript}&rdquo;</span>
                    {speechScore !== null && (
                      <span className="font-mono font-bold text-emerald-800">{speechScore}%</span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    {speechScore && speechScore >= 70 ? 'Great pronunciation! +15 XP earned' : 'Keep practicing!'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  sounds.playPop();
                  onToggleMasterLetter(selectedLetter.id);
                  if (!progress.masteredLetters.includes(selectedLetter.id)) {
                    onAddXp(10);
                  }
                  setSelectedLetter(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {progress.masteredLetters.includes(selectedLetter.id)
                    ? 'Unmark Character'
                    : 'Mark as Mastered (+10 XP)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
