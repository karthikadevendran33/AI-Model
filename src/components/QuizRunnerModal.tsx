import React, { useState, useEffect } from 'react';
import { X, Volume2, Mic, CheckCircle2, AlertCircle, Heart, Star, Sparkles, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, UserProgress } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { sounds, speakWord } from '../utils/audio';
import { calculateSimilarity, isSpeechRecognitionSupported, SpeechRecognizer } from '../utils/speechRecognition';

interface QuizRunnerModalProps {
  title: string;
  subtitle?: string;
  stageId?: string;
  questions: QuizQuestion[];
  xpReward: number;
  gemsReward: number;
  progress: UserProgress;
  onClose: () => void;
  onComplete: (data: { stageId?: string; earnedXp: number; earnedGems: number; stars: number }) => void;
  onDeductHeart: () => void;
}

export const QuizRunnerModal: React.FC<QuizRunnerModalProps> = ({
  title,
  subtitle,
  stageId,
  questions,
  xpReward,
  gemsReward,
  progress,
  onClose,
  onComplete,
  onDeductHeart,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [availableScrambleWords, setAvailableScrambleWords] = useState<string[]>([]);
  
  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechScore, setSpeechScore] = useState<number | null>(null);

  // Question validation state
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [heartsRemaining, setHeartsRemaining] = useState(progress.hearts);
  const [combo, setCombo] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  // Initialize scramble words for current question
  useEffect(() => {
    if (currentQ?.type === 'sentence_scramble' && currentQ.scrambleWords) {
      // Shuffle words
      const shuffled = [...currentQ.scrambleWords].sort(() => Math.random() - 0.5);
      setAvailableScrambleWords(shuffled);
      setScrambleAnswer([]);
    }
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSpeechTranscript('');
    setSpeechScore(null);
    setIsListening(false);
  }, [currentIndex, currentQ]);

  // Autoplay audio on listening question
  useEffect(() => {
    if (currentQ?.type === 'listening' && currentQ.audioText) {
      speakWord(currentQ.audioText, currentLang.speechCode, 0.85);
    }
  }, [currentIndex, currentQ]);

  const handlePlayAudio = (text: string) => {
    sounds.playPop();
    speakWord(text, currentLang.speechCode, 0.85);
  };

  // Start speech recognition for voice question
  const handleStartVoice = () => {
    setSpeechTranscript('');
    setSpeechScore(null);

    if (!isSpeechRecognitionSupported()) {
      // Fallback simulation
      const text = currentQ.targetWord || currentQ.correctAnswer;
      setSpeechTranscript(text);
      setSpeechScore(100);
      sounds.playSuccess();
      return;
    }

    sounds.playMicStart();
    const recognizer = new SpeechRecognizer({
      lang: currentLang.speechCode,
      interimResults: true,
      onStart: () => setIsListening(true),
      onResult: ({ transcript: text, isFinal }) => {
        setSpeechTranscript(text);
        const target = currentQ.targetWord || currentQ.correctAnswer;
        const score = calculateSimilarity(target, text);
        setSpeechScore(score);

        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false),
    });
    recognizer.start();
  };

  const handleSimulateSpeech = () => {
    const text = currentQ.targetWord || currentQ.correctAnswer;
    setSpeechTranscript(text);
    setSpeechScore(100);
    sounds.playSuccess();
  };

  const handleSelectScrambleWord = (word: string, indexInAvailable: number) => {
    sounds.playPop();
    setScrambleAnswer([...scrambleAnswer, word]);
    const updated = [...availableScrambleWords];
    updated.splice(indexInAvailable, 1);
    setAvailableScrambleWords(updated);
  };

  const handleRemoveScrambleWord = (word: string, indexInAnswer: number) => {
    sounds.playPop();
    const updated = [...scrambleAnswer];
    updated.splice(indexInAnswer, 1);
    setScrambleAnswer(updated);
    setAvailableScrambleWords([...availableScrambleWords, word]);
  };

  const handleCheckAnswer = () => {
    let correct = false;

    if (currentQ.type === 'multiple_choice' || currentQ.type === 'listening') {
      correct = selectedOption === currentQ.correctAnswer;
    } else if (currentQ.type === 'sentence_scramble') {
      const formed = scrambleAnswer.join(' ').trim();
      correct = formed === currentQ.correctAnswer.trim();
    } else if (currentQ.type === 'speech') {
      const score = speechScore ?? 0;
      correct = score >= 75;
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      sounds.playSuccess();
      setCombo(prev => prev + 1);
      setCorrectAnswersCount(prev => prev + 1);
    } else {
      sounds.playError();
      setCombo(0);
      setHeartsRemaining(prev => Math.max(0, prev - 1));
      onDeductHeart();
    }
  };

  const handleNextQuestion = () => {
    sounds.playPop();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished Quiz!
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsQuizFinished(true);
    sounds.playFanfare();

    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }

    // Determine stars (1 to 3)
    const ratio = correctAnswersCount / (questions.length || 1);
    let stars = 1;
    if (ratio >= 0.9 && heartsRemaining > 0) stars = 3;
    else if (ratio >= 0.6) stars = 2;

    onComplete({
      stageId,
      earnedXp: xpReward,
      earnedGems: gemsReward,
      stars,
    });
  };

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { sounds.playPop(); onClose(); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Combo indicator */}
            {combo > 1 && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{combo}x Combo!</span>
              </div>
            )}

            {/* Hearts remaining */}
            <div className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span className="tabular-nums font-mono">{heartsRemaining}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {!isQuizFinished ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">
                  Challenge {currentIndex + 1} of {questions.length}
                </span>
                <span className="capitalize font-mono">{currentQ.type.replace('_', ' ')}</span>
              </div>

              {/* Question Prompt */}
              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 font-display leading-snug">
                  {currentQ.prompt}
                </h4>

                {currentQ.hint && (
                  <p className="text-xs text-slate-500 italic">Hint: {currentQ.hint}</p>
                )}
              </div>

              {/* TYPE 1: LISTENING QUESTION */}
              {currentQ.type === 'listening' && (
                <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <button
                    onClick={() => handlePlayAudio(currentQ.audioText || '')}
                    className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <span className="text-xs font-bold text-emerald-900">
                    Click to replay audio
                  </span>
                </div>
              )}

              {/* OPTIONS FOR MULTIPLE CHOICE & LISTENING */}
              {(currentQ.type === 'multiple_choice' || currentQ.type === 'listening') && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    let optionStyle = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50';

                    if (isAnswerChecked) {
                      if (option === currentQ.correctAnswer) {
                        optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-rose-500 bg-rose-50 text-rose-900 line-through';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-emerald-600 bg-emerald-50/50 text-slate-900 font-bold ring-2 ring-emerald-500/20';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerChecked}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedOption(option);
                        }}
                        className={`w-full p-4 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{option}</span>
                        <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + idx)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TYPE 2: SENTENCE SCRAMBLE */}
              {currentQ.type === 'sentence_scramble' && (
                <div className="space-y-6">
                  {/* Selected Words Answer Tray */}
                  <div className="min-h-[64px] p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-wrap items-center gap-2">
                    {scrambleAnswer.length === 0 ? (
                      <span className="text-xs text-slate-400 italic mx-auto">
                        Tap words below in the correct sequence...
                      </span>
                    ) : (
                      scrambleAnswer.map((word, idx) => (
                        <button
                          key={idx}
                          disabled={isAnswerChecked}
                          onClick={() => handleRemoveScrambleWord(word, idx)}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          {word}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Available Words Pool */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {availableScrambleWords.map((word, idx) => (
                      <button
                        key={idx}
                        disabled={isAnswerChecked}
                        onClick={() => handleSelectScrambleWord(word, idx)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TYPE 3: SPEECH RECOGNITION CHALLENGE */}
              {currentQ.type === 'speech' && (
                <div className="space-y-5 text-center">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-xs font-semibold text-slate-500">Target to speak:</span>
                    <div className="text-2xl font-extrabold text-slate-900 font-display">
                      {currentQ.targetWord}
                    </div>
                    <button
                      onClick={() => handlePlayAudio(currentQ.targetWord || '')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hear Pronunciation</span>
                    </button>
                  </div>

                  {/* Voice Button */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      disabled={isAnswerChecked}
                      onClick={handleStartVoice}
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-md cursor-pointer ${
                        isListening
                          ? 'bg-rose-600 animate-pulse scale-105'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <Mic className="w-7 h-7" />
                    </button>
                    <span className="text-xs text-slate-500 font-medium">
                      {isListening ? 'Listening... Speak clearly!' : 'Tap mic and speak phrase'}
                    </span>
                  </div>

                  {/* Speech transcript */}
                  {speechTranscript && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="text-slate-500">Heard: &ldquo;{speechTranscript}&rdquo;</div>
                      {speechScore !== null && (
                        <div className="font-mono font-bold text-emerald-700">
                          Pronunciation Accuracy: {speechScore}%
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick test simulation */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSimulateSpeech}
                      className="text-[11px] text-slate-500 hover:text-emerald-700 underline"
                    >
                      Simulate perfect speech for testing
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Screen */
            <div className="text-center py-6 space-y-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900 font-display">
                  Stage Conquered!
                </h3>
                <p className="text-xs text-slate-500">
                  You successfully completed {title}
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3].map((starNum) => {
                  const isEarned = (correctAnswersCount / (questions.length || 1)) >= (starNum === 3 ? 0.9 : starNum === 2 ? 0.6 : 0.3);
                  return (
                    <Star
                      key={starNum}
                      className={`w-8 h-8 ${
                        isEarned ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-200'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Rewards Summary */}
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-semibold">XP Earned</div>
                  <div className="text-xl font-extrabold text-emerald-900 font-mono">+{xpReward}</div>
                </div>
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-center">
                  <div className="text-xs text-cyan-700 font-semibold">Gems Earned</div>
                  <div className="text-xl font-extrabold text-cyan-900 font-mono">+{gemsReward}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80">
          {!isQuizFinished ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Answer Feedback Banner */}
              <div className="flex-1 text-xs">
                {isAnswerChecked && (
                  <div className={`flex items-center gap-2 font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>¡Excelente! Correct answer.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Not quite. Correct: {currentQ.correctAnswer}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-auto flex items-center gap-3">
                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={
                      (currentQ.type === 'multiple_choice' || currentQ.type === 'listening') && !selectedOption ||
                      (currentQ.type === 'sentence_scramble') && scrambleAnswer.length === 0 ||
                      (currentQ.type === 'speech') && speechScore === null
                    }
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{currentIndex < questions.length - 1 ? 'Next Challenge' : 'Complete Quest'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => { sounds.playPop(); onClose(); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Collect Rewards & Return to Map
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
