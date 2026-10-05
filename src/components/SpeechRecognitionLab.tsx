import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, RotateCcw, Award, Info, AlertCircle, Play } from 'lucide-react';
import { SupportedLanguageId, UserProgress } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageData } from '../data/languages';
import { sounds, speakWord } from '../utils/audio';
import { SpeechRecognizer, calculateSimilarity, isSpeechRecognitionSupported } from '../utils/speechRecognition';

interface SpeechRecognitionLabProps {
  progress: UserProgress;
  onAddXp: (amount: number) => void;
}

export const SpeechRecognitionLab: React.FC<SpeechRecognitionLabProps> = ({
  progress,
  onAddXp,
}) => {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === progress.currentLanguage) || SUPPORTED_LANGUAGES[0];
  const langData = getLanguageData(progress.currentLanguage);

  // Preset phrases based on current language
  const defaultPhrases = [
    ...(langData.vocab.slice(0, 8).map(v => ({
      text: v.word,
      phonetic: v.phonetic,
      translation: v.translation,
      sentence: v.exampleSentence,
    }))),
  ];

  const [selectedPhrase, setSelectedPhrase] = useState(defaultPhrases[0] || {
    text: 'Hola',
    phonetic: 'OH-lah',
    translation: 'Hello',
    sentence: '¡Hola! ¿Cómo estás?',
  });

  const [customInput, setCustomInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [hasScored, setHasScored] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  // Update selected phrase when language changes
  useEffect(() => {
    if (defaultPhrases.length > 0) {
      setSelectedPhrase(defaultPhrases[0]);
      setTranscript('');
      setSimilarity(null);
      setHasScored(false);
    }
  }, [progress.currentLanguage]);

  // Clean up recognizer on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setSimilarity(null);
    setHasScored(false);

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(
        'Web Speech API is not supported in this browser. You can still use the "Simulate Speech" test buttons below to try the evaluation engine!'
      );
      return;
    }

    sounds.playMicStart();

    const recognizer = new SpeechRecognizer({
      lang: currentLang.speechCode,
      interimResults: true,
      continuous: false,
      onStart: () => {
        setIsListening(true);
      },
      onResult: ({ transcript: text, isFinal }) => {
        setTranscript(text);
        const score = calculateSimilarity(selectedPhrase.text, text);
        setSimilarity(score);

        if (isFinal) {
          setIsListening(false);
          setHasScored(true);
          evaluateScore(score);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(`Microphone error: ${err}. Check permissions or use the simulation button below.`);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
    if (transcript) {
      const score = calculateSimilarity(selectedPhrase.text, transcript);
      setSimilarity(score);
      setHasScored(true);
      evaluateScore(score);
    }
  };

  const evaluateScore = (score: number) => {
    if (score >= 80) {
      sounds.playSuccess();
      onAddXp(20);
    } else if (score >= 50) {
      sounds.playPop();
      onAddXp(10);
    } else {
      sounds.playError();
    }
  };

  const handleSimulateSpeech = (text: string) => {
    sounds.playPop();
    setTranscript(text);
    const score = calculateSimilarity(selectedPhrase.text, text);
    setSimilarity(score);
    setHasScored(true);
    evaluateScore(score);
  };

  const handlePlayTTS = async (text: string, rate: number = 0.85) => {
    setIsSpeakingTts(true);
    await speakWord(text, currentLang.speechCode, rate);
    setIsSpeakingTts(false);
  };

  const handleSetCustomPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setSelectedPhrase({
      text: customInput.trim(),
      phonetic: 'Custom phrase',
      translation: 'User submitted text',
      sentence: customInput.trim(),
    });
    setCustomInput('');
    setTranscript('');
    setSimilarity(null);
    setHasScored(false);
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto px-4">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Real-Time Voice Recognition Engine</span>
              <span aria-hidden="true">·</span>
              <span>{currentLang.name} ({currentLang.speechCode})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Speech & Pronunciation Lab
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Speak native phrases into your microphone. Our phonetic matching engine provides real-time transcription, similarity scoring, and instant accent feedback.
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-indigo-500/30 bg-indigo-950/50 shadow-inner">
            <img
              src="/src/assets/images/lingua_speech_practice_1791194856758.jpg"
              alt="Speech Lab Audio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Pronunciation Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Active Phrase Card & Microphone */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
            <span className="font-semibold uppercase tracking-wider text-emerald-700">Target Expression</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayTTS(selectedPhrase.text, 0.9)}
                disabled={isSpeakingTts}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen Native</span>
              </button>
              <button
                onClick={() => handlePlayTTS(selectedPhrase.text, 0.65)}
                disabled={isSpeakingTts}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Slow 🐢</span>
              </button>
            </div>
          </div>

          {/* Large Target Word Display */}
          <div className="text-center space-y-2 py-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              {selectedPhrase.text}
            </h2>
            <div className="text-sm font-mono text-emerald-600 font-semibold">
              {selectedPhrase.phonetic}
            </div>
            <div className="text-sm text-slate-500 font-medium">
              &ldquo;{selectedPhrase.translation}&rdquo;
            </div>

            {selectedPhrase.sentence && selectedPhrase.sentence !== selectedPhrase.text && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                <span className="font-semibold text-slate-700">Example Context: </span>
                <span className="italic">{selectedPhrase.sentence}</span>
              </div>
            )}
          </div>

          {/* Interactive Microphone Button with Pulse Rings */}
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute -inset-3 rounded-full bg-rose-500/10 animate-pulse-ring" />
                </>
              )}

              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white scale-105 hover:bg-rose-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105'
                }`}
                title={isListening ? 'Click to finish speaking' : 'Click and speak'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className={`text-xs font-bold ${isListening ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>
                {isListening ? 'Listening now... Speak into your mic!' : 'Tap mic and pronounce the phrase'}
              </span>
              <p className="text-[11px] text-slate-400">
                Language set to: <strong className="text-slate-600">{currentLang.speechCode}</strong>
              </p>
            </div>
          </div>

          {/* Error notice if mic failed or permissions blocked */}
          {errorMessage && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Speech Result / Transcript Box */}
          {(transcript || isListening) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Speech Recognition Transcript:</span>
                {similarity !== null && (
                  <span className="font-mono font-bold text-slate-800 tabular-nums">
                    Match: {similarity}%
                  </span>
                )}
              </div>

              <div className="text-base font-medium text-slate-900 bg-white p-3 rounded-lg border border-slate-200 min-h-[48px] flex items-center">
                {transcript ? (
                  <span>&ldquo;{transcript}&rdquo;</span>
                ) : (
                  <span className="text-slate-400 italic">Listening for voice...</span>
                )}
              </div>

              {/* Similarity Meter Bar */}
              {similarity !== null && (
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        similarity >= 85
                          ? 'bg-emerald-500'
                          : similarity >= 65
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${similarity}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1">
                      {similarity >= 85 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Native level pronunciation! (+20 XP)</span>
                        </>
                      ) : similarity >= 60 ? (
                        <span className="text-amber-700">Understandable accent, slight pitch difference (+10 XP)</span>
                      ) : (
                        <span className="text-rose-700">Keep practicing! Listen to the native audio and retry.</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simulator Actions: Allows testing anytime even if mic is unconfigured */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quick Voice Test Simulators
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateSpeech(selectedPhrase.text)}
                className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Test 100% Perfect Match
              </button>
              <button
                onClick={() => handleSimulateSpeech(selectedPhrase.text.slice(0, Math.ceil(selectedPhrase.text.length * 0.75)))}
                className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Test Partial Accent
              </button>
              <button
                onClick={() => {
                  setTranscript('');
                  setSimilarity(null);
                  setHasScored(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Phrase Library & Custom Phrase Input */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom Text Input Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 font-display">Test Any Custom Word</h3>
            <p className="text-xs text-slate-500">
              Type any word or sentence in {currentLang.name} to test your pronunciation.
            </p>
            <form onSubmit={handleSetCustomPhrase} className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={`e.g. ${currentLang.id === 'es' ? 'Buenos días' : currentLang.id === 'ja' ? 'ありがとう' : 'Bonjour'}`}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Set Phrase
              </button>
            </form>
          </div>

          {/* Curated Phrase Library */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display">Curated Pronunciation Drills</h3>
              <span className="text-xs text-slate-500 font-mono">{defaultPhrases.length} items</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {defaultPhrases.map((phrase, idx) => {
                const isSelected = selectedPhrase.text === phrase.text;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedPhrase(phrase);
                      setTranscript('');
                      setSimilarity(null);
                      setHasScored(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500/50 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{phrase.text}</div>
                      <div className="text-[11px] text-slate-500">{phrase.translation}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTTS(phrase.text);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-emerald-700 transition-colors"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
