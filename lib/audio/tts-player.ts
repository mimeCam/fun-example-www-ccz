/**
 * Text-to-Speech (TTS) Player
 *
 * A simple, elegant TTS utility for listening to articles.
 * Uses the Web Speech API for browser-native speech synthesis.
 *
 * Design Philosophy (from Tanya):
 * - ONE primary action: Play/Pause
 * - Minimal controls (speed, skip)
 * - Persistent state
 * - Auto-advance through journey
 */

export type TTSState = 'idle' | 'playing' | 'paused' | 'loading';

export interface TTSPlayerConfig {
  rate?: number;        // Speech rate (0.1 to 10)
  pitch?: number;       // Speech pitch (0 to 2)
  volume?: number;      // Volume (0 to 1)
  voice?: SpeechSynthesisVoice | null;
  onStateChange?: (state: TTSState) => void;
  onError?: (error: string) => void;
  onProgress?: (currentText: string, currentIndex: number) => void;
}

export interface TTSPlaybackProgress {
  currentText: string;
  currentIndex: number;
  totalSegments: number;
  isPlaying: boolean;
}

/**
 * TTS Player Class
 *
 * Manages text-to-speech playback with state persistence
 * and journey-aware auto-advance.
 */
export class TTSPlayer {
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private textSegments: string[] = [];
  private currentIndex: number = 0;
  private config: Required<TTSPlayerConfig>;
  private state: TTSState = 'idle';
  private resumePosition: number = 0;

  constructor(config: TTSPlayerConfig = {}) {
    this.synthesis = window.speechSynthesis;
    this.config = {
      rate: config.rate ?? 1.0,
      pitch: config.pitch ?? 1.0,
      volume: config.volume ?? 1.0,
      voice: config.voice ?? null,
      onStateChange: config.onStateChange ?? (() => {}),
      onError: config.onError ?? (() => {}),
      onProgress: config.onProgress ?? (() => {}),
    };

    // Wait for voices to load
    if (this.synthesis.getVoices().length === 0) {
      this.synthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Get default voice (prefer English)
   */
  getDefaultVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    return englishVoice || voices[0] || null;
  }

  /**
   * Prepare text for TTS by splitting into sentences
   */
  private prepareText(text: string): string[] {
    // Split by sentence boundaries, but keep paragraphs intact
    const sentences = text
      .replace(/\n+/g, ' ')  // Replace newlines with spaces
      .split(/(?<=[.!?])\s+/)  // Split at sentence boundaries
      .filter(s => s.trim().length > 0);  // Remove empty strings

    return sentences;
  }

  /**
   * Load content for playback
   */
  loadContent(content: string): void {
    this.stop();
    this.textSegments = this.prepareText(content);
    this.currentIndex = 0;
    this.setState('idle');
  }

  /**
   * Play from current position
   */
  play(): void {
    if (this.textSegments.length === 0) {
      this.config.onError('No content loaded');
      return;
    }

    if (this.state === 'paused') {
      this.synthesis.resume();
      this.setState('playing');
      return;
    }

    if (this.state === 'playing') {
      return; // Already playing
    }

    this.playSegment(this.currentIndex);
  }

  /**
   * Play a specific text segment
   */
  private playSegment(index: number): void {
    if (index >= this.textSegments.length) {
      this.setState('idle');
      return;
    }

    this.setState('loading');

    // Cancel any existing utterance
    if (this.utterance) {
      this.synthesis.cancel();
    }

    this.utterance = new SpeechSynthesisUtterance(this.textSegments[index]);
    this.utterance.rate = this.config.rate;
    this.utterance.pitch = this.config.pitch;
    this.utterance.volume = this.config.volume;
    this.utterance.voice = this.config.voice || this.getDefaultVoice();

    // Event handlers
    this.utterance.onstart = () => {
      this.setState('playing');
      this.config.onProgress(this.textSegments[index], index);
    };

    this.utterance.onend = () => {
      this.currentIndex++;
      if (this.currentIndex < this.textSegments.length) {
        // Auto-advance to next segment
        this.playSegment(this.currentIndex);
      } else {
        // Reached end of content
        this.setState('idle');
      }
    };

    this.utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        this.config.onError(`Speech error: ${event.error}`);
        this.setState('idle');
      }
    };

    this.synthesis.speak(this.utterance);
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.state === 'playing') {
      this.synthesis.pause();
      this.setState('paused');
    }
  }

  /**
   * Stop playback and reset position
   */
  stop(): void {
    this.synthesis.cancel();
    this.currentIndex = 0;
    this.setState('idle');
  }

  /**
   * Skip forward by number of sentences
   */
  skipForward(segments: number = 1): void {
    const wasPlaying = this.state === 'playing';
    this.synthesis.cancel();

    this.currentIndex = Math.min(
      this.currentIndex + segments,
      this.textSegments.length - 1
    );

    if (wasPlaying) {
      this.playSegment(this.currentIndex);
    } else {
      this.config.onProgress(this.textSegments[this.currentIndex], this.currentIndex);
    }
  }

  /**
   * Skip backward by number of sentences
   */
  skipBackward(segments: number = 1): void {
    const wasPlaying = this.state === 'playing';
    this.synthesis.cancel();

    this.currentIndex = Math.max(this.currentIndex - segments, 0);

    if (wasPlaying) {
      this.playSegment(this.currentIndex);
    } else {
      this.config.onProgress(this.textSegments[this.currentIndex], this.currentIndex);
    }
  }

  /**
   * Jump to specific position (0-1)
   */
  seekToPosition(position: number): void {
    const targetIndex = Math.floor(position * this.textSegments.length);
    const wasPlaying = this.state === 'playing';
    this.synthesis.cancel();
    this.currentIndex = Math.max(0, Math.min(targetIndex, this.textSegments.length - 1));

    if (wasPlaying) {
      this.playSegment(this.currentIndex);
    } else {
      this.config.onProgress(this.textSegments[this.currentIndex], this.currentIndex);
    }
  }

  /**
   * Set playback rate (speed)
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
    if (this.utterance && this.state === 'playing') {
      const wasPlaying = true;
      this.synthesis.cancel();
      this.playSegment(this.currentIndex);
    }
  }

  /**
   * Get current playback progress
   */
  getProgress(): TTSPlaybackProgress {
    return {
      currentText: this.textSegments[this.currentIndex] || '',
      currentIndex: this.currentIndex,
      totalSegments: this.textSegments.length,
      isPlaying: this.state === 'playing',
    };
  }

  /**
   * Get current state
   */
  getState(): TTSState {
    return this.state;
  }

  /**
   * Check if content is loaded
   */
  hasContent(): boolean {
    return this.textSegments.length > 0;
  }

  /**
   * Update state and notify listeners
   */
  private setState(state: TTSState): void {
    this.state = state;
    this.config.onStateChange(state);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.textSegments = [];
  }
}

/**
 * Create a singleton TTS player instance
 */
let globalTTSPlayer: TTSPlayer | null = null;

export function getTTSPlayer(config?: TTSPlayerConfig): TTSPlayer {
  if (!globalTTSPlayer) {
    globalTTSPlayer = new TTSPlayer(config);
  }
  return globalTTSPlayer;
}

/**
 * Helper function to extract text content from HTML
 */
export function extractTextFromHTML(html: string): string {
  // Create a temporary DOM element
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // Remove script and style elements
  const scripts = tmp.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());

  // Get text content
  return tmp.textContent || tmp.innerText || '';
}
