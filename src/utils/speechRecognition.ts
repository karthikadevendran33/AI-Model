// Speech Recognition (Web Speech API) & Pronunciation Accuracy Matcher

// Standardize browser SpeechRecognition interface
export interface SpeechRecognitionResultState {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  score: number; // 0 - 100%
  isMatch: boolean;
}

// Calculate similarity percentage between target and spoken transcript
export function calculateSimilarity(target: string, spoken: string): number {
  if (!target || !spoken) return 0;

  // Clean strings: remove punctuation, lowercase, collapse whitespace
  const cleanTarget = normalizeText(target);
  const cleanSpoken = normalizeText(spoken);

  if (cleanTarget === cleanSpoken) return 100;
  if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
    const ratio = Math.min(cleanTarget.length, cleanSpoken.length) / Math.max(cleanTarget.length, cleanSpoken.length);
    return Math.round(85 + ratio * 15);
  }

  // Levenshtein distance
  const distance = levenshteinDistance(cleanTarget, cleanSpoken);
  const maxLen = Math.max(cleanTarget.length, cleanSpoken.length);
  if (maxLen === 0) return 100;

  const score = Math.max(0, Math.round((1 - distance / maxLen) * 100));
  return score;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics for phonetic comparison
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'¿¡]/g, '')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Browser API helper
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export interface SpeechRecognitionOptions {
  lang: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (result: { transcript: string; isFinal: boolean; confidence: number }) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}

export class SpeechRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  public isListening: boolean = false;

  constructor(private options: SpeechRecognitionOptions) {
    if (!isSpeechRecognitionSupported()) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRec();
    this.recognition.lang = options.lang;
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onstart = () => {
      this.isListening = true;
      this.options.onStart?.();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let confidence = 0.9;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
          confidence = item[0].confidence || 0.9;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const activeTranscript = finalTranscript || interimTranscript;
      this.options.onResult({
        transcript: activeTranscript,
        isFinal: Boolean(finalTranscript),
        confidence,
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      this.options.onError(event.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd();
    };
  }

  start() {
    if (!this.recognition) {
      this.options.onError('Speech recognition is not supported in this browser.');
      return;
    }
    try {
      this.recognition.start();
    } catch {
      // might already be started
    }
  }

  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // safe
    }
    this.isListening = false;
  }
}
