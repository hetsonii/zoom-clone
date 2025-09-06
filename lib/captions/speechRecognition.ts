// lib/captions/speechRecognition.ts

import { TranscriptEntry } from './types';

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  grammars?: any;
}

export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;
  private callbacks: {
    onResult?: (entry: TranscriptEntry) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onStatusChange?: (status: string) => void;
  } = {};
  
  private startTime: Date | null = null;
  private autoRestart: boolean = true;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: SpeechRecognitionConfig) {
    this.initializeRecognition(config);
  }

  private initializeRecognition(config: SpeechRecognitionConfig) {
    if (typeof window === 'undefined') {
      throw new Error('Speech recognition is only available in browser environment');
    }

    const SpeechRecognition = 
      (window as any).webkitSpeechRecognition || 
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;
    this.recognition.lang = config.language;

    if (config.grammars) {
      this.recognition.grammars = config.grammars;
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.recognition.onstart = () => {
      this.isListening = true;
      this.startTime = new Date();
      this.callbacks.onStart?.();
      this.callbacks.onStatusChange?.('listening');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
      this.callbacks.onStatusChange?.('stopped');

      // Auto-restart if enabled and not manually stopped
      if (this.autoRestart && this.isListening) {
        this.restartTimer = setTimeout(() => {
          this.start();
        }, 1000);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      this.callbacks.onError?.(event.error);
      this.callbacks.onStatusChange?.('error');

      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          // Silent timeout, restart
          if (this.autoRestart) {
            setTimeout(() => this.start(), 500);
          }
          break;
        case 'audio-capture':
          this.callbacks.onError?.('Microphone not available');
          break;
        case 'not-allowed':
          this.callbacks.onError?.('Microphone permission denied');
          break;
        case 'network':
          this.callbacks.onError?.('Network error');
          if (this.autoRestart) {
            setTimeout(() => this.start(), 2000);
          }
          break;
        case 'aborted':
          // User aborted, don't restart
          break;
        default:
          this.callbacks.onError?.(`Recognition error: ${event.error}`);
      }
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const currentIndex = event.resultIndex;

      for (let i = currentIndex; i < results.length; i++) {
        const result = results[i];
        const alternative = result[0];
        
        const entry: TranscriptEntry = {
          text: this.processTranscript(alternative.transcript),
          timestamp: new Date(),
          startTime: this.startTime || new Date(),
          endTime: new Date(),
          confidence: alternative.confidence || 0,
          isFinal: result.isFinal,
          speaker: 'User', // Could be enhanced with speaker detection
        };

        this.callbacks.onResult?.(entry);

        // Reset start time for next utterance
        if (result.isFinal) {
          this.startTime = new Date();
        }
      }
    };

    this.recognition.onspeechstart = () => {
      this.callbacks.onStatusChange?.('speech-detected');
    };

    this.recognition.onspeechend = () => {
      this.callbacks.onStatusChange?.('speech-ended');
    };

    this.recognition.onnomatch = () => {
      this.callbacks.onStatusChange?.('no-match');
    };
  }

  private processTranscript(text: string): string {
    // Basic text processing
    text = text.trim();
    
    // Capitalize first letter
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    // Fix common issues
    text = text.replace(/\bi\b/g, 'I');
    text = text.replace(/\s+/g, ' ');

    return text;
  }

  public start() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    try {
      this.recognition.start();
    } catch (error) {
      if ((error as any).name === 'InvalidStateError') {
        // Already started, ignore
        console.log('Recognition already started');
      } else {
        throw error;
      }
    }
  }

  public stop() {
    this.autoRestart = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.recognition.stop();
  }

  public abort() {
    this.autoRestart = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.recognition.abort();
  }

  public setLanguage(language: string) {
    this.recognition.lang = language;
    if (this.isListening) {
      this.stop();
      setTimeout(() => {
        this.autoRestart = true;
        this.start();
      }, 100);
    }
  }

  public setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setAutoRestart(enabled: boolean) {
    this.autoRestart = enabled;
  }

  // Check browser support
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).webkitSpeechRecognition || 
      (window as any).SpeechRecognition
    );
  }

  // Get supported languages
  public static getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'sv-SE', name: 'Swedish' },
      { code: 'no-NO', name: 'Norwegian' },
      { code: 'da-DK', name: 'Danish' },
      { code: 'fi-FI', name: 'Finnish' },
      { code: 'pl-PL', name: 'Polish' },
      { code: 'tr-TR', name: 'Turkish' },
      { code: 'th-TH', name: 'Thai' },
      { code: 'vi-VN', name: 'Vietnamese' },
      { code: 'id-ID', name: 'Indonesian' },
      { code: 'ms-MY', name: 'Malay' },
      { code: 'fil-PH', name: 'Filipino' },
      { code: 'he-IL', name: 'Hebrew' },
      { code: 'cs-CZ', name: 'Czech' },
      { code: 'sk-SK', name: 'Slovak' },
      { code: 'hu-HU', name: 'Hungarian' },
      { code: 'ro-RO', name: 'Romanian' },
      { code: 'bg-BG', name: 'Bulgarian' },
      { code: 'hr-HR', name: 'Croatian' },
      { code: 'sr-RS', name: 'Serbian' },
      { code: 'uk-UA', name: 'Ukrainian' },
      { code: 'el-GR', name: 'Greek' },
    ];
  }
}