import React, { useState } from 'react';
import { Volume2, CheckCircle2, Mic, Search, Layers, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { VocabItem, UserProgress } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageData } from '../data/languages';
import { sounds, speakWord } from '../utils/audio';
import { calculateSimilarity, isSpeechRecognitionSupported, SpeechRecognizer } from '../utils/speechRecognition';

interface VocabularyModuleProps {
  progress: UserProgress;
  onToggleMasterVocab: (vocabId: string) => void;
  onAddXp: (amount: number) => void;
  onOpenSpeechLab: () => void;
}

export const VocabularyModule: React.FC<VocabularyModuleProps> = ({
  progress,
  onToggleMasterVocab,
  onAddXp,
  onOpenSpeechLab,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];
  const langData = getLanguageData(progress.currentLanguage);
  const vocabList = langData.vocab;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Active micro-voice test on card
  const [activeVoiceVocabId, setActiveVoiceVocabId] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceScore, setVoiceScore] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'All Vocabulary' },
    { id: 'greetings', label: 'Greetings' },
    { id: 'food', label: 'Food & Dining' },
    { id: 'travel', label: 'Travel & Wayfinding' },
    { id: 'daily', label: 'Daily Life & Verbs' },
    { id: 'family', label: 'Family & Social' },
    { id: 'numbers', label: 'Numbers' },
  ];

  const filteredVocab = vocabList.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phonetic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const masteredCount = vocabList.filter(v => progress.masteredVocab.includes(v.id)).length;
  const progressPercent = Math.round((masteredCount / (vocabList.length || 1)) * 100);

  const handlePlayAudio = async (text: string) => {
    sounds.playPop();
    await speakWord(text, currentLang.speechCode, 0.85);
  };

  const handleStartCardVoice = (vocab: VocabItem) => {
    setActiveVoiceVocabId(vocab.id);
    setVoiceTranscript('');
    setVoiceScore(null);

    if (!isSpeechRecognitionSupported()) {
      // Simulate for sandbox testing
      setVoiceTranscript(vocab.word);
      const score = 100;
      setVoiceScore(score);
      sounds.playSuccess();
      onAddXp(15);
      return;
    }

    sounds.playMicStart();
    const recognizer = new SpeechRecognizer({
      lang: currentLang.speechCode,
      interimResults: true,
      onResult: ({ transcript: text, isFinal }) => {
        setVoiceTranscript(text);
        const score = calculateSimilarity(vocab.word, text);
        setVoiceScore(score);
        if (isFinal) {
          if (score >= 75) {
            sounds.playSuccess();
            onAddXp(15);
          } else {
            sounds.playError();
          }
        }
      },
      onError: () => setActiveVoiceVocabId(null),
      onEnd: () => {},
    });
    recognizer.start();
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Sparkles className="w-4 h-4" />
              <span>Vocabulary Vault</span>
              <span aria-hidden="true">·</span>
              <span>{currentLang.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-1">
              Interactive Vocabulary Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Learn high-frequency foreign phrases with natural speech synthesis, sentence context, and speech recognition drills.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playPop();
                setIsStudyMode(!isStudyMode);
                setStudyIndex(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isStudyMode
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isStudyMode ? 'Show Full List' : 'Flashcard Study Mode'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Mastery Progress:</span>
            <span className="font-mono text-emerald-700 font-bold tabular-nums">
              {masteredCount} / {vocabList.length} Words Mastered ({progressPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-60 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls: Search and Categories */}
        {!isStudyMode && (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words, English translation, or phonetics..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { sounds.playPop(); setSelectedCategory(cat.id); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Study Flashcard Mode */}
      {isStudyMode ? (
        <div className="max-w-md mx-auto space-y-6">
          {(() => {
            const card = filteredVocab[studyIndex] || vocabList[0];
            const isMastered = progress.masteredVocab.includes(card.id);

            return (
              <div className="space-y-4">
                <div
                  onClick={() => {
                    sounds.playPop();
                    setIsFlipped(!isFlipped);
                  }}
                  className="w-full min-h-[340px] bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6 sm:p-8 flex flex-col items-center justify-between text-center cursor-pointer transition-all hover:border-emerald-400 select-none"
                >
                  <div className="flex items-center justify-between w-full text-xs text-slate-400">
                    <span>Word {studyIndex + 1} of {filteredVocab.length}</span>
                    <span>Tap to flip ↺</span>
                  </div>

                  {!isFlipped ? (
                    <div className="space-y-2 py-4">
                      <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
                        {card.word}
                      </div>
                      <div className="text-sm font-mono text-emerald-600 font-semibold">
                        {card.phonetic}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {card.category}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4 animate-fadeIn">
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        &ldquo;{card.translation}&rdquo;
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="font-semibold text-slate-800">{card.exampleSentence}</div>
                        <div className="text-slate-500 italic">{card.sentenceTranslation}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayAudio(card.word)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear Voice</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        onToggleMasterVocab(card.id);
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
                    disabled={studyIndex === 0}
                    onClick={() => {
                      sounds.playPop();
                      setStudyIndex(prev => Math.max(0, prev - 1));
                      setIsFlipped(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={studyIndex === filteredVocab.length - 1}
                    onClick={() => {
                      sounds.playPop();
                      setStudyIndex(prev => Math.min(filteredVocab.length - 1, prev + 1));
                      setIsFlipped(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white disabled:opacity-40 cursor-pointer"
                  >
                    Next Word
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVocab.map((item) => {
            const isMastered = progress.masteredVocab.includes(item.id);
            const isVoiceActive = activeVoiceVocabId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 transition-all relative ${
                  isMastered
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <h3 className="text-xl font-bold font-display text-slate-900 mt-0.5">
                      {item.word}
                    </h3>
                    <div className="text-xs font-mono font-semibold text-emerald-600 mt-0.5">
                      {item.phonetic}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePlayAudio(item.word)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors"
                      title="Listen audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        onToggleMasterVocab(item.id);
                        if (!isMastered) onAddXp(10);
                      }}
                      className={`p-2 rounded-xl transition-colors ${
                        isMastered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title={isMastered ? 'Mastered word' : 'Mark as mastered'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-800">
                  &ldquo;{item.translation}&rdquo;
                </div>

                {/* Example sentence */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{item.exampleSentence}</span>
                    <button
                      onClick={() => handlePlayAudio(item.exampleSentence)}
                      className="text-slate-400 hover:text-emerald-700"
                      title="Listen sentence"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-slate-500 italic text-[11px]">{item.sentenceTranslation}</div>
                </div>

                {/* Card Speech Test Button */}
                <div className="pt-1">
                  <button
                    onClick={() => handleStartCardVoice(item)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Practice Pronunciation</span>
                  </button>

                  {/* Speech transcript row if active */}
                  {isVoiceActive && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-950">
                        <span>Transcript: &ldquo;{voiceTranscript || 'Listening...'}&rdquo;</span>
                        {voiceScore !== null && (
                          <span className="font-mono font-bold">{voiceScore}%</span>
                        )}
                      </div>
                      {voiceScore !== null && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {voiceScore >= 75 ? 'Excellent pronunciation! +15 XP' : 'Try again for higher accuracy!'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
